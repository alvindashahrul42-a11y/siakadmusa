import axios from 'axios';
import type {
  SchoolProgram,
  SchoolProgramFormData,
  SchoolProgramResponse,
  SchoolProgramDetailResponse,
} from '../types/schoolProgram';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get all programs (Public)
 */
export const getPrograms = async (params?: {
  page?: number;
  limit?: number;
  is_active?: boolean;
}): Promise<SchoolProgramResponse> => {
  const response = await axios.get<SchoolProgramResponse>(
    `${API_BASE_URL}/school-programs`,
    { params }
  );
  return response.data;
};

/**
 * Get program by ID (Public)
 */
export const getProgramById = async (id: string): Promise<SchoolProgram> => {
  const response = await axios.get<SchoolProgramDetailResponse>(
    `${API_BASE_URL}/school-programs/${id}`
  );
  return response.data.data.program;
};

/**
 * Create program (Admin only)
 */
export const createProgram = async (
  data: SchoolProgramFormData,
  token: string
): Promise<SchoolProgram> => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.description) formData.append('description', data.description);
  if (data.imageFile) formData.append('image', data.imageFile);
  formData.append('sort_order', data.sort_order.toString());
  formData.append('is_active', data.is_active.toString());

  const response = await axios.post<SchoolProgramDetailResponse>(
    `${API_BASE_URL}/school-programs`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.program;
};

/**
 * Update program (Admin only)
 */
export const updateProgram = async (
  id: string,
  data: SchoolProgramFormData,
  token: string
): Promise<SchoolProgram> => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.description !== undefined) formData.append('description', data.description);
  if (data.imageFile) formData.append('image', data.imageFile);
  formData.append('sort_order', data.sort_order.toString());
  formData.append('is_active', data.is_active.toString());

  const response = await axios.put<SchoolProgramDetailResponse>(
    `${API_BASE_URL}/school-programs/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.program;
};

/**
 * Delete program (Admin only)
 */
export const deleteProgram = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/school-programs/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
