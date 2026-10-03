import axios from 'axios';
import type {
  Major,
  MajorFormData,
  MajorListResponse,
  MajorDetailResponse,
} from '../types/major';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getMajors = async (
  params?: { page?: number; limit?: number; search?: string; is_active?: string },
  token?: string
): Promise<MajorListResponse> => {
  const response = await axios.get<MajorListResponse>(`${API_BASE_URL}/majors`, {
    params,
    headers: token ? authHeader(token) : {},
  });
  return response.data;
};

export const getMajorsAll = async (token: string): Promise<Major[]> => {
  const response = await axios.get<{ success: boolean; data: { majors: Major[] } }>(
    `${API_BASE_URL}/majors/all`,
    { headers: authHeader(token) }
  );
  return response.data.data.majors;
};

export const getMajorById = async (id: string, token: string): Promise<Major> => {
  const response = await axios.get<MajorDetailResponse>(`${API_BASE_URL}/majors/${id}`, {
    headers: authHeader(token),
  });
  return response.data.data.major;
};

export const createMajor = async (data: MajorFormData, token: string): Promise<Major> => {
  const response = await axios.post<{ success: boolean; data: { major: Major } }>(
    `${API_BASE_URL}/majors`,
    data,
    { headers: authHeader(token) }
  );
  return response.data.data.major;
};

export const updateMajor = async (
  id: string,
  data: Partial<MajorFormData>,
  token: string
): Promise<Major> => {
  const response = await axios.put<MajorDetailResponse>(`${API_BASE_URL}/majors/${id}`, data, {
    headers: authHeader(token),
  });
  return response.data.data.major;
};

export const deleteMajor = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/majors/${id}`, { headers: authHeader(token) });
};
