import { Axios } from '@/config/axios';

export interface StudyPathTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  estimatedTime: string;
}

export interface StudyPathInsight {
  title: string;
  description: string;
  type: 'focus' | 'pace' | 'strategy';
}

export interface StudyPath {
  studyPathId: string;
  courseId: string;
  title: string;
  summary: string;
  examDate: string | null;
  tasks: StudyPathTask[];
  insights: StudyPathInsight[];
  aiModel: string;
  generatedAt: string;
}

interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export const getLatestStudyPath = async (
  courseId: string,
  examDate?: string
): Promise<StudyPath> => {
  const queryString = examDate ? `?examDate=${encodeURIComponent(examDate)}` : '';
  const response = await Axios.get<ApiResponse<StudyPath>>(
    `/api/study-paths/course/${courseId}${queryString}`
  );
  return response.data.data;
};

export const regenerateStudyPath = async (
  courseId: string,
  examDate?: string
): Promise<StudyPath> => {
  const response = await Axios.post<ApiResponse<StudyPath>>(
    `/api/study-paths/course/${courseId}/regenerate`,
    {
      examDate,
    }
  );
  return response.data.data;
};
