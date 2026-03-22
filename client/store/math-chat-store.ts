import { create } from 'zustand';
import {
  MathChat,
  MathChatMessage,
  MathChatWithMessages,
  createMathChat,
  getUserMathChats,
  getMathChatById,
  updateMathChat,
  deleteMathChat,
  addMathMessage,
  CreateMathChatDTO,
  UpdateMathChatDTO,
  AddMathMessageDTO,
} from '@/services/math-chat-service';

interface MathChatStore {
  // State
  chats: MathChat[];
  currentChat: MathChatWithMessages | null;
  messages: MathChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUserChats: () => Promise<void>;
  fetchChatById: (chatId: string) => Promise<void>;
  createChat: (data: CreateMathChatDTO) => Promise<MathChat | null>;
  updateChat: (chatId: string, data: UpdateMathChatDTO) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  addMessage: (chatId: string, data: AddMathMessageDTO) => Promise<void>;
  clearCurrentChat: () => void;
  setError: (error: string | null) => void;
}

export const useMathChatStore = create<MathChatStore>((set, get) => ({
  // Initial state
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  error: null,

  // Fetch all math chats for the user
  fetchUserChats: async () => {
    try {
      set({ isLoading: true, error: null });
      const chats = await getUserMathChats();
      set({ chats, isLoading: false });
    } catch (error) {
      console.error('Error fetching math chats:', error);
      set({ error: 'Failed to fetch math chats', isLoading: false });
    }
  },

  // Fetch a specific chat with messages
  fetchChatById: async (chatId: string) => {
    try {
      set({ isLoading: true, error: null });
      const chat = await getMathChatById(chatId);
      set({
        currentChat: chat,
        messages: chat.messages,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching math chat:', error);
      set({ error: 'Failed to fetch math chat', isLoading: false });
    }
  },

  // Create a new math chat
  createChat: async (data: CreateMathChatDTO) => {
    try {
      set({ isLoading: true, error: null });
      const newChat = await createMathChat(data);
      set((state) => ({
        chats: [newChat, ...state.chats],
        isLoading: false,
      }));
      return newChat;
    } catch (error) {
      console.error('Error creating math chat:', error);
      set({ error: 'Failed to create math chat', isLoading: false });
      return null;
    }
  },

  // Update chat title
  updateChat: async (chatId: string, data: UpdateMathChatDTO) => {
    try {
      set({ isLoading: true, error: null });
      const updatedChat = await updateMathChat(chatId, data);
      set((state) => ({
        chats: state.chats.map((chat) =>
          chat.mathChatId === chatId ? updatedChat : chat
        ),
        currentChat:
          state.currentChat?.mathChatId === chatId
            ? { ...state.currentChat, ...updatedChat }
            : state.currentChat,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error updating math chat:', error);
      set({ error: 'Failed to update math chat', isLoading: false });
    }
  },

  // Delete a chat
  deleteChat: async (chatId: string) => {
    try {
      set({ isLoading: true, error: null });
      await deleteMathChat(chatId);
      set((state) => ({
        chats: state.chats.filter((chat) => chat.mathChatId !== chatId),
        currentChat:
          state.currentChat?.mathChatId === chatId ? null : state.currentChat,
        messages:
          state.currentChat?.mathChatId === chatId ? [] : state.messages,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error deleting math chat:', error);
      set({ error: 'Failed to delete math chat', isLoading: false });
    }
  },

  // Add a message to the current chat
  addMessage: async (chatId: string, data: AddMathMessageDTO) => {
    try {
      const message = await addMathMessage(chatId, data);
      set((state) => ({
        messages: [...state.messages, message],
      }));
    } catch (error) {
      console.error('Error adding message:', error);
      set({ error: 'Failed to add message' });
    }
  },

  // Clear current chat
  clearCurrentChat: () => {
    set({ currentChat: null, messages: [] });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));
