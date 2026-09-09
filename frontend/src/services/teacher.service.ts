import axios from 'axios';
import type {
  Teacher,
  TeacherCreateFormData,
  TeacherUpdateFormData,
  TeacherListResponse,
  TeacherDetailResponse,
} from '../types/teacher';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getTeachers = async (
  params?: { page?: number; limit?: number; search?: string; subject?: string },
  token?: string
): Promise<TeacherListResponse> => {
  const response = await axios.get<TeacherListResponse>(`${API_BASE_URL}/teachers`, {
    params,
    headers: token ? authHeader(token) : {},
  });
  return response.data;
};

export const getTeacherById = async (id: string, token: string): Promise<Teacher> => {
  const response = await axios.get<TeacherDetailResponse>(`${API_BASE_URL}/teachers/${id}`, {
    headers: authHeader(token),
  });
  return response.data.data.teacher;
};

export const createTeacher = async (
  data: TeacherCreateFormData,
  token: string
): Promise<Teacher> => {
  const response = await axios.post<{ success: boolean; data: { teacher: Teacher } }>(
    `${API_BASE_URL}/teachers`,
    data,
    { headers: authHeader(token) }
  );
  return response.data.data.teacher;
};

export const updateTeacher = async (
  id: string,
  data: TeacherUpdateFormData,
  token: string
): Promise<Teacher> => {
  const response = await axios.put<TeacherDetailResponse>(`${API_BASE_URL}/teachers/${id}`, data, {
    headers: authHeader(token),
  });
  return response.data.data.teacher;
};

export const deleteTeacher = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/teachers/${id}`, { headers: authHeader(token) });
};
