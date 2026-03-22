import { and, desc, eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { courseTable, examSessionTable, generatedExamTable } from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

type JsonObject = Record<string, unknown>;

const isJsonObject = (value: unknown): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const getDurationFromPaper = (paper: unknown): number => {
  if (!isJsonObject(paper)) {
    return 60;
  }

  const duration = paper.estimatedDurationMinutes;
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
    return Math.round(duration);
  }

  return 60;
};

const assertOwnedSession = async (examSessionId: string, userId: string) => {
  const [session] = await db
    .select()
    .from(examSessionTable)
    .where(and(eq(examSessionTable.examSessionId, examSessionId), eq(examSessionTable.userId, userId)));

  return session;
};

// POST /api/exam-sessions
export const startExamSession = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { generatedExamId } = req.body as { generatedExamId?: string };

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      if (!generatedExamId) {
        return res.status(400).json(new ApiResponse(400, {}, 'generatedExamId is required'));
      }

      const [examRow] = await db
        .select({
          generatedExamId: generatedExamTable.generatedExamId,
          paper: generatedExamTable.paper,
        })
        .from(generatedExamTable)
        .innerJoin(courseTable, eq(generatedExamTable.courseId, courseTable.courseId))
        .where(
          and(
            eq(generatedExamTable.generatedExamId, generatedExamId),
            eq(courseTable.userId, userId)
          )
        );

      if (!examRow) {
        return res.status(404).json(new ApiResponse(404, {}, 'Generated exam not found'));
      }

      const durationMinutes = getDurationFromPaper(examRow.paper);
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

      const [session] = await db
        .insert(examSessionTable)
        .values({
          examSessionId: nanoid(),
          userId,
          generatedExamId,
          status: 'in_progress',
          expiresAt,
          selectedQuestions: [],
          answers: {},
        })
        .returning();

      return res.status(201).json(new ApiResponse(201, session, 'Exam session started successfully'));
    } catch (error) {
      console.error('Error starting exam session:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// GET /api/exam-sessions
export const getExamSessions = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const sessions = await db
        .select()
        .from(examSessionTable)
        .where(eq(examSessionTable.userId, userId))
        .orderBy(desc(examSessionTable.createdAt));

      return res.status(200).json(new ApiResponse(200, sessions, 'Exam sessions fetched successfully'));
    } catch (error) {
      console.error('Error listing exam sessions:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// GET /api/exam-sessions/:id
export const getExamSessionById = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const examSessionId = req.params.id as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const session = await assertOwnedSession(examSessionId, userId);

      if (!session) {
        return res.status(404).json(new ApiResponse(404, {}, 'Exam session not found'));
      }

      return res.status(200).json(new ApiResponse(200, session, 'Exam session fetched successfully'));
    } catch (error) {
      console.error('Error fetching exam session:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// GET /api/exam-sessions/:id/time
export const getExamSessionRemainingTime = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const examSessionId = req.params.id as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const session = await assertOwnedSession(examSessionId, userId);

      if (!session) {
        return res.status(404).json(new ApiResponse(404, {}, 'Exam session not found'));
      }

      const expiresAtMs = new Date(session.expiresAt).getTime();
      const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));

      return res.status(200).json(
        new ApiResponse(200, {
          examSessionId: session.examSessionId,
          status: session.status,
          remainingSeconds,
          expiresAt: session.expiresAt,
        }, 'Remaining time fetched successfully')
      );
    } catch (error) {
      console.error('Error getting exam remaining time:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// PUT /api/exam-sessions/:id/answers
export const saveExamSessionAnswers = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const examSessionId = req.params.id as string;
      const { answers } = req.body as { answers?: JsonObject };

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      if (!isJsonObject(answers)) {
        return res.status(400).json(new ApiResponse(400, {}, 'answers must be a valid object'));
      }

      const session = await assertOwnedSession(examSessionId, userId);

      if (!session) {
        return res.status(404).json(new ApiResponse(404, {}, 'Exam session not found'));
      }

      if (session.status !== 'in_progress') {
        return res.status(409).json(new ApiResponse(409, {}, 'Session is not editable'));
      }

      const existingAnswers = isJsonObject(session.answers) ? session.answers : {};
      const mergedAnswers = { ...existingAnswers, ...answers };

      const [updatedSession] = await db
        .update(examSessionTable)
        .set({ answers: mergedAnswers })
        .where(eq(examSessionTable.examSessionId, examSessionId))
        .returning();

      return res.status(200).json(new ApiResponse(200, updatedSession, 'Answers saved successfully'));
    } catch (error) {
      console.error('Error saving exam answers:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// PUT /api/exam-sessions/:id/select-questions
export const selectExamQuestions = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const examSessionId = req.params.id as string;
      const { selectedQuestions } = req.body as { selectedQuestions?: string[] };

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      if (!Array.isArray(selectedQuestions)) {
        return res.status(400).json(new ApiResponse(400, {}, 'selectedQuestions must be an array'));
      }

      const session = await assertOwnedSession(examSessionId, userId);

      if (!session) {
        return res.status(404).json(new ApiResponse(404, {}, 'Exam session not found'));
      }

      if (session.status !== 'in_progress') {
        return res.status(409).json(new ApiResponse(409, {}, 'Session is not editable'));
      }

      const [updatedSession] = await db
        .update(examSessionTable)
        .set({ selectedQuestions })
        .where(eq(examSessionTable.examSessionId, examSessionId))
        .returning();

      return res
        .status(200)
        .json(new ApiResponse(200, updatedSession, 'Selected questions saved successfully'));
    } catch (error) {
      console.error('Error selecting exam questions:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// POST /api/exam-sessions/:id/submit
export const submitExamSession = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const examSessionId = req.params.id as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const session = await assertOwnedSession(examSessionId, userId);

      if (!session) {
        return res.status(404).json(new ApiResponse(404, {}, 'Exam session not found'));
      }

      if (session.status !== 'in_progress') {
        return res.status(409).json(new ApiResponse(409, {}, 'Session cannot be submitted'));
      }

      const [updatedSession] = await db
        .update(examSessionTable)
        .set({ status: 'submitted', submittedAt: new Date() })
        .where(eq(examSessionTable.examSessionId, examSessionId))
        .returning();

      return res.status(200).json(new ApiResponse(200, updatedSession, 'Exam submitted successfully'));
    } catch (error) {
      console.error('Error submitting exam session:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// POST /api/exam-sessions/:id/abandon
export const abandonExamSession = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const examSessionId = req.params.id as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const session = await assertOwnedSession(examSessionId, userId);

      if (!session) {
        return res.status(404).json(new ApiResponse(404, {}, 'Exam session not found'));
      }

      if (session.status !== 'in_progress') {
        return res.status(409).json(new ApiResponse(409, {}, 'Session cannot be abandoned'));
      }

      const [updatedSession] = await db
        .update(examSessionTable)
        .set({ status: 'abandoned', submittedAt: new Date() })
        .where(eq(examSessionTable.examSessionId, examSessionId))
        .returning();

      return res.status(200).json(new ApiResponse(200, updatedSession, 'Exam abandoned successfully'));
    } catch (error) {
      console.error('Error abandoning exam session:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
