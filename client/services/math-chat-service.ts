import { Axios } from '@/config/axios';
import useAuthStore from '@/store/store';

export interface MathChat {
  mathChatId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface MathChatMessage {
  messageId: string;
  mathChatId: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface MathChatWithMessages extends MathChat {
  messages: MathChatMessage[];
}

export interface CreateMathChatDTO {
  title?: string;
}

export interface UpdateMathChatDTO {
  title: string;
}

export interface AddMathMessageDTO {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AIResponseChunk {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  messageId?: string;
  message?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface DeleteMathMessagePairResponse {
  deletedMessageIds: string[];
}

export interface MathMessageWebSearchSource {
  title: string;
  link: string;
  displayLink: string;
  snippet: string;
}

export interface MathMessageWebSearchResult {
  searchId: string;
  messageId: string;
  mathChatId: string;
  searchQuery: string;
  summary: string;
  sources: MathMessageWebSearchSource[];
  createdAt: string;
  cached: boolean;
}

export interface RunMathMessageWebSearchDTO {
  query?: string;
  forceRefresh?: boolean;
}

// Create a new math chat
export const createMathChat = async (data: CreateMathChatDTO): Promise<MathChat> => {
  const response = await Axios.post<ApiResponse<MathChat>>('/api/math-chats', data);
  return response.data.data;
};

// Get all math chats for the user
export const getUserMathChats = async (): Promise<MathChat[]> => {
  const response = await Axios.get<ApiResponse<MathChat[]>>('/api/math-chats');
  return response.data.data;
};

// Get a single math chat by ID with messages
export const getMathChatById = async (chatId: string): Promise<MathChatWithMessages> => {
  const response = await Axios.get<ApiResponse<MathChatWithMessages>>(
    `/api/math-chats/${chatId}`
  );
  return response.data.data;
};

// Update math chat title
export const updateMathChat = async (
  chatId: string,
  data: UpdateMathChatDTO
): Promise<MathChat> => {
  const response = await Axios.put<ApiResponse<MathChat>>(
    `/api/math-chats/${chatId}`,
    data
  );
  return response.data.data;
};

// Delete a math chat
export const deleteMathChat = async (chatId: string): Promise<void> => {
  await Axios.delete(`/api/math-chats/${chatId}`);
};

// Add a message to a math chat
export const addMathMessage = async (
  chatId: string,
  data: AddMathMessageDTO
): Promise<MathChatMessage> => {
  const response = await Axios.post<ApiResponse<MathChatMessage>>(
    `/api/math-chats/${chatId}/messages`,
    data
  );
  return response.data.data;
};

// Delete selected message and its related pair message
export const deleteMathMessagePair = async (
  chatId: string,
  messageId: string
): Promise<DeleteMathMessagePairResponse> => {
  const response = await Axios.delete<ApiResponse<DeleteMathMessagePairResponse>>(
    `/api/math-chats/${chatId}/messages/${messageId}`
  );
  return response.data.data;
};

export const getMathMessageWebSearch = async (
  chatId: string,
  messageId: string
): Promise<MathMessageWebSearchResult> => {
  const response = await Axios.get<ApiResponse<MathMessageWebSearchResult>>(
    `/api/math-chats/${chatId}/messages/${messageId}/web-search`
  );
  return response.data.data;
};

export const runMathMessageWebSearch = async (
  chatId: string,
  messageId: string,
  data: RunMathMessageWebSearchDTO = {}
): Promise<MathMessageWebSearchResult> => {
  const response = await Axios.post<ApiResponse<MathMessageWebSearchResult>>(
    `/api/math-chats/${chatId}/messages/${messageId}/web-search`,
    data
  );
  return response.data.data;
};

// Stream AI response for a math problem
export const streamMathAIResponse = async (
  chatId: string,
  userMessage: string,
  onChunk: (content: string) => void,
  onError: (error: string) => void,
  onDone: () => void
): Promise<void> => {
  try {
    const baseURL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000';
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(`${baseURL}/api/math-chats/${chatId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userMessage }),
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

            if (data.type === 'chunk' && data.content) {
              onChunk(data.content);
            } else if (data.type === 'done') {
              onDone();
              return;
            } else if (data.type === 'error') {
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
    console.error('Streaming error:', error);
    onError('Failed to get AI response');
  }
};

// Translate content to Bangla
export const translateContentToBangla = async (content: string): Promise<string> => {
  const response = await Axios.post<ApiResponse<{ translatedContent: string }>>(
    '/api/math-chats/translate',
    { content }
  );
  return response.data.data.translatedContent;
};

// Generate Bangla text-to-speech audio
export const generateBanglaSpeech = async (text: string): Promise<string> => {
  try {
    const response = await Axios.post(
      '/api/math-chats/text-to-speech',
      { text },
      {
        responseType: 'blob', // Important: receive audio as blob
      }
    );
    
    console.log('TTS Response:', {
      status: response.status,
      contentType: response.headers['content-type'],
      dataSize: response.data?.size
    });
    
    // Validate the response
    if (!response.data) {
      throw new Error('No audio data received from server');
    }

    // Check if we received JSON error instead of audio
    // This can happen when the server returns an error but responseType is 'blob'
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      // Parse the JSON error
      const text = await response.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || 'Server returned an error');
    }

    // Check if blob has content
    const audioBlob = response.data;
    console.log('Audio blob:', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    if (audioBlob.size === 0) {
      throw new Error('Received empty audio file');
    }

    // Verify it's actually audio data by checking the blob type
    if (!audioBlob.type.includes('audio') && !audioBlob.type.includes('mpeg') && !audioBlob.type.includes('octet-stream')) {
      console.error('Invalid blob type:', audioBlob.type);
      throw new Error('Received invalid audio format');
    }

    // Create a blob URL from the audio data
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log('Created audio URL:', audioUrl);
    
    return audioUrl;
  } catch (error: unknown) {
    console.error('Error in generateBanglaSpeech:', error);
    
    // Handle Axios errors
    const axiosError = error as { response?: { status?: number; data?: Blob | Record<string, unknown> } };
    if (axiosError.response) {
      const status = axiosError.response.status;
      
      // Try to extract error message from response
      let errorMessage = 'Text-to-speech generation failed';
      
      if (axiosError.response.data) {
        try {
          // If data is a blob, try to read it as text
          if (axiosError.response.data instanceof Blob) {
            const text = await axiosError.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } else if (typeof axiosError.response.data === 'object') {
            const dataObj = axiosError.response.data as Record<string, unknown>;
            errorMessage = (dataObj.message as string) || errorMessage;
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
      }
      
      if (status === 400) {
        throw new Error(errorMessage);
      } else if (status === 500) {
        throw new Error('Server error: ' + errorMessage);
      }
    }
    
    // Re-throw the error with context
    throw error;
  }
};
