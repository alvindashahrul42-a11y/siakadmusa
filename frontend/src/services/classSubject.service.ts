import axios from 'axios';
import type {
  ClassSubject,
  ClassSubjectFormData,
  ClassSubjectUpdateData,
  ClassSubjectListResponse,
  ClassSubjectDetailResponse,
} from '../types/classSubject';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getClassSubjects = async (
  classId: string,
  params?: { page?: number; limit?: number; search?: string },
  token?: string
): Promise<ClassSubjectListResponse> => {
  const res = await axios.get<ClassSubjectListResponse>(
    `${API_BASE_URL}/classes/${classId}/subjects`,
    { params, headers: token ? authHeader(token) : {} }
  );
  return res.data;
};

export const getClassSubjectById = async (
  classId: string,
  id: string,
  token: string
): Promise<ClassSubject> => {
  const res = await axios.get<ClassSubjectDetailResponse>(
    `${API_BASE_URL}/classes/${classId}/subjects/${id}`,
    { headers: authHeader(token) }
  );
  return res.data.data.classSubject;
};

export const createClassSubject = async (
  classId: string,
  data: ClassSubjectFormData,
  token: string
): Promise<ClassSubject> => {
  const res = await axios.post<ClassSubjectDetailResponse>(
    `${API_BASE_URL}/classes/${classId}/subjects`,
    data,
    { headers: authHeader(token) }
  );
  return res.data.data.classSubject;
};

export const updateClassSubject = async (
  classId: string,
  id: string,
  data: ClassSubjectUpdateData,
  token: string
): Promise<ClassSubject> => {
  const res = await axios.put<ClassSubjectDetailResponse>(
    `${API_BASE_URL}/classes/${classId}/subjects/${id}`,
    data,
    { headers: authHeader(token) }
  );
  return res.data.data.classSubject;
};

export const deleteClassSubject = async (
  classId: string,
  id: string,
  token: string
): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/classes/${classId}/subjects/${id}`, {
    headers: authHeader(token),
  });
};
