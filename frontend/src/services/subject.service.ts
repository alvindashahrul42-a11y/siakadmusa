import axios from 'axios';
import type {
  Subject,
  SubjectFormData,
  SubjectListResponse,
  SubjectDetailResponse,
} from '../types/subject';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getSubjects = async (
  params?: { page?: number; limit?: number; search?: string; is_active?: string },
  token?: string
): Promise<SubjectListResponse> => {
  const res = await axios.get<SubjectListResponse>(`${API_BASE_URL}/subjects`, {
    params,
    headers: token ? authHeader(token) : {},
  });
  return res.data;
};

export const getSubjectsAll = async (token: string): Promise<Subject[]> => {
  const res = await axios.get<{ success: boolean; data: { subjects: Subject[] } }>(
    `${API_BASE_URL}/subjects/all`,
    { headers: authHeader(token) }
  );
  return res.data.data.subjects;
};

export const getSubjectById = async (id: string, token: string): Promise<Subject> => {
  const res = await axios.get<SubjectDetailResponse>(`${API_BASE_URL}/subjects/${id}`, {
    headers: authHeader(token),
  });
  return res.data.data.subject;
};

export const createSubject = async (data: SubjectFormData, token: string): Promise<Subject> => {
  const res = await axios.post<SubjectDetailResponse>(`${API_BASE_URL}/subjects`, data, {
    headers: authHeader(token),
  });
  return res.data.data.subject;
};

export const updateSubject = async (
  id: string,
  data: Partial<SubjectFormData>,
  token: string
): Promise<Subject> => {
  const res = await axios.put<SubjectDetailResponse>(`${API_BASE_URL}/subjects/${id}`, data, {
    headers: authHeader(token),
  });
  return res.data.data.subject;
};

export const deleteSubject = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/subjects/${id}`, { headers: authHeader(token) });
};
