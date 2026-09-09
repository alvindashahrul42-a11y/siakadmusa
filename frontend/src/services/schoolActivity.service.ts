import axios from 'axios';
import type {
  SchoolActivity,
  SchoolActivityFormData,
  SchoolActivityResponse,
  SchoolActivityDetailResponse,
} from '../types/schoolActivity';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get all activities (Public)
 */
export const getActivities = async (params?: {
  page?: number;
  limit?: number;
  is_published?: boolean;
}): Promise<SchoolActivityResponse> => {
  const response = await axios.get<SchoolActivityResponse>(
    `${API_BASE_URL}/school-activities`,
    { params }
  );
  return response.data;
};

/**
 * Get activity by ID (Public)
 */
export const getActivityById = async (id: string): Promise<SchoolActivity> => {
  const response = await axios.get<SchoolActivityDetailResponse>(
    `${API_BASE_URL}/school-activities/${id}`
  );
  return response.data.data.activity;
};

/**
 * Create activity (Admin only)
 */
export const createActivity = async (
  data: SchoolActivityFormData,
  token: string
): Promise<SchoolActivity> => {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.imageFile) formData.append('image', data.imageFile);
  if (data.activity_date) formData.append('activity_date', data.activity_date);
  formData.append('sort_order', data.sort_order.toString());
  formData.append('is_published', data.is_published.toString());

  const response = await axios.post<SchoolActivityDetailResponse>(
    `${API_BASE_URL}/school-activities`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.activity;
};

/**
 * Update activity (Admin only)
 */
export const updateActivity = async (
  id: string,
  data: SchoolActivityFormData,
  token: string
): Promise<SchoolActivity> => {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.description !== undefined) formData.append('description', data.description);
  if (data.imageFile) formData.append('image', data.imageFile);
  formData.append('activity_date', data.activity_date ?? '');
  formData.append('sort_order', data.sort_order.toString());
  formData.append('is_published', data.is_published.toString());

  const response = await axios.put<SchoolActivityDetailResponse>(
    `${API_BASE_URL}/school-activities/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.activity;
};

/**
 * Delete activity (Admin only)
 */
export const deleteActivity = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/school-activities/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
