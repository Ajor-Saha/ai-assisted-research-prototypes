import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as courseService from '@/services/course-service';
import type { Course, CreateCourseDTO, UpdateCourseDTO } from '@/services/course-service';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCourses: () => Promise<void>;
  fetchCourseById: (courseId: string) => Promise<void>;
  createCourse: (data: CreateCourseDTO) => Promise<Course>;
  updateCourse: (courseId: string, data: UpdateCourseDTO) => Promise<Course>;
  deleteCourse: (courseId: string) => Promise<void>;
  setCurrentCourse: (course: Course | null) => void;
  clearError: () => void;
}

export const useCourseStore = create<CourseState>()(
  devtools(
    (set) => ({
      courses: [],
      currentCourse: null,
      isLoading: false,
      error: null,

      fetchCourses: async () => {
        set({ isLoading: true, error: null });
        try {
          const courses = await courseService.getUserCourses();
          set({ courses, isLoading: false });
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to fetch courses',
            isLoading: false,
          });
        }
      },

      fetchCourseById: async (courseId: string) => {
        set({ isLoading: true, error: null });
        try {
          const course = await courseService.getCourseById(courseId);
          set({ currentCourse: course, isLoading: false });
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to fetch course',
            isLoading: false,
          });
        }
      },

      createCourse: async (data: CreateCourseDTO) => {
        set({ isLoading: true, error: null });
        try {
          const newCourse = await courseService.createCourse(data);
          set((state) => ({
            courses: [newCourse, ...state.courses],
            isLoading: false,
          }));
          return newCourse;
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to create course',
            isLoading: false,
          });
          throw error;
        }
      },

      updateCourse: async (courseId: string, data: UpdateCourseDTO) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCourse = await courseService.updateCourse(courseId, data);
          set((state) => ({
            courses: state.courses.map((c) =>
              c.courseId === courseId ? updatedCourse : c
            ),
            currentCourse:
              state.currentCourse?.courseId === courseId
                ? updatedCourse
                : state.currentCourse,
            isLoading: false,
          }));
          return updatedCourse;
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to update course',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteCourse: async (courseId: string) => {
        set({ isLoading: true, error: null });
        try {
          await courseService.deleteCourse(courseId);
          set((state) => ({
            courses: state.courses.filter((c) => c.courseId !== courseId),
            currentCourse:
              state.currentCourse?.courseId === courseId
                ? null
                : state.currentCourse,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to delete course',
            isLoading: false,
          });
          throw error;
        }
      },

      setCurrentCourse: (course: Course | null) => {
        set({ currentCourse: course });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'CourseStore' }
  )
);
