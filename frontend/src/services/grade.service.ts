import axios from 'axios';
import type { Grade, GradeFormData, GradeListResponse, GradeDetailResponse } from '../types/grade';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getGrades = async (
  params: { class_subject_id: string; page?: number; limit?: number },
  token: string
): Promise<GradeListResponse> => {
  const res = await axios.get<GradeListResponse>(`${API_BASE_URL}/grades`, {
    params,
    headers: authHeader(token),
  });
  return res.data;
};

export const getGradesByStudent = async (
  student_id: string,
  class_id: string,
  token: string
): Promise<Grade[]> => {
  const res = await axios.get<{ success: boolean; data: { grades: Grade[] } }>(
    `${API_BASE_URL}/grades/student`,
    { params: { student_id, class_id }, headers: authHeader(token) }
  );
  return res.data.data.grades;
};

export const getGradeById = async (id: string, token: string): Promise<Grade> => {
  const res = await axios.get<GradeDetailResponse>(`${API_BASE_URL}/grades/${id}`, {
    headers: authHeader(token),
  });
  return res.data.data.grade;
};

export const upsertGrade = async (data: GradeFormData, token: string): Promise<Grade> => {
  const res = await axios.post<GradeDetailResponse>(`${API_BASE_URL}/grades`, data, {
    headers: authHeader(token),
  });
  return res.data.data.grade;
};

export const updateGrade = async (
  id: string,
  data: Partial<Omit<GradeFormData, 'class_subject_id' | 'student_id'>>,
  token: string
): Promise<Grade> => {
  const res = await axios.put<GradeDetailResponse>(`${API_BASE_URL}/grades/${id}`, data, {
    headers: authHeader(token),
  });
  return res.data.data.grade;
};

export const deleteGrade = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/grades/${id}`, { headers: authHeader(token) });
};

// ── Grade Import / Export ─────────────────────────────────────────────────────

/** Download template Excel nilai (opsional: class_subject_id untuk isi nama siswa) */
export const downloadGradeTemplate = async (
  class_subject_id: string,
  token: string
): Promise<Blob> => {
  const res = await axios.get(`${API_BASE_URL}/grades/template`, {
    params:       { class_subject_id },
    headers:      authHeader(token),
    responseType: 'blob',
  });
  return res.data;
};

/** Upload file Excel nilai bulk */
export const importGrades = async (
  class_subject_id: string,
  file: File,
  token: string
): Promise<{ imported_count: number; grades: Grade[] }> => {
  const form = new FormData();
  form.append('file', file);
  const res = await axios.post<{ success: boolean; data: { imported_count: number; grades: Grade[] } }>(
    `${API_BASE_URL}/grades/import`,
    form,
    {
      params:  { class_subject_id },
      headers: { ...authHeader(token), 'Content-Type': 'multipart/form-data' },
    }
  );
  return res.data.data;
};
