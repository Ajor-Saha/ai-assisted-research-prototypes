import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as chatService from '@/services/chat-service';
import type {
  Chat,
  ChatMessage,
  ChatWithMessages,
  CreateChatDTO,
  UpdateChatDTO,
  AddMessageDTO,
} from '@/services/chat-service';

interface ChatState {
  chats: Chat[];
  currentChat: ChatWithMessages | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCourseChats: (courseId: string) => Promise<void>;
  fetchChatById: (chatId: string) => Promise<void>;
  createChat: (data: CreateChatDTO) => Promise<Chat>;
  updateChat: (chatId: string, data: UpdateChatDTO) => Promise<Chat>;
  deleteChat: (chatId: string) => Promise<void>;
  addMessage: (chatId: string, data: AddMessageDTO) => Promise<ChatMessage>;
  setCurrentChat: (chat: ChatWithMessages | null) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      chats: [],
      currentChat: null,
      messages: [],
      isLoading: false,
      error: null,

      fetchCourseChats: async (courseId: string) => {
        set({ isLoading: true, error: null });
        try {
          const chats = await chatService.getCourseChats(courseId);
          set({ chats, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch chats',
            isLoading: false,
          });
        }
      },

      fetchChatById: async (chatId: string) => {
        set({ isLoading: true, error: null });
        try {
          const chat = await chatService.getChatById(chatId);
          set({
            currentChat: chat,
            messages: chat.messages,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch chat',
            isLoading: false,
          });
        }
      },

      createChat: async (data: CreateChatDTO) => {
        set({ isLoading: true, error: null });
        try {
          const newChat = await chatService.createChat(data);
          set((state) => ({
            chats: [newChat, ...state.chats],
            isLoading: false,
          }));
          return newChat;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create chat',
            isLoading: false,
          });
          throw error;
        }
      },

      updateChat: async (chatId: string, data: UpdateChatDTO) => {
        set({ isLoading: true, error: null });
        try {
          const updatedChat = await chatService.updateChat(chatId, data);
          set((state) => ({
            chats: state.chats.map((chat) =>
              chat.chatId === chatId ? updatedChat : chat
            ),
            currentChat: state.currentChat?.chatId === chatId
              ? { ...state.currentChat, ...updatedChat }
              : state.currentChat,
            isLoading: false,
          }));
          return updatedChat;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update chat',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteChat: async (chatId: string) => {
        set({ isLoading: true, error: null });
        try {
          await chatService.deleteChat(chatId);
          set((state) => ({
            chats: state.chats.filter((chat) => chat.chatId !== chatId),
            currentChat:
              state.currentChat?.chatId === chatId ? null : state.currentChat,
            messages:
              state.currentChat?.chatId === chatId ? [] : state.messages,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete chat',
            isLoading: false,
          });
          throw error;
        }
      },

      addMessage: async (chatId: string, data: AddMessageDTO) => {
        set({ isLoading: true, error: null });
        try {
          const newMessage = await chatService.addMessage(chatId, data);
          set((state) => ({
            messages: [...state.messages, newMessage],
            isLoading: false,
          }));
          return newMessage;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add message',
            isLoading: false,
          });
          throw error;
        }
      },

      setCurrentChat: (chat: ChatWithMessages | null) => {
        set({
          currentChat: chat,
          messages: chat ? chat.messages : [],
        });
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'ChatStore' }
  )
);
