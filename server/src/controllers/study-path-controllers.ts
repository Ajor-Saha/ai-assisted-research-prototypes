import { and, desc, eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { db } from '../db';
import { courseTable, materialTable, studyPathTable, topicTable } from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

interface StudyPathTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  estimatedTime: string;
}

interface StudyPathInsight {
  title: string;
  description: string;
  type: 'focus' | 'pace' | 'strategy';
}

interface StudyPathPayload {
  title: string;
  summary: string;
  tasks: StudyPathTask[];
  insights: StudyPathInsight[];
}

interface CourseContext {
  courseId: string;
  courseName: string;
  courseDescription: string;
  topics: Array<{
    topicId: string;
    name: string;
    description: string;
    orderIndex: number;
  }>;
  materials: Array<{
    materialId: string;
    topicId: string | null;
    name: string;
    type: string;
    description: string;
  }>;
}

const DEFAULT_MODEL = 'gemini-2.5-flash';

const getStudyPathModel = (): ChatGoogleGenerativeAI => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new ChatGoogleGenerativeAI({
    model: DEFAULT_MODEL,
    temperature: 0.3,
    maxOutputTokens: 4096,
    apiKey: process.env.GEMINI_API_KEY,
  });
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const extractTextContent = (content: unknown): string => {
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (isObject(part) && typeof part.text === 'string') return part.text;
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
    throw new Error('Gemini returned empty study path');
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const rawJson = fenced ? fenced[1] : trimmed;
  return JSON.parse(rawJson);
};

const getDaysUntilExam = (examDate: Date | null): number | null => {
  if (!examDate) return null;

  const diffMs = examDate.getTime() - Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil(diffMs / dayMs));
};

const parseOptionalExamDate = (input: unknown): Date | null => {
  if (typeof input !== 'string' || input.trim() === '') return null;

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const toPriority = (priority: unknown): 'high' | 'medium' | 'low' => {
  if (priority === 'high' || priority === 'medium' || priority === 'low') {
    return priority;
  }
  return 'medium';
};

const buildFallbackTasks = (context: CourseContext, examDate: Date | null): StudyPathTask[] => {
  const daysUntilExam = getDaysUntilExam(examDate) ?? 14;
  const selectedTopics = context.topics.slice(0, 5);
  const today = Date.now();

  if (selectedTopics.length === 0) {
    return [
      {
        id: nanoid(),
        title: `Set up ${context.courseName} fundamentals`,
        description: 'Create topic breakdown and gather at least two key resources to start structured preparation.',
        priority: 'high',
        dueDate: new Date(today + 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: '2 hours',
      },
      {
        id: nanoid(),
        title: 'Weekly checkpoint review',
        description: 'Review completed work and define the next focus area based on weak concepts.',
        priority: 'medium',
        dueDate: new Date(today + 6 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: '1 hour',
      },
    ];
  }

  return selectedTopics.map((topic, index) => {
    const dayOffset = Math.max(1, Math.floor(((index + 1) * daysUntilExam) / (selectedTopics.length + 1)));
    return {
      id: nanoid(),
      title: `Master: ${topic.name}`,
      description: topic.description || `Complete concept review and practice for ${topic.name}.`,
      priority: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
      dueDate: new Date(today + dayOffset * 24 * 60 * 60 * 1000).toISOString(),
      estimatedTime: index < 2 ? '2 hours' : '1.5 hours',
    };
  });
};

const buildFallbackInsights = (context: CourseContext, examDate: Date | null): StudyPathInsight[] => {
  const daysUntilExam = getDaysUntilExam(examDate);
  const topicCount = context.topics.length;

  return [
    {
      title: 'Focus Area',
      description:
        topicCount > 0
          ? `Prioritize foundational topics first, then move to advanced sections in ${context.courseName}.`
          : `Add course topics to unlock topic-level focus guidance for ${context.courseName}.`,
      type: 'focus',
    },
    {
      title: 'Recommended Pace',
      description:
        daysUntilExam && daysUntilExam <= 14
          ? 'Short timeline detected. Target daily focused sessions with at least one revision block.'
          : 'Aim for 3-4 focused sessions per week with one revision checkpoint.',
      type: 'pace',
    },
    {
      title: 'AI Suggestion',
      description: 'Use active recall after each topic and schedule a weekly mixed-question practice set.',
      type: 'strategy',
    },
  ];
};

const buildFallbackStudyPath = (context: CourseContext, examDate: Date | null): StudyPathPayload => {
  return {
    title: 'Personalized Study Path',
    summary: `AI-generated recommendations for ${context.courseName} based on current materials and timeline.`,
    tasks: buildFallbackTasks(context, examDate),
    insights: buildFallbackInsights(context, examDate),
  };
};

const normalizeTask = (task: unknown, index: number): StudyPathTask | null => {
  if (!isObject(task)) return null;

  const title = typeof task.title === 'string' ? task.title.trim() : '';
  if (!title) return null;

  const dueDateInput = typeof task.dueDate === 'string' ? task.dueDate : new Date().toISOString();
  const parsedDueDate = new Date(dueDateInput);

  return {
    id: typeof task.id === 'string' && task.id.trim() ? task.id : nanoid(),
    title,
    description:
      typeof task.description === 'string' && task.description.trim()
        ? task.description.trim()
        : 'Complete this task to stay on track.',
    priority: toPriority(task.priority),
    dueDate: Number.isNaN(parsedDueDate.getTime())
      ? new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
      : parsedDueDate.toISOString(),
    estimatedTime:
      typeof task.estimatedTime === 'string' && task.estimatedTime.trim()
        ? task.estimatedTime.trim()
        : '1 hour',
  };
};

const normalizeInsight = (insight: unknown, index: number): StudyPathInsight | null => {
  if (!isObject(insight)) return null;

  const title = typeof insight.title === 'string' ? insight.title.trim() : '';
  const description = typeof insight.description === 'string' ? insight.description.trim() : '';

  if (!title || !description) return null;

  const type = insight.type === 'focus' || insight.type === 'pace' || insight.type === 'strategy'
    ? insight.type
    : index === 0
      ? 'focus'
      : index === 1
        ? 'pace'
        : 'strategy';

  return {
    title,
    description,
    type,
  };
};

const generateStudyPathWithGemini = async (
  context: CourseContext,
  examDate: Date | null
): Promise<StudyPathPayload> => {
  const model = getStudyPathModel();
  const daysUntilExam = getDaysUntilExam(examDate);

  const prompt = [
    'You are an expert study planner.',
    'Generate a personalized study path in strict JSON only (no markdown).',
    '',
    `Course Name: ${context.courseName}`,
    `Course Description: ${context.courseDescription || 'N/A'}`,
    `Exam Date: ${examDate ? examDate.toISOString() : 'Not provided'}`,
    `Days Until Exam: ${daysUntilExam ?? 'Unknown'}`,
    `Topics JSON: ${JSON.stringify(context.topics)}`,
    `Materials JSON: ${JSON.stringify(context.materials)}`,
    '',
    'Return exact JSON structure:',
    JSON.stringify(
      {
        title: 'Personalized Study Path',
        summary: 'Short summary of recommended strategy based on timeline and weak areas.',
        tasks: [
          {
            id: 'task-1',
            title: 'Review core concepts',
            description: 'Focus on important fundamentals and concept links.',
            priority: 'high',
            dueDate: new Date().toISOString(),
            estimatedTime: '2 hours',
          },
        ],
        insights: [
          {
            title: 'Focus Area',
            description: 'Concepts requiring highest attention.',
            type: 'focus',
          },
          {
            title: 'Recommended Pace',
            description: 'Suggested weekly completion pace.',
            type: 'pace',
          },
          {
            title: 'AI Suggestion',
            description: 'Actionable strategy suggestion.',
            type: 'strategy',
          },
        ],
      },
      null,
      2
    ),
    '',
    'Constraints:',
    '- Return 5 to 8 tasks.',
    '- Prioritize tasks based on exam timeline and topic complexity.',
    '- dueDate must be ISO date string.',
    '- Keep task descriptions practical and specific.',
    '- Keep insights concise and actionable.',
  ].join('\n');

  const response = await model.invoke([
    new SystemMessage('You produce strict JSON only.'),
    new HumanMessage(prompt),
  ]);

  const text = extractTextContent(response.content);
  const parsed = extractJsonFromModelOutput(text);

  if (!isObject(parsed)) {
    throw new Error('Gemini produced invalid study path payload');
  }

  const tasksRaw = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const insightsRaw = Array.isArray(parsed.insights) ? parsed.insights : [];

  const normalizedTasks = tasksRaw
    .map((task, index) => normalizeTask(task, index))
    .filter((task): task is StudyPathTask => task !== null)
    .slice(0, 8);

  const normalizedInsights = insightsRaw
    .map((insight, index) => normalizeInsight(insight, index))
    .filter((insight): insight is StudyPathInsight => insight !== null)
    .slice(0, 4);

  if (normalizedTasks.length === 0) {
    throw new Error('No valid tasks returned from Gemini');
  }

  return {
    title:
      typeof parsed.title === 'string' && parsed.title.trim()
        ? parsed.title.trim()
        : 'Personalized Study Path',
    summary:
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : `AI-generated study path for ${context.courseName}.`,
    tasks: normalizedTasks,
    insights:
      normalizedInsights.length > 0
        ? normalizedInsights
        : buildFallbackInsights(context, examDate),
  };
};

const loadCourseContext = async (userId: string, courseId: string): Promise<CourseContext | null> => {
  const [course] = await db
    .select({
      courseId: courseTable.courseId,
      name: courseTable.name,
      description: courseTable.description,
    })
    .from(courseTable)
    .where(and(eq(courseTable.courseId, courseId), eq(courseTable.userId, userId)));

  if (!course) return null;

  const topics = await db
    .select({
      topicId: topicTable.topicId,
      name: topicTable.name,
      description: topicTable.description,
      orderIndex: topicTable.orderIndex,
    })
    .from(topicTable)
    .where(eq(topicTable.courseId, courseId))
    .orderBy(topicTable.orderIndex);

  const materials = await db
    .select({
      materialId: materialTable.materialId,
      topicId: materialTable.topicId,
      name: materialTable.name,
      type: materialTable.type,
      description: materialTable.description,
    })
    .from(materialTable)
    .where(eq(materialTable.courseId, courseId));

  return {
    courseId: course.courseId,
    courseName: course.name,
    courseDescription: course.description ?? '',
    topics: topics.map((topic) => ({
      topicId: topic.topicId,
      name: topic.name,
      description: topic.description ?? '',
      orderIndex: topic.orderIndex ?? 0,
    })),
    materials: materials.map((material) => ({
      materialId: material.materialId,
      topicId: material.topicId,
      name: material.name,
      type: material.type,
      description: material.description ?? '',
    })),
  };
};

const createAndPersistStudyPath = async (
  userId: string,
  courseId: string,
  examDate: Date | null
): Promise<{
  studyPathId: string;
  courseId: string;
  title: string;
  summary: string;
  examDate: string | null;
  tasks: StudyPathTask[];
  insights: StudyPathInsight[];
  aiModel: string;
  generatedAt: string;
}> => {
  const context = await loadCourseContext(userId, courseId);

  if (!context) {
    throw new Error('COURSE_NOT_FOUND');
  }

  let generated: StudyPathPayload;

  try {
    generated = await generateStudyPathWithGemini(context, examDate);
  } catch (error) {
    console.error('Gemini study path generation failed, using fallback:', error);
    generated = buildFallbackStudyPath(context, examDate);
  }

  const [createdStudyPath] = await db
    .insert(studyPathTable)
    .values({
      studyPathId: nanoid(),
      userId,
      courseId,
      title: generated.title,
      summary: generated.summary,
      examDate,
      aiModel: DEFAULT_MODEL,
      tasks: generated.tasks,
      insights: generated.insights,
    })
    .returning();

  return {
    studyPathId: createdStudyPath.studyPathId,
    courseId: createdStudyPath.courseId,
    title: createdStudyPath.title,
    summary: createdStudyPath.summary,
    examDate: createdStudyPath.examDate ? new Date(createdStudyPath.examDate).toISOString() : null,
    tasks: Array.isArray(createdStudyPath.tasks) ? (createdStudyPath.tasks as StudyPathTask[]) : [],
    insights: Array.isArray(createdStudyPath.insights) ? (createdStudyPath.insights as StudyPathInsight[]) : [],
    aiModel: createdStudyPath.aiModel ?? DEFAULT_MODEL,
    generatedAt: new Date(createdStudyPath.generatedAt).toISOString(),
  };
};

// GET /api/study-paths/course/:courseId
export const getLatestStudyPathByCourse = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const courseId = req.params.courseId as string;
      const examDateInput = req.query.examDate;

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [existingPath] = await db
        .select()
        .from(studyPathTable)
        .where(and(eq(studyPathTable.userId, userId), eq(studyPathTable.courseId, courseId)))
        .orderBy(desc(studyPathTable.generatedAt))
        .limit(1);

      if (existingPath) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              studyPathId: existingPath.studyPathId,
              courseId: existingPath.courseId,
              title: existingPath.title,
              summary: existingPath.summary,
              examDate: existingPath.examDate ? new Date(existingPath.examDate).toISOString() : null,
              tasks: Array.isArray(existingPath.tasks) ? existingPath.tasks : [],
              insights: Array.isArray(existingPath.insights) ? existingPath.insights : [],
              aiModel: existingPath.aiModel ?? DEFAULT_MODEL,
              generatedAt: new Date(existingPath.generatedAt).toISOString(),
            },
            'Study path fetched successfully'
          )
        );
      }

      const parsedExamDate = parseOptionalExamDate(examDateInput);
      const createdPath = await createAndPersistStudyPath(userId, courseId, parsedExamDate);

      return res
        .status(200)
        .json(new ApiResponse(200, createdPath, 'Study path generated successfully'));
    } catch (error) {
      if (error instanceof Error && error.message === 'COURSE_NOT_FOUND') {
        return res.status(404).json(new ApiResponse(404, {}, 'Course not found'));
      }

      console.error('Error fetching study path:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// POST /api/study-paths/course/:courseId/regenerate
export const regenerateStudyPathByCourse = asyncHandler(
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const courseId = req.params.courseId as string;
      const examDate = parseOptionalExamDate(req.body.examDate);

      if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const createdPath = await createAndPersistStudyPath(userId, courseId, examDate);

      return res
        .status(201)
        .json(new ApiResponse(201, createdPath, 'Study path regenerated successfully'));
    } catch (error) {
      if (error instanceof Error && error.message === 'COURSE_NOT_FOUND') {
        return res.status(404).json(new ApiResponse(404, {}, 'Course not found'));
      }

      console.error('Error regenerating study path:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
