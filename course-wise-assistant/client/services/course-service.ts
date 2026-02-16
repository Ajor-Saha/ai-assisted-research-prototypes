import { Axios } from '@/config/axios';

export interface Course {
  courseId: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCourseDTO {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCourseDTO {
  name?: string;
  description?: string;
  color?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

// Create a new course
export const createCourse = async (data: CreateCourseDTO): Promise<Course> => {
  const response = await Axios.post<ApiResponse<Course>>('/api/courses', data);
  return response.data.data;
};

// Get all courses for the authenticated user
export const getUserCourses = async (): Promise<Course[]> => {
  const response = await Axios.get<ApiResponse<Course[]>>('/api/courses');
  return response.data.data;
};

// Get a single course by ID
export const getCourseById = async (courseId: string): Promise<Course> => {
  const response = await Axios.get<ApiResponse<Course>>(
    `/api/courses/${courseId}`
  );
  return response.data.data;
};

// Update a course
export const updateCourse = async (
  courseId: string,
  data: UpdateCourseDTO
): Promise<Course> => {
  const response = await Axios.put<ApiResponse<Course>>(
    `/api/courses/${courseId}`,
    data
  );
  return response.data.data;
};

// Delete a course
export const deleteCourse = async (courseId: string): Promise<void> => {
  await Axios.delete(`/api/courses/${courseId}`);
};
