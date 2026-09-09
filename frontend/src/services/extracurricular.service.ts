import axios from 'axios';
import type {
  Extracurricular,
  ExtracurricularFormData,
  ExtracurricularResponse,
  ExtracurricularDetailResponse,
} from '../types/extracurricular';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get all extracurriculars (Public)
 */
export const getExtracurriculars = async (params?: {
  page?: number;
  limit?: number;
  is_active?: boolean;
}): Promise<ExtracurricularResponse> => {
  const response = await axios.get<ExtracurricularResponse>(
    `${API_BASE_URL}/extracurriculars`,
    { params }
  );
  return response.data;
};

/**
 * Get extracurricular by ID (Public)
 */
export const getExtracurricularById = async (id: string): Promise<Extracurricular> => {
  const response = await axios.get<ExtracurricularDetailResponse>(
    `${API_BASE_URL}/extracurriculars/${id}`
  );
  return response.data.data.extracurricular;
};

/**
 * Create extracurricular (Admin only)
 */
export const createExtracurricular = async (
  data: ExtracurricularFormData,
  token: string
): Promise<Extracurricular> => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.imageFile) formData.append('image', data.imageFile);
  formData.append('sort_order', data.sort_order.toString());
  formData.append('is_active', data.is_active.toString());

  const response = await axios.post<ExtracurricularDetailResponse>(
    `${API_BASE_URL}/extracurriculars`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.extracurricular;
};

/**
 * Update extracurricular (Admin only)
 */
export const updateExtracurricular = async (
  id: string,
  data: ExtracurricularFormData,
  token: string
): Promise<Extracurricular> => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.imageFile) formData.append('image', data.imageFile);
  formData.append('sort_order', data.sort_order.toString());
  formData.append('is_active', data.is_active.toString());

  const response = await axios.put<ExtracurricularDetailResponse>(
    `${API_BASE_URL}/extracurriculars/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.extracurricular;
};

/**
 * Delete extracurricular (Admin only)
 */
export const deleteExtracurricular = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/extracurriculars/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
