import { and, desc, eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { db } from '../db';
import { courseTable, examResultTable, examSessionTable, generatedExamTable } from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

type JsonObject = Record<string, unknown>;

interface EvaluatedQuestion {
  questionId: string;
  maxMarks: number;
  awardedMarks: number;
  feedback: string;
}

interface EvaluationOutput {
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  aiFeedback: string;
  evaluation: {
    overallFeedback: string;
    breakdown: EvaluatedQuestion[];
  };
}

const isJsonObject = (value: unknown): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const extractTextContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        if (isJsonObject(part) && typeof part.text === 'string') {
          return part.text;
        }

        return '';
      })
      .join('\n')
      .trim();
  }

  return '';
};

const extractJsonFromModelOutput = (text: string): unknown => {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('Gemini returned empty evaluation');
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const rawJson = fenced ? fenced[1] : trimmed;

  return JSON.parse(rawJson);
};

const toPositiveNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  return fallback;
};

const getGeminiEvaluationModel = (): ChatGoogleGenerativeAI => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    temperature: 0.2,
    maxOutputTokens: 8192,
    apiKey: process.env.GEMINI_API_KEY,
  });
};

const runGeminiEvaluation = async (
  examPaper: unknown,
  answers: unknown
): Promise<EvaluationOutput> => {
  const model = getGeminiEvaluationModel();

  const prompt = [
    'Evaluate the student answers against the exam answer key.',
    'Return strict JSON only and no markdown.',
    '',
    'Exam Paper JSON:',
    JSON.stringify(examPaper),
    '',
    'Student Answers JSON:',
    JSON.stringify(answers),
    '',
    'Return with this exact shape:',
    JSON.stringify(
      {
        totalMarks: 100,
        obtainedMarks: 76.5,
        percentage: 76.5,
        grade: 'B+',
        aiFeedback: 'Good work overall.',
        evaluation: {
          overallFeedback: 'Strong conceptual understanding, but improve precision.',
          breakdown: [
            {
              questionId: 'q1',
              maxMarks: 10,
              awardedMarks: 8,
              feedback: 'Good answer with a minor mistake in step 2.',
            },
          ],
        },
      },
      null,
      2
    ),
  ].join('\n');

  const response = await model.invoke([
    new SystemMessage('You are an expert exam evaluator that outputs strict JSON only.'),
    new HumanMessage(prompt),
  ]);

  const text = extractTextContent(response.content);
  const parsed = extractJsonFromModelOutput(text);

  if (!isJsonObject(parsed)) {
    throw new Error('Invalid evaluation payload from Gemini');
  }

  const evaluation = isJsonObject(parsed.evaluation) ? parsed.evaluation : {};
  const breakdownRaw = Array.isArray(evaluation.breakdown) ? evaluation.breakdown : [];

  const breakdown: EvaluatedQuestion[] = breakdownRaw.map((item, index) => {
    const row = isJsonObject(item) ? item : {};

    return {
      questionId: typeof row.questionId === 'string' ? row.questionId : `q${index + 1}`,
      maxMarks: toPositiveNumber(row.maxMarks, 0),
      awardedMarks: toPositiveNumber(row.awardedMarks, 0),
      feedback: typeof row.feedback === 'string' ? row.feedback : 'No feedback provided.',
    };
  });

  const totalMarks = toPositiveNumber(parsed.totalMarks, breakdown.reduce((acc, cur) => acc + cur.maxMarks, 0));
  const obtainedMarks = toPositiveNumber(parsed.obtainedMarks, breakdown.reduce((acc, cur) => acc + cur.awardedMarks, 0));
  const percentage = totalMarks > 0 ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0;

  return {
    totalMarks,
    obtainedMarks,
    percentage,
    grade: typeof parsed.grade === 'string' ? parsed.grade : 'N/A',
    aiFeedback: typeof parsed.aiFeedback === 'string' ? parsed.aiFeedback : 'No feedback available.',
    evaluation: {
      overallFeedback:
        typeof evaluation.overallFeedback === 'string'
          ? evaluation.overallFeedback
          : 'Evaluation completed successfully.',
      breakdown,
    },
  };
};

// GET /api/exam-results
export const getExamResults = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const results = await db
        .select()
        .from(examResultTable)
        .where(eq(examResultTable.userId, userId))
        .orderBy(desc(examResultTable.evaluatedAt));

      return res.status(200).json(new ApiResponse(200, results, 'Exam results fetched successfully'));
    } catch (error) {
      console.error('Error listing exam results:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// GET /api/exam-results/:id
export const getExamResultById = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const examResultId = req.params.id as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [result] = await db
        .select()
        .from(examResultTable)
        .where(and(eq(examResultTable.examResultId, examResultId), eq(examResultTable.userId, userId)));

      if (!result) {
        return res.status(404).json(new ApiResponse(404, {}, 'Exam result not found'));
      }

      return res.status(200).json(new ApiResponse(200, result, 'Exam result fetched successfully'));
    } catch (error) {
      console.error('Error fetching exam result:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// GET /api/exam-results/:id/breakdown
export const getExamResultBreakdown = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const examResultId = req.params.id as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [result] = await db
        .select({
          examResultId: examResultTable.examResultId,
          evaluation: examResultTable.evaluation,
          aiFeedback: examResultTable.aiFeedback,
          obtainedMarks: examResultTable.obtainedMarks,
          totalMarks: examResultTable.totalMarks,
        })
        .from(examResultTable)
        .where(and(eq(examResultTable.examResultId, examResultId), eq(examResultTable.userId, userId)));

      if (!result) {
        return res.status(404).json(new ApiResponse(404, {}, 'Exam result not found'));
      }

      const evaluation = isJsonObject(result.evaluation) ? result.evaluation : {};
      const breakdown = Array.isArray(evaluation.breakdown) ? evaluation.breakdown : [];

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            examResultId: result.examResultId,
            obtainedMarks: result.obtainedMarks,
            totalMarks: result.totalMarks,
            aiFeedback: result.aiFeedback,
            overallFeedback: isJsonObject(evaluation) ? evaluation.overallFeedback : null,
            breakdown,
          },
          'Exam result breakdown fetched successfully'
        )
      );
    } catch (error) {
      console.error('Error fetching result breakdown:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// POST /api/exam-results/:sessionId/evaluate
export const evaluateExamSession = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const sessionId = req.params.sessionId as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [session] = await db
        .select()
        .from(examSessionTable)
        .where(and(eq(examSessionTable.examSessionId, sessionId), eq(examSessionTable.userId, userId)));

      if (!session) {
        return res.status(404).json(new ApiResponse(404, {}, 'Exam session not found'));
      }

      const [exam] = await db
        .select({
          generatedExamId: generatedExamTable.generatedExamId,
          paper: generatedExamTable.paper,
        })
        .from(generatedExamTable)
        .innerJoin(courseTable, eq(generatedExamTable.courseId, courseTable.courseId))
        .where(
          and(
            eq(generatedExamTable.generatedExamId, session.generatedExamId),
            eq(courseTable.userId, userId)
          )
        );

      if (!exam) {
        return res.status(404).json(new ApiResponse(404, {}, 'Generated exam not found'));
      }

      const evaluationOutput = await runGeminiEvaluation(exam.paper, session.answers);

      const existingResult = await db
        .select({ examResultId: examResultTable.examResultId })
        .from(examResultTable)
        .where(and(eq(examResultTable.examSessionId, sessionId), eq(examResultTable.userId, userId)));

      const resultPayload = {
        examSessionId: sessionId,
        userId,
        totalMarks: Math.round(evaluationOutput.totalMarks),
        obtainedMarks: evaluationOutput.obtainedMarks.toFixed(2),
        percentage: evaluationOutput.percentage.toFixed(2),
        grade: evaluationOutput.grade,
        evaluation: evaluationOutput.evaluation,
        aiFeedback: evaluationOutput.aiFeedback,
        evaluatedAt: new Date(),
      };

      let finalResult;

      if (existingResult.length > 0) {
        const [updatedResult] = await db
          .update(examResultTable)
          .set(resultPayload)
          .where(eq(examResultTable.examResultId, existingResult[0].examResultId))
          .returning();
        finalResult = updatedResult;
      } else {
        const [createdResult] = await db
          .insert(examResultTable)
          .values({
            examResultId: nanoid(),
            ...resultPayload,
          })
          .returning();
        finalResult = createdResult;
      }

      await db
        .update(examSessionTable)
        .set({ status: session.status === 'submitted' ? 'submitted' : 'submitted', submittedAt: new Date() })
        .where(eq(examSessionTable.examSessionId, sessionId));

      return res.status(200).json(new ApiResponse(200, finalResult, 'Exam evaluated successfully'));
    } catch (error) {
      console.error('Error evaluating exam session:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
