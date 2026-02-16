import { Axios } from '@/config/axios';
import { AxiosError } from 'axios';
import useAuthStore from '@/store/store';
import { env } from '@/config/env';

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

// Types
export interface ResearchPaper {
  paperId: string;
  userId: string;
  title: string;
  description: string | null;
  authors: string | null;
  publicationDate: string | null;
  source: string | null;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: string;
  isIndexed: boolean;
  indexedAt: Date | null;
  vectorCount: number | null;
  chunkCount: number | null;
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  parsingError: string | null;
  category: string | null;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResearchPaperUpload {
  title: string;
  description?: string;
  authors?: string;
  publicationDate?: string;
  source?: string;
  category?: string;
  tags?: string;
}

export interface ParsingStatus {
  paperId: string;
  title: string;
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  parsingError: string | null;
  isIndexed: boolean;
  indexedAt: Date | null;
  vectorCount: number | null;
  chunkCount: number | null;
}

/**
 * Upload a research paper file
 */
export const uploadResearchPaper = async (
  file: File,
  metadata: ResearchPaperUpload
): Promise<ApiResponse<{ paper: ResearchPaper }>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.authors) formData.append('authors', metadata.authors);
    if (metadata.publicationDate) formData.append('publicationDate', metadata.publicationDate);
    if (metadata.source) formData.append('source', metadata.source);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.tags) formData.append('tags', metadata.tags);

    const response = await Axios.post<ApiResponse<{ paper: ResearchPaper }>>(
      '/api/research-papers/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to upload research paper');
    }
    throw error;
  }
};

/**
 * Get all research papers for the current user
 */
export const getUserResearchPapers = async (): Promise<
  ApiResponse<{ papers: ResearchPaper[] }>
> => {
  try {
    const response = await Axios.get<ApiResponse<{ papers: ResearchPaper[] }>>(
      '/api/research-papers'
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to fetch research papers');
    }
    throw error;
  }
};

/**
 * Get a single research paper by ID
 */
export const getResearchPaperById = async (
  paperId: string
): Promise<ApiResponse<{ paper: ResearchPaper; chunks: number }>> => {
  try {
    const response = await Axios.get<
      ApiResponse<{ paper: ResearchPaper; chunks: number }>
    >(`/api/research-papers/${paperId}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to fetch research paper');
    }
    throw error;
  }
};

/**
 * Get parsing status for a research paper
 */
export const getParsingStatus = async (
  paperId: string
): Promise<ApiResponse<ParsingStatus>> => {
  try {
    const response = await Axios.get<ApiResponse<ParsingStatus>>(
      `/api/research-papers/${paperId}/status`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to fetch parsing status');
    }
    throw error;
  }
};

/**
 * Delete a research paper
 */
export const deleteResearchPaper = async (
  paperId: string
): Promise<ApiResponse<{ deleted: ResearchPaper }>> => {
  try {
    const response = await Axios.delete<ApiResponse<{ deleted: ResearchPaper }>>(
      `/api/research-papers/${paperId}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to delete research paper');
    }
    throw error;
  }
};

// Research Chat Types
export interface PaperReference {
  paperId: string;
  fileName: string;
  fileUrl: string;
  chunkIds: string[];
  relevantChunks: string[];
}

export interface ResearchChatMessage {
  type: 'chunk' | 'references' | 'done' | 'error';
  content?: string;
  message?: string;
  data?: PaperReference[];
}

// Database message type
export interface ResearchChatMessageDB {
  messageId: string;
  researchChatId: string;
  role: 'user' | 'assistant';
  content: string;
  paperReferences: PaperReference[] | null;
  metadata: unknown;
  createdAt: Date;
}

/**
 * Fetch all chat messages for the user
 */
export const getResearchChatMessages = async (): Promise<
  ApiResponse<ResearchChatMessageDB[]>
> => {
  try {
    const response = await Axios.get<ApiResponse<ResearchChatMessageDB[]>>(
      '/api/research-papers/messages'
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to fetch chat messages');
    }
    throw error;
  }
};

/**
 * Stream research chat response (SSE)
 */
export const streamResearchChat = async (
  question: string,
  onChunk: (content: string) => void,
  onReferences: (references: PaperReference[]) => void,
  onError: (error: string) => void,
  onComplete: () => void
): Promise<void> => {
  try {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const baseURL = env.BACKEND_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${baseURL}/api/research-papers/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is null');
    }

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed: ResearchChatMessage = JSON.parse(data);

            if (parsed.type === 'chunk' && parsed.content) {
              onChunk(parsed.content);
            } else if (parsed.type === 'references' && parsed.data) {
              onReferences(parsed.data);
            } else if (parsed.type === 'done') {
              onComplete();
            } else if (parsed.type === 'error') {
              onError(parsed.message || 'Unknown error');
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      onError(error.message);
    } else {
      onError('Failed to stream chat response');
    }
  }
};
