import { Axios } from '@/config/axios';

export interface Topic {
  topicId: string;
  courseId: string;
  name: string;
  description: string | null;
  content: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateTopicDTO {
  courseId: string;
  name: string;
  description?: string;
  content?: string;
  orderIndex?: number;
}

export interface UpdateTopicDTO {
  name?: string;
  description?: string;
  content?: string;
  orderIndex?: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

// Create a new topic
export const createTopic = async (data: CreateTopicDTO): Promise<Topic> => {
  const response = await Axios.post<ApiResponse<Topic>>('/api/topics', data);
  return response.data.data;
};

// Get all topics for a course
export const getCourseTopics = async (courseId: string): Promise<Topic[]> => {
  const response = await Axios.get<ApiResponse<Topic[]>>(
    `/api/topics/course/${courseId}`
  );
  return response.data.data;
};

// Get a single topic by ID
export const getTopicById = async (topicId: string): Promise<Topic> => {
  const response = await Axios.get<ApiResponse<Topic>>(
    `/api/topics/${topicId}`
  );
  return response.data.data;
};

// Update a topic
export const updateTopic = async (
  topicId: string,
  data: UpdateTopicDTO
): Promise<Topic> => {
  const response = await Axios.put<ApiResponse<Topic>>(
    `/api/topics/${topicId}`,
    data
  );
  return response.data.data;
};

// Delete a topic
export const deleteTopic = async (topicId: string): Promise<void> => {
  await Axios.delete(`/api/topics/${topicId}`);
};
