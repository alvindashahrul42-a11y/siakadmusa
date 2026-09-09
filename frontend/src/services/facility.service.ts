import axios from 'axios';
import type {
  SchoolFacility,
  SchoolFacilityFormData,
  SchoolFacilityResponse,
  SchoolFacilityDetailResponse,
} from '../types/facility';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get all facilities (Public)
 */
export const getFacilities = async (params?: {
  page?: number;
  limit?: number;
  is_active?: boolean;
}): Promise<SchoolFacilityResponse> => {
  const response = await axios.get<SchoolFacilityResponse>(
    `${API_BASE_URL}/school-facilities`,
    { params }
  );
  return response.data;
};

/**
 * Get facility by ID (Public)
 */
export const getFacilityById = async (id: string): Promise<SchoolFacility> => {
  const response = await axios.get<SchoolFacilityDetailResponse>(
    `${API_BASE_URL}/school-facilities/${id}`
  );
  return response.data.data.facility;
};

/**
 * Create facility (Admin only)
 */
export const createFacility = async (
  data: SchoolFacilityFormData,
  token: string
): Promise<SchoolFacility> => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.description) formData.append('description', data.description);
  if (data.imageFile) formData.append('image', data.imageFile);
  formData.append('sort_order', data.sort_order.toString());
  formData.append('is_active', data.is_active.toString());

  const response = await axios.post<SchoolFacilityDetailResponse>(
    `${API_BASE_URL}/school-facilities`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.facility;
};

/**
 * Update facility (Admin only)
 */
export const updateFacility = async (
  id: string,
  data: SchoolFacilityFormData,
  token: string
): Promise<SchoolFacility> => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.description !== undefined) formData.append('description', data.description);
  if (data.imageFile) formData.append('image', data.imageFile);
  formData.append('sort_order', data.sort_order.toString());
  formData.append('is_active', data.is_active.toString());

  const response = await axios.put<SchoolFacilityDetailResponse>(
    `${API_BASE_URL}/school-facilities/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.facility;
};

/**
 * Delete facility (Admin only)
 */
export const deleteFacility = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/school-facilities/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
