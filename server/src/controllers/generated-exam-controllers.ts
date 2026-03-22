import { createHash } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { db } from '../db';
import {
  courseTable,
  examPatternTable,
  generatedExamTable,
  materialChunksTable,
  materialTable,
} from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

interface GeneratedQuestion {
  questionId: string;
  questionType: 'mcq' | 'short' | 'broad';
  prompt: string;
  marks: number;
  questionCategory?:
    | 'direct'
    | 'applied'
    | 'calculation'
    | 'coding'
    | 'conceptual'
    | 'conceptual-reasoning';
  passage?: string;
  subQuestions?: Array<{
    subQuestionId: string;
    prompt: string;
    marks: number;
    answer: string;
  }>;
  options?: string[];
  answer: string;
}

interface GeneratedExamPaper {
  title: string;
  instructions: string[];
  estimatedDurationMinutes: number;
  totalMarks: number;
  questions: GeneratedQuestion[];
}

interface RetrievedChunk {
  materialName: string;
  text: string;
  chunkType?: string | null;
  pageNumber?: number | null;
}

type JsonObject = Record<string, unknown>;

const isJsonObject = (value: unknown): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

let pinecone: PineconeClient | null = null;

const getPineconeClient = (): PineconeClient | null => {
  if (!pinecone && process.env.PINECONE_API_KEY) {
    pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY });
  }

  return pinecone;
};

const getEmbeddings = (): OpenAIEmbeddings | null => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
    dimensions: 1024,
  });
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
    throw new Error('Gemini returned empty response');
  }

  const candidates: string[] = [];
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);

  if (fenced?.[1]) {
    candidates.push(fenced[1].trim());
  }

  candidates.push(trimmed);

  const balancedCandidate = extractBalancedJsonObject(trimmed);
  if (balancedCandidate) {
    candidates.push(balancedCandidate);
  }

  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Could not parse model output as JSON');
};

const extractBalancedJsonObject = (text: string): string | null => {
  const start = text.indexOf('{');

  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index] as string;

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (character === '\\') {
        isEscaped = true;
        continue;
      }

      if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === '{') {
      depth += 1;
      continue;
    }

    if (character === '}') {
      depth -= 1;

      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
};

const getGeminiExamModel = (): ChatGoogleGenerativeAI => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new ChatGoogleGenerativeAI({
    model: 'gemini-3-flash-preview',
    temperature: 0.4,
    maxOutputTokens: 8192,
    apiKey: process.env.GEMINI_API_KEY,
  });
};

const removeAnswersFromPaper = (paper: unknown): unknown => {
  if (Array.isArray(paper)) {
    return paper.map(removeAnswersFromPaper);
  }

  if (!isJsonObject(paper)) {
    return paper;
  }

  const sanitizedEntries = Object.entries(paper)
    .filter(([key]) => !['answer', 'correctAnswer', 'expectedAnswer', 'modelAnswer', 'answerKey'].includes(key))
    .map(([key, value]) => [key, removeAnswersFromPaper(value)]);

  return Object.fromEntries(sanitizedEntries);
};

const resolveTotalMarks = (paper: GeneratedExamPaper): number => {
  const sum = paper.questions.reduce((total, question) => total + Number(question.marks || 0), 0);
  return sum > 0 ? sum : Number(paper.totalMarks || 0);
};

const sumSubQuestionMarks = (question: GeneratedQuestion): number => {
  if (!question.subQuestions || question.subQuestions.length === 0) {
    return 0;
  }

  return question.subQuestions.reduce((total, subQuestion) => total + Number(subQuestion.marks || 0), 0);
};

const isAppliedCalculationCodingQuestion = (question: GeneratedQuestion): boolean => {
  if (question.questionType === 'mcq') {
    return false;
  }

  if (
    question.questionCategory === 'applied' ||
    question.questionCategory === 'calculation' ||
    question.questionCategory === 'coding'
  ) {
    return true;
  }

  const text = `${question.prompt} ${question.passage ?? ''}`.toLowerCase();
  return /apply|application|calculate|computation|derive|implement|code|algorithm|program/i.test(text);
};

const getVarietyConstraintViolations = (paper: GeneratedExamPaper): string[] => {
  const nonMcqQuestions = paper.questions.filter((question) => question.questionType !== 'mcq');

  const hasPassageBasedNonMcq = nonMcqQuestions.some(
    (question) => typeof question.passage === 'string' && question.passage.trim().length > 0
  );

  const hasCompositeSubQuestion = nonMcqQuestions.some((question) => {
    const subTotal = sumSubQuestionMarks(question);
    return (
      Array.isArray(question.subQuestions) &&
      question.subQuestions.length > 0 &&
      subTotal > 0 &&
      Math.abs(Number(question.marks || 0) - subTotal) < 0.0001
    );
  });

  const hasAppliedCalculationCodingNonMcq = nonMcqQuestions.some(isAppliedCalculationCodingQuestion);

  const violations: string[] = [];

  if (!hasPassageBasedNonMcq) {
    violations.push('Add at least one passage-based non-MCQ question.');
  }

  if (!hasCompositeSubQuestion) {
    violations.push('Add at least one non-MCQ composite question with subQuestions and matching marks total.');
  }

  if (!hasAppliedCalculationCodingNonMcq) {
    violations.push('Add at least one applied/calculation/coding non-MCQ question.');
  }

  return violations;
};

const isFinalOrMixedPattern = (patternCode: string, patternName: string): boolean => {
  const patternText = `${patternCode} ${patternName}`.toLowerCase();
  return patternText.includes('final') || patternText.includes('mixed');
};

const getTargetQuestionCount = (defaultMarks: number): number => {
  const estimated = Math.round(defaultMarks / 5);
  return Math.max(6, Math.min(14, estimated));
};

const getRequiredQuestionTypesFromPattern = (
  hasMCQ: boolean | null,
  hasShortQuestions: boolean | null,
  hasBroadQuestions: boolean | null
): Array<'mcq' | 'short' | 'broad'> => {
  const required: Array<'mcq' | 'short' | 'broad'> = [];

  if (hasMCQ) required.push('mcq');
  if (hasShortQuestions) required.push('short');
  if (hasBroadQuestions) required.push('broad');

  return required;
};

const getAllowedQuestionTypesFromPattern = (
  hasMCQ: boolean | null,
  hasShortQuestions: boolean | null,
  hasBroadQuestions: boolean | null
): Array<'mcq' | 'short' | 'broad'> => {
  const allowed = getRequiredQuestionTypesFromPattern(hasMCQ, hasShortQuestions, hasBroadQuestions);

  if (allowed.length > 0) {
    return allowed;
  }

  return ['mcq', 'short', 'broad'];
};

const getQuestionTypeCounts = (paper: GeneratedExamPaper): Record<'mcq' | 'short' | 'broad', number> => {
  return paper.questions.reduce(
    (counts, question) => {
      counts[question.questionType] += 1;
      return counts;
    },
    { mcq: 0, short: 0, broad: 0 }
  );
};

const getFinalOrMixedViolations = (
  paper: GeneratedExamPaper,
  minimumQuestions: number,
  requiredTypes: Array<'mcq' | 'short' | 'broad'>
): string[] => {
  const violations = [...getVarietyConstraintViolations(paper)];

  if (paper.questions.length < minimumQuestions) {
    violations.push(`Increase question count to at least ${minimumQuestions}.`);
  }

  const counts = getQuestionTypeCounts(paper);
  requiredTypes.forEach((type) => {
    if (counts[type] === 0) {
      violations.push(`Include at least one ${type.toUpperCase()} question as required by the pattern.`);
    }
  });

  return violations;
};

const getPatternTypeViolations = (
  paper: GeneratedExamPaper,
  requiredTypes: Array<'mcq' | 'short' | 'broad'>,
  allowedTypes: Array<'mcq' | 'short' | 'broad'>,
  enforceAllRequiredTypes: boolean
): string[] => {
  const violations: string[] = [];
  const counts = getQuestionTypeCounts(paper);

  const disallowedTypes = (['mcq', 'short', 'broad'] as const).filter(
    (type) => !allowedTypes.includes(type)
  );

  const usedDisallowedTypes = disallowedTypes.filter((type) => counts[type] > 0);
  if (usedDisallowedTypes.length > 0) {
    violations.push(
      `Do not include disallowed question types for this pattern: ${usedDisallowedTypes.join(', ')}.`
    );
  }

  if (requiredTypes.length === 1) {
    const onlyType = requiredTypes[0];
    const totalQuestions = paper.questions.length;

    if (counts[onlyType] !== totalQuestions) {
      violations.push(`All questions must be ${onlyType.toUpperCase()} for this pattern.`);
    }
  }

  if (enforceAllRequiredTypes) {
    requiredTypes.forEach((type) => {
      if (counts[type] === 0) {
        violations.push(`Include at least one ${type.toUpperCase()} question as required by the pattern.`);
      }
    });
  }

  return violations;
};

const normalizeQuestionType = (value: unknown): 'mcq' | 'short' | 'broad' => {
  const rawType = typeof value === 'string' ? value.toLowerCase().trim() : '';

  if (rawType.includes('mcq') || rawType.includes('multiple')) {
    return 'mcq';
  }

  if (rawType.includes('short')) {
    return 'short';
  }

  return 'broad';
};

const normalizeFragmentedLines = (content: string): string => {
  const lines = content.split('\n');
  const merged: string[] = [];
  let buffer = '';

  const isSingleCharFragment = (line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.length === 1 && /^[A-Za-z0-9_*'"=().,+\-/]$/.test(trimmed);
  };

  const flushBuffer = (): void => {
    if (buffer.length > 0) {
      merged.push(buffer);
      buffer = '';
    }
  };

  lines.forEach((line) => {
    if (isSingleCharFragment(line)) {
      buffer += line.trim();
      return;
    }

    flushBuffer();
    merged.push(line);
  });

  flushBuffer();
  return merged.join('\n');
};

const normalizeGeneratedText = (content: unknown, fallback = ''): string => {
  const source = typeof content === 'string' ? content : fallback;

  const normalizedSymbols = source
    .replace(/∗/g, '*')
    .replace(/′/g, "'")
    .replace(/‘/g, "'")
    .replace(/’/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"');

  const mergedFragments = normalizeFragmentedLines(normalizedSymbols);

  return mergedFragments.replace(/\b(?:[A-Za-z]\s){5,}[A-Za-z]\b/g, (match) => {
    return match.replace(/\s+/g, '');
  });
};

const parseQuestionsFromUnknown = (questionsRaw: unknown[]): GeneratedQuestion[] => {
  return questionsRaw
    .filter((question): question is JsonObject => isJsonObject(question))
    .map((question, index) => {
      const rawOptions = Array.isArray(question.options)
        ? question.options.filter((option): option is string => typeof option === 'string')
        : undefined;

      const rawSubQuestions = Array.isArray(question.subQuestions)
        ? question.subQuestions
            .filter((item): item is JsonObject => isJsonObject(item))
            .map((item, itemIndex) => ({
              subQuestionId:
                typeof item.subQuestionId === 'string' && item.subQuestionId.trim().length > 0
                  ? item.subQuestionId
                  : `q${index + 1}-${itemIndex + 1}`,
              prompt: normalizeGeneratedText(item.prompt, `Sub-question ${itemIndex + 1}`),
              marks:
                typeof item.marks === 'number' && Number.isFinite(item.marks)
                  ? item.marks
                  : 1,
              answer: normalizeGeneratedText(item.answer),
            }))
        : undefined;

      const rawCategory =
        typeof question.questionCategory === 'string'
          ? question.questionCategory.toLowerCase().trim()
          : '';

      const questionCategory =
        rawCategory === 'direct' ||
        rawCategory === 'applied' ||
        rawCategory === 'calculation' ||
        rawCategory === 'coding' ||
        rawCategory === 'conceptual' ||
        rawCategory === 'conceptual-reasoning'
          ? rawCategory
          : undefined;

      const marksFromSubQuestions = rawSubQuestions && rawSubQuestions.length > 0
        ? rawSubQuestions.reduce((total, subQuestion) => total + Number(subQuestion.marks || 0), 0)
        : 0;

      const resolvedMarks =
        typeof question.marks === 'number' && Number.isFinite(question.marks)
          ? question.marks
          : marksFromSubQuestions > 0
            ? marksFromSubQuestions
            : 1;

      return {
        questionId:
          typeof question.questionId === 'string' && question.questionId.trim().length > 0
            ? question.questionId
            : `q${index + 1}`,
        questionType: normalizeQuestionType(question.questionType),
        prompt: normalizeGeneratedText(
          question.prompt,
          typeof question.question === 'string' ? question.question : `Question ${index + 1}`
        ),
        marks: resolvedMarks,
        questionCategory,
        passage: typeof question.passage === 'string' ? normalizeGeneratedText(question.passage) : undefined,
        subQuestions: rawSubQuestions && rawSubQuestions.length > 0 ? rawSubQuestions : undefined,
        options: rawOptions && rawOptions.length > 0 ? rawOptions.map((option) => normalizeGeneratedText(option)) : undefined,
        answer: normalizeGeneratedText(question.answer),
      };
    });
};

const normalizeGeneratedPaper = (rawPaper: unknown, fallbackTitle: string): GeneratedExamPaper => {
  if (!isJsonObject(rawPaper)) {
    throw new Error('AI generated invalid exam structure');
  }

  const instructions = Array.isArray(rawPaper.instructions)
    ? rawPaper.instructions.filter((instruction): instruction is string => typeof instruction === 'string')
    : [];

  let normalizedQuestions: GeneratedQuestion[] = [];

  if (Array.isArray(rawPaper.questions)) {
    normalizedQuestions = parseQuestionsFromUnknown(rawPaper.questions);
  }

  if (normalizedQuestions.length === 0 && Array.isArray(rawPaper.sections)) {
    const sectionQuestions = rawPaper.sections
      .filter((section): section is JsonObject => isJsonObject(section))
      .flatMap((section) => (Array.isArray(section.questions) ? section.questions : []));

    normalizedQuestions = parseQuestionsFromUnknown(sectionQuestions);
  }

  if (normalizedQuestions.length === 0) {
    throw new Error('AI generated exam without valid questions');
  }

  return {
    title:
      typeof rawPaper.title === 'string' && rawPaper.title.trim().length > 0
        ? rawPaper.title
        : fallbackTitle,
    instructions,
    estimatedDurationMinutes:
      typeof rawPaper.estimatedDurationMinutes === 'number' && Number.isFinite(rawPaper.estimatedDurationMinutes)
        ? rawPaper.estimatedDurationMinutes
        : 60,
    totalMarks:
      typeof rawPaper.totalMarks === 'number' && Number.isFinite(rawPaper.totalMarks)
        ? rawPaper.totalMarks
        : 0,
    questions: normalizedQuestions,
  };
};

const queryCourseSemanticContext = async (
  courseId: string,
  query: string,
  topK: number
): Promise<RetrievedChunk[]> => {
  try {
    const pineconeClient = getPineconeClient();
    const embeddings = getEmbeddings();

    if (!pineconeClient || !embeddings || !process.env.PINECONE_INDEX) {
      return [];
    }

    const index = pineconeClient.Index(process.env.PINECONE_INDEX);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: `course_${courseId}`,
    });

    const docs = await vectorStore.similaritySearch(query, topK);

    return docs
      .map((doc): RetrievedChunk => ({
        materialName:
          typeof doc.metadata?.material_name === 'string'
            ? doc.metadata.material_name
            : 'Course Material',
        text: doc.pageContent,
        chunkType:
          typeof doc.metadata?.chunk_type === 'string' ? doc.metadata.chunk_type : null,
        pageNumber:
          typeof doc.metadata?.page_number === 'number' ? doc.metadata.page_number : null,
      }))
      .filter((chunk) => chunk.text.trim().length > 0);
  } catch (error) {
    console.error('Error querying semantic context for exam generation:', error);
    return [];
  }
};

const queryCourseChunkFallback = async (courseId: string, limit: number): Promise<RetrievedChunk[]> => {
  try {
    const rows = await db
      .select({
        materialName: materialTable.name,
        text: materialChunksTable.chunkText,
        chunkType: materialChunksTable.chunkType,
        pageNumber: materialChunksTable.pageNumber,
      })
      .from(materialChunksTable)
      .innerJoin(materialTable, eq(materialChunksTable.materialId, materialTable.materialId))
      .where(eq(materialTable.courseId, courseId))
      .orderBy(desc(materialChunksTable.createdAt))
      .limit(limit);

    return rows
      .map((row) => ({
        materialName: row.materialName,
        text: row.text,
        chunkType: row.chunkType,
        pageNumber: row.pageNumber,
      }))
      .filter((chunk) => chunk.text.trim().length > 0);
  } catch (error) {
    console.error('Error querying fallback course chunks for exam generation:', error);
    return [];
  }
};

const buildCourseContextBlock = (chunks: RetrievedChunk[]): string => {
  if (chunks.length === 0) {
    return 'No course material context found. Use general subject knowledge with realistic scope.';
  }

  return chunks
    .map((chunk, index) => {
      const pageInfo = typeof chunk.pageNumber === 'number' ? ` Page ${chunk.pageNumber}.` : '';
      const typeInfo = chunk.chunkType ? ` Type: ${chunk.chunkType}.` : '';
      const clippedText = chunk.text.slice(0, 1200);

      return `[CourseContext ${index + 1}] Material: ${chunk.materialName}.${pageInfo}${typeInfo}\n${clippedText}`;
    })
    .join('\n\n');
};

const getExamPaperFromModel = async (
  model: ChatGoogleGenerativeAI,
  prompt: string,
  fallbackTitle: string
): Promise<GeneratedExamPaper> => {
  const buildMessages = (messagePrompt: string) => [
    new SystemMessage('You are an expert exam-paper generation engine that outputs strict JSON.'),
    new HumanMessage(messagePrompt),
  ];

  const parsePaper = (value: unknown): GeneratedExamPaper => {
    return normalizeGeneratedPaper(value, fallbackTitle);
  };

  const response = await model.invoke(buildMessages(prompt));
  const responseText = extractTextContent(response.content);

  try {
    return parsePaper(extractJsonFromModelOutput(responseText));
  } catch (initialError) {
    const repairPrompt = [
      'Repair the following malformed JSON into valid JSON only.',
      'Do not add explanations. Preserve the intended exam structure and fields.',
      'Return only valid JSON.',
      '',
      responseText,
    ].join('\n');

    try {
      const repairedResponse = await model.invoke(buildMessages(repairPrompt));
      const repairedText = extractTextContent(repairedResponse.content);
      return parsePaper(extractJsonFromModelOutput(repairedText));
    } catch {
      const retryPrompt = [
        prompt,
        '',
        'IMPORTANT RETRY INSTRUCTIONS:',
        'Return compact JSON only and ensure all strings are properly closed/escaped.',
        'No markdown fences.',
      ].join('\n');

      const retryResponse = await model.invoke(buildMessages(retryPrompt));
      const retryText = extractTextContent(retryResponse.content);

      try {
        return parsePaper(extractJsonFromModelOutput(retryText));
      } catch {
        throw initialError;
      }
    }
  }
};

// POST /api/generated-exams/generate
export const generateExam = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const {
        courseId,
        examPatternId,
        title,
        difficulty = 'medium',
        topicFocus = [],
      } = req.body as {
        courseId?: string;
        examPatternId?: string;
        title?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
        topicFocus?: string[];
      };

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      if (!courseId || !examPatternId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'courseId and examPatternId are required'));
      }

      const [course] = await db
        .select()
        .from(courseTable)
        .where(and(eq(courseTable.courseId, courseId), eq(courseTable.userId, userId)));

      if (!course) {
        return res.status(404).json(new ApiResponse(404, {}, 'Course not found'));
      }

      const [pattern] = await db
        .select()
        .from(examPatternTable)
        .where(eq(examPatternTable.examPatternId, examPatternId));

      if (!pattern) {
        return res.status(404).json(new ApiResponse(404, {}, 'Exam pattern not found'));
      }

      const semanticQuery = [
        course.name,
        course.description ?? '',
        pattern.name,
        pattern.description ?? '',
        Array.isArray(topicFocus) ? topicFocus.join(' ') : '',
        'important concepts, definitions, formulas, solved examples',
      ]
        .join(' ')
        .trim();

      const semanticChunks = await queryCourseSemanticContext(courseId, semanticQuery, 12);
      const fallbackChunks = semanticChunks.length < 6
        ? await queryCourseChunkFallback(courseId, 12)
        : [];
      const combinedContextChunks = [...semanticChunks, ...fallbackChunks].slice(0, 16);
      const courseContextBlock = buildCourseContextBlock(combinedContextChunks);

      const targetTitle = title || `${course.name} - ${pattern.name}`;
      const targetQuestionCount = getTargetQuestionCount(pattern.defaultMarks);
      const requiredTypes = getRequiredQuestionTypesFromPattern(
        pattern.hasMCQ,
        pattern.hasShortQuestions,
        pattern.hasBroadQuestions
      );
      const allowedTypes = getAllowedQuestionTypesFromPattern(
        pattern.hasMCQ,
        pattern.hasShortQuestions,
        pattern.hasBroadQuestions
      );

      const promptSections = [
        `Create a complete exam paper as valid JSON only.`,
        `Course Name: ${course.name}`,
        `Course Description: ${course.description ?? 'N/A'}`,
        `Pattern Name: ${pattern.name}`,
        `Pattern Code: ${pattern.patternCode}`,
        `Pattern Description: ${pattern.description ?? 'N/A'}`,
        `Pattern Config JSON: ${JSON.stringify(pattern.config)}`,
        `Default Marks: ${pattern.defaultMarks}`,
        `Default Time Minutes: ${pattern.defaultTimeMinutes ?? 60}`,
        `Difficulty: ${difficulty}`,
        `Target Question Count: ${targetQuestionCount}`,
        `Required Question Types By Pattern: ${requiredTypes.join(', ') || 'none'}`,
        `Allowed Question Types By Pattern: ${allowedTypes.join(', ')}`,
        `Topic Focus: ${Array.isArray(topicFocus) ? topicFocus.join(', ') || 'General syllabus coverage' : 'General syllabus coverage'}`,
        `Context Source Requirement: About 70% questions must be grounded in the provided Course Context, and up to 30% can be complementary LLM-generated extension content aligned to syllabus level.`,
        '',
        `Course Context (semantic retrieval + uploaded chunks):`,
        courseContextBlock,
        '',
        `Return JSON with this exact shape:`,
        JSON.stringify(
          {
            title: targetTitle,
            instructions: ['instruction 1', 'instruction 2'],
            estimatedDurationMinutes: pattern.defaultTimeMinutes ?? 60,
            totalMarks: pattern.defaultMarks,
            questions: [
              {
                questionId: 'q1',
                questionType: 'mcq',
                questionCategory: 'direct',
                prompt: 'Question statement',
                marks: 1,
                options: ['A', 'B', 'C', 'D'],
                answer: 'B',
              },
              {
                questionId: 'q2',
                questionType: 'broad',
                questionCategory: 'conceptual-reasoning',
                passage: 'A short paragraph or case scenario for reasoning-based response.',
                prompt: 'Main question stem based on the paragraph/case.',
                marks: 10,
                subQuestions: [
                  {
                    subQuestionId: 'q2-a',
                    prompt: 'Sub-question A',
                    marks: 4,
                    answer: 'Model answer for A',
                  },
                  {
                    subQuestionId: 'q2-b',
                    prompt: 'Sub-question B',
                    marks: 6,
                    answer: 'Model answer for B',
                  },
                ],
                answer: 'Combined expected answer summary',
              },
            ],
          },
          null,
          2
        ),
        '',
        `Rules:`,
        `1) Include answer for every question in 'answer' field.`,
        `2) Keep MCQ question format unchanged (options + single correct answer).`,
        `3) If questionType is not mcq, omit options field.`,
        `4) Use questionType values from only: mcq, short, broad.`,
        `5) Strictly follow pattern type flags: include only allowed types and exclude disabled types.`,
        `6) For non-MCQ questions, generate variety across direct, applied, calculation/math, coding, conceptual, and conceptual-reasoning categories where course-relevant.`,
        `7) Include some paragraph/case-based questions using 'passage' and then ask question(s) from that passage.`,
        `8) Include some divided questions using 'subQuestions' with specific marks; ensure main question marks equals sum of sub-question marks.`,
        `9) Keep questions university-level and exam-friendly with varied cognitive difficulty.`,
        `10) Ensure each question has a unique questionId and numeric marks.`,
        `11) Ensure total marks equals sum of question marks.`,
        `12) For coding questions, keep code readable and not character-split.`,
        `13) For coding questions, include fenced markdown code blocks (for example: \`\`\`php ... \`\`\`) inside prompt and answer fields where code appears.`,
        `14) Do not include explanation or any text outside JSON.`,
        requiredTypes.length === 1
          ? `15) This is a strict ${requiredTypes[0].toUpperCase()}-only pattern. Every questionType must be '${requiredTypes[0]}'.`
          : '',
      ];

      const requiresVarietyEnforcement = isFinalOrMixedPattern(pattern.patternCode, pattern.name);
      const shouldEnforceAllRequiredTypes = requiresVarietyEnforcement || requiredTypes.length === 1;
      const maxAttempts = 3;

      let generatedPaper: GeneratedExamPaper | null = null;
      let lastViolations: string[] = [];

      const model = getGeminiExamModel();

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const attemptPrompt = [
          ...promptSections,
          requiresVarietyEnforcement
            ? `15) This is a Final/Mixed paper, so it MUST include: (a) at least one passage-based non-MCQ, (b) at least one composite non-MCQ with subQuestions and mark-distribution, (c) at least one applied/calculation/coding non-MCQ, (d) at least ${targetQuestionCount} questions, (e) required pattern types: ${requiredTypes.join(', ') || 'none'}.`
            : '',
          lastViolations.length > 0
            ? `Regeneration fixes required: ${lastViolations.join(' ')}`
            : '',
        ]
          .filter((line) => line.trim().length > 0)
          .join('\n');

        const candidatePaper = await getExamPaperFromModel(model, attemptPrompt, targetTitle);
        candidatePaper.totalMarks = resolveTotalMarks(candidatePaper);

        const violations = [
          ...getPatternTypeViolations(
            candidatePaper,
            requiredTypes,
            allowedTypes,
            shouldEnforceAllRequiredTypes
          ),
          ...(requiresVarietyEnforcement
            ? getFinalOrMixedViolations(candidatePaper, targetQuestionCount, requiredTypes)
            : []),
        ];

        if (violations.length === 0) {
          generatedPaper = candidatePaper;
          break;
        }

        lastViolations = violations;
      }

      if (!generatedPaper) {
        return res.status(422).json(
          new ApiResponse(
            422,
            { issues: lastViolations },
            'AI generated exam did not satisfy required Final/Mixed variety constraints'
          )
        );
      }

      const promptHash = createHash('sha256').update(promptSections.join('\n')).digest('hex');

      const [createdExam] = await db
        .insert(generatedExamTable)
        .values({
          generatedExamId: nanoid(),
          courseId,
          examPatternId,
          title: title?.trim() || generatedPaper.title || `${course.name} - ${pattern.name}`,
          paper: generatedPaper,
          aiModel: 'gemini-3-flash-preview',
          aiPromptHash: promptHash,
        })
        .returning();

      return res
        .status(201)
        .json(new ApiResponse(201, createdExam, 'Exam generated successfully'));
    } catch (error) {
      console.error('Error generating exam:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// GET /api/generated-exams
export const getGeneratedExams = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { courseId, patternId } = req.query as { courseId?: string; patternId?: string };

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const exams = await db
        .select({
          generatedExamId: generatedExamTable.generatedExamId,
          courseId: generatedExamTable.courseId,
          examPatternId: generatedExamTable.examPatternId,
          title: generatedExamTable.title,
          aiModel: generatedExamTable.aiModel,
          createdAt: generatedExamTable.createdAt,
          updatedAt: generatedExamTable.updatedAt,
        })
        .from(generatedExamTable)
        .innerJoin(courseTable, eq(generatedExamTable.courseId, courseTable.courseId))
        .where(
          and(
            eq(courseTable.userId, userId),
            courseId ? eq(generatedExamTable.courseId, courseId) : undefined,
            patternId ? eq(generatedExamTable.examPatternId, patternId) : undefined
          )
        )
        .orderBy(desc(generatedExamTable.createdAt));

      return res.status(200).json(new ApiResponse(200, exams, 'Generated exams fetched successfully'));
    } catch (error) {
      console.error('Error listing generated exams:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// GET /api/generated-exams/:id
export const getGeneratedExamById = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const generatedExamId = req.params.id as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [exam] = await db
        .select({
          generatedExamId: generatedExamTable.generatedExamId,
          courseId: generatedExamTable.courseId,
          examPatternId: generatedExamTable.examPatternId,
          title: generatedExamTable.title,
          paper: generatedExamTable.paper,
          aiModel: generatedExamTable.aiModel,
          createdAt: generatedExamTable.createdAt,
          updatedAt: generatedExamTable.updatedAt,
        })
        .from(generatedExamTable)
        .innerJoin(courseTable, eq(generatedExamTable.courseId, courseTable.courseId))
        .where(
          and(
            eq(generatedExamTable.generatedExamId, generatedExamId),
            eq(courseTable.userId, userId)
          )
        );

      if (!exam) {
        return res.status(404).json(new ApiResponse(404, {}, 'Generated exam not found'));
      }

      const sanitizedExam = {
        ...exam,
        paper: removeAnswersFromPaper(exam.paper),
      };

      return res.status(200).json(new ApiResponse(200, sanitizedExam, 'Generated exam fetched successfully'));
    } catch (error) {
      console.error('Error fetching generated exam:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// GET /api/generated-exams/:id/full
export const getGeneratedExamFullById = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const generatedExamId = req.params.id as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [exam] = await db
        .select()
        .from(generatedExamTable)
        .innerJoin(courseTable, eq(generatedExamTable.courseId, courseTable.courseId))
        .where(
          and(
            eq(generatedExamTable.generatedExamId, generatedExamId),
            eq(courseTable.userId, userId)
          )
        );

      if (!exam) {
        return res.status(404).json(new ApiResponse(404, {}, 'Generated exam not found'));
      }

      return res
        .status(200)
        .json(new ApiResponse(200, exam.tbl_generated_exam, 'Generated exam with answers fetched successfully'));
    } catch (error) {
      console.error('Error fetching full generated exam:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// DELETE /api/generated-exams/:id
export const deleteGeneratedExam = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const generatedExamId = req.params.id as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [exam] = await db
        .select({ generatedExamId: generatedExamTable.generatedExamId })
        .from(generatedExamTable)
        .innerJoin(courseTable, eq(generatedExamTable.courseId, courseTable.courseId))
        .where(
          and(
            eq(generatedExamTable.generatedExamId, generatedExamId),
            eq(courseTable.userId, userId)
          )
        );

      if (!exam) {
        return res.status(404).json(new ApiResponse(404, {}, 'Generated exam not found'));
      }

      await db
        .delete(generatedExamTable)
        .where(eq(generatedExamTable.generatedExamId, generatedExamId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Generated exam deleted successfully'));
    } catch (error) {
      console.error('Error deleting generated exam:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// GET /api/courses/:courseId/exams
export const getGeneratedExamsByCourse = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const courseId = req.params.courseId as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [course] = await db
        .select({ courseId: courseTable.courseId })
        .from(courseTable)
        .where(and(eq(courseTable.courseId, courseId), eq(courseTable.userId, userId)));

      if (!course) {
        return res.status(404).json(new ApiResponse(404, {}, 'Course not found'));
      }

      const exams = await db
        .select({
          generatedExamId: generatedExamTable.generatedExamId,
          title: generatedExamTable.title,
          examPatternId: generatedExamTable.examPatternId,
          aiModel: generatedExamTable.aiModel,
          createdAt: generatedExamTable.createdAt,
          updatedAt: generatedExamTable.updatedAt,
        })
        .from(generatedExamTable)
        .where(eq(generatedExamTable.courseId, courseId))
        .orderBy(desc(generatedExamTable.createdAt));

      return res.status(200).json(new ApiResponse(200, exams, 'Course exams fetched successfully'));
    } catch (error) {
      console.error('Error fetching course exams:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// GET /api/courses/:courseId/exam-patterns
export const getCourseExamPatterns = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const courseId = req.params.courseId as string;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [course] = await db
        .select({ courseId: courseTable.courseId })
        .from(courseTable)
        .where(and(eq(courseTable.courseId, courseId), eq(courseTable.userId, userId)));

      if (!course) {
        return res.status(404).json(new ApiResponse(404, {}, 'Course not found'));
      }

      const patterns = await db
        .select({
          examPatternId: examPatternTable.examPatternId,
          patternCode: examPatternTable.patternCode,
          name: examPatternTable.name,
          description: examPatternTable.description,
          defaultMarks: examPatternTable.defaultMarks,
          defaultTimeMinutes: examPatternTable.defaultTimeMinutes,
          allowCustomMarks: examPatternTable.allowCustomMarks,
          allowCustomTime: examPatternTable.allowCustomTime,
          hasSections: examPatternTable.hasSections,
          hasMCQ: examPatternTable.hasMCQ,
          hasBroadQuestions: examPatternTable.hasBroadQuestions,
          hasShortQuestions: examPatternTable.hasShortQuestions,
        })
        .from(examPatternTable)
        .orderBy(examPatternTable.name);

      return res
        .status(200)
        .json(new ApiResponse(200, patterns, 'Course exam patterns fetched successfully'));
    } catch (error) {
      console.error('Error fetching course exam patterns:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
