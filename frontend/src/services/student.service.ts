import axios from 'axios';
import type { Student, StudentFormData, StudentListResponse, StudentDetailResponse } from '../types/student';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getStudents = async (
  params?: { page?: number; limit?: number; search?: string; class_name?: string; major?: string },
  token?: string
): Promise<StudentListResponse> => {
  const response = await axios.get<StudentListResponse>(`${API_BASE_URL}/students`, {
    params,
    headers: token ? authHeader(token) : {},
  });
  return response.data;
};

export const getStudentById = async (id: string, token: string): Promise<Student> => {
  const response = await axios.get<StudentDetailResponse>(`${API_BASE_URL}/students/${id}`, {
    headers: authHeader(token),
  });
  return response.data.data.student;
};

export const updateStudent = async (
  id: string,
  data: StudentFormData,
  token: string
): Promise<Student> => {
  const response = await axios.put<StudentDetailResponse>(`${API_BASE_URL}/students/${id}`, data, {
    headers: authHeader(token),
  });
  return response.data.data.student;
};

export const deleteStudent = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/students/${id}`, { headers: authHeader(token) });
};
