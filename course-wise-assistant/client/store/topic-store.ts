import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as topicService from '@/services/topic-service';
import type { Topic, CreateTopicDTO, UpdateTopicDTO } from '@/services/topic-service';

interface TopicState {
  topics: Topic[];
  currentTopic: Topic | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCourseTopics: (courseId: string) => Promise<void>;
  fetchTopicById: (topicId: string) => Promise<void>;
  createTopic: (data: CreateTopicDTO) => Promise<Topic>;
  updateTopic: (topicId: string, data: UpdateTopicDTO) => Promise<Topic>;
  deleteTopic: (topicId: string) => Promise<void>;
  setCurrentTopic: (topic: Topic | null) => void;
  clearError: () => void;
}

export const useTopicStore = create<TopicState>()(
  devtools(
    (set) => ({
      topics: [],
      currentTopic: null,
      isLoading: false,
      error: null,

      fetchCourseTopics: async (courseId: string) => {
        set({ isLoading: true, error: null });
        try {
          const topics = await topicService.getCourseTopics(courseId);
          set({ topics, isLoading: false });
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to fetch topics',
            isLoading: false,
          });
        }
      },

      fetchTopicById: async (topicId: string) => {
        set({ isLoading: true, error: null });
        try {
          const topic = await topicService.getTopicById(topicId);
          set({ currentTopic: topic, isLoading: false });
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to fetch topic',
            isLoading: false,
          });
        }
      },

      createTopic: async (data: CreateTopicDTO) => {
        set({ isLoading: true, error: null });
        try {
          const newTopic = await topicService.createTopic(data);
          set((state) => ({
            topics: [...state.topics, newTopic],
            isLoading: false,
          }));
          return newTopic;
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to create topic',
            isLoading: false,
          });
          throw error;
        }
      },

      updateTopic: async (topicId: string, data: UpdateTopicDTO) => {
        set({ isLoading: true, error: null });
        try {
          const updatedTopic = await topicService.updateTopic(topicId, data);
          set((state) => ({
            topics: state.topics.map((topic) =>
              topic.topicId === topicId ? updatedTopic : topic
            ),
            currentTopic:
              state.currentTopic?.topicId === topicId
                ? updatedTopic
                : state.currentTopic,
            isLoading: false,
          }));
          return updatedTopic;
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to update topic',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteTopic: async (topicId: string) => {
        set({ isLoading: true, error: null });
        try {
          await topicService.deleteTopic(topicId);
          set((state) => ({
            topics: state.topics.filter((topic) => topic.topicId !== topicId),
            currentTopic:
              state.currentTopic?.topicId === topicId ? null : state.currentTopic,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to delete topic',
            isLoading: false,
          });
          throw error;
        }
      },

      setCurrentTopic: (topic: Topic | null) => set({ currentTopic: topic }),

      clearError: () => set({ error: null }),
    }),
    { name: 'topic-store' }
  )
);
