import { Axios } from '@/config/axios';
import useAuthStore from '@/store/store';

export interface Chat {
  chatId: string;
  courseId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface ChatMessage {
  messageId: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ChatWithMessages extends Chat {
  messages: ChatMessage[];
}

export interface CreateChatDTO {
  courseId: string;
  title?: string;
}

export interface UpdateChatDTO {
  title: string;
}

export interface AddMessageDTO {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Record<string, unknown>;
}

export interface MaterialReference {
  materialId: string;
  materialName: string;
  fileName: string;
  url: string;
  chunkIds: string[];
  relevantChunks: string[];
}

export interface AIResponseChunk {
  type: 'chunk' | 'references' | 'done' | 'error';
  content?: string;
  data?: MaterialReference[];
  message?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

// Create a new chat
export const createChat = async (data: CreateChatDTO): Promise<Chat> => {
  const response = await Axios.post<ApiResponse<Chat>>('/api/chats', data);
  return response.data.data;
};

// Get all chats for a course
export const getCourseChats = async (courseId: string): Promise<Chat[]> => {
  const response = await Axios.get<ApiResponse<Chat[]>>(
    `/api/chats/course/${courseId}`
  );
  return response.data.data;
};

// Get a single chat by ID with messages
export const getChatById = async (chatId: string): Promise<ChatWithMessages> => {
  const response = await Axios.get<ApiResponse<ChatWithMessages>>(
    `/api/chats/${chatId}`
  );
  return response.data.data;
};

// Update chat title
export const updateChat = async (
  chatId: string,
  data: UpdateChatDTO
): Promise<Chat> => {
  const response = await Axios.put<ApiResponse<Chat>>(
    `/api/chats/${chatId}`,
    data
  );
  return response.data.data;
};

// Delete a chat
export const deleteChat = async (chatId: string): Promise<void> => {
  await Axios.delete(`/api/chats/${chatId}`);
};

// Add a message to a chat
export const addMessage = async (
  chatId: string,
  data: AddMessageDTO
): Promise<ChatMessage> => {
  const response = await Axios.post<ApiResponse<ChatMessage>>(
    `/api/chats/${chatId}/messages`,
    data
  );
  return response.data.data;
};

// Get messages for a chat
export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  const response = await Axios.get<ApiResponse<ChatMessage[]>>(
    `/api/chats/${chatId}/messages`
  );
  return response.data.data;
};

// Delete all chats for a course
export const deleteAllCourseChats = async (courseId: string): Promise<void> => {
  await Axios.delete(`/api/chats/course/${courseId}`);
};

// Stream AI chat response with RAG (Server-Sent Events)
export async function streamAIResponse(
  chatId: string,
  question: string,
  onChunk: (content: string) => void,
  onReferences: (references: MaterialReference[]) => void,
  onError: (error: string) => void,
  onDone: () => void
): Promise<void> {
  try {
    // Get token from auth store (same as Axios interceptor)
    const token = useAuthStore.getState().accessToken;
    const baseURL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${baseURL}/api/chats/${chatId}/ai-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data: AIResponseChunk = JSON.parse(line.slice(6));

            switch (data.type) {
              case 'chunk':
                if (data.content) {
                  onChunk(data.content);
                }
                break;
              case 'references':
                if (data.data) {
                  onReferences(data.data);
                }
                break;
              case 'done':
                onDone();
                return;
              case 'error':
                onError(data.message || 'Unknown error');
                return;
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in streamAIResponse:', error);
    onError(error instanceof Error ? error.message : 'Failed to get AI response');
  }
}

// Non-streaming AI response (fallback)
export const getAIResponse = async (
  chatId: string,
  question: string
): Promise<{
  answer: string;
  references: MaterialReference[];
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}> => {
  const response = await Axios.post(`/api/chats/${chatId}/ai-response-sync`, {
    question,
  });
  return response.data.data;
};
