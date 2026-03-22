import { Axios } from '@/config/axios';

export interface Material {
  materialId: string;
  courseId: string;
  topicId: string | null;
  name: string;
  description: string | null;
  type: string;
  url: string;
  fileSize: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateMaterialDTO {
  courseId: string;
  topicId?: string | null;
  name: string;
  description?: string;
  type: string;
  url?: string;
  fileSize?: string;
  file?: File;
}

export interface UpdateMaterialDTO {
  name?: string;
  description?: string;
  topicId?: string | null;
  type?: string;
  url?: string;
  fileSize?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

// Create a new material
export const createMaterial = async (data: CreateMaterialDTO): Promise<Material> => {
  // If file is provided, use FormData
  if (data.file) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('courseId', data.courseId);
    formData.append('name', data.name);
    formData.append('type', data.type);
    
    if (data.topicId) {
      formData.append('topicId', data.topicId);
    }
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await Axios.post<ApiResponse<Material>>('/api/materials', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }
  
  // Otherwise, use regular JSON
  const response = await Axios.post<ApiResponse<Material>>('/api/materials', data);
  return response.data.data;
};

// Get all materials for a course
export const getCourseMaterials = async (courseId: string): Promise<Material[]> => {
  const response = await Axios.get<ApiResponse<Material[]>>(
    `/api/materials/course/${courseId}`
  );
  return response.data.data;
};

// Get all materials for a topic
export const getTopicMaterials = async (topicId: string): Promise<Material[]> => {
  const response = await Axios.get<ApiResponse<Material[]>>(
    `/api/materials/topic/${topicId}`
  );
  return response.data.data;
};

// Get a single material by ID
export const getMaterialById = async (materialId: string): Promise<Material> => {
  const response = await Axios.get<ApiResponse<Material>>(
    `/api/materials/${materialId}`
  );
  return response.data.data;
};

// Update a material
export const updateMaterial = async (
  materialId: string,
  data: UpdateMaterialDTO
): Promise<Material> => {
  const response = await Axios.put<ApiResponse<Material>>(
    `/api/materials/${materialId}`,
    data
  );
  return response.data.data;
};

// Delete a material
export const deleteMaterial = async (materialId: string): Promise<void> => {
  await Axios.delete(`/api/materials/${materialId}`);
};
