import axios from 'axios';
import type {
  Class,
  ClassFormData,
  ClassListResponse,
  ClassDetailResponse,
  ClassStudent,
  AvailableStudent,
  ClassStudentListResponse,
} from '../types/class';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

// ── Classes ────────────────────────────────────────────────────────────────────

export const getClasses = async (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    academic_year_id?: string;
    major_id?: string;
    grade_level?: number;
    is_active?: string;
  },
  token?: string
): Promise<ClassListResponse> => {
  const response = await axios.get<ClassListResponse>(`${API_BASE_URL}/classes`, {
    params,
    headers: token ? authHeader(token) : {},
  });
  return response.data;
};

export const getClassesAll = async (
  token: string,
  academic_year_id?: string
): Promise<Class[]> => {
  const response = await axios.get<{ success: boolean; data: { classes: Class[] } }>(
    `${API_BASE_URL}/classes/all`,
    {
      params: academic_year_id ? { academic_year_id } : undefined,
      headers: authHeader(token),
    }
  );
  return response.data.data.classes;
};

export const getClassById = async (id: string, token: string): Promise<Class> => {
  const response = await axios.get<ClassDetailResponse>(`${API_BASE_URL}/classes/${id}`, {
    headers: authHeader(token),
  });
  return response.data.data.class;
};

export const createClass = async (data: ClassFormData, token: string): Promise<Class> => {
  const response = await axios.post<{ success: boolean; data: { class: Class } }>(
    `${API_BASE_URL}/classes`,
    data,
    { headers: authHeader(token) }
  );
  return response.data.data.class;
};

export const updateClass = async (
  id: string,
  data: Partial<ClassFormData>,
  token: string
): Promise<Class> => {
  const response = await axios.put<ClassDetailResponse>(`${API_BASE_URL}/classes/${id}`, data, {
    headers: authHeader(token),
  });
  return response.data.data.class;
};

export const deleteClass = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/classes/${id}`, { headers: authHeader(token) });
};

// ── Class Students ─────────────────────────────────────────────────────────────

export const getClassStudents = async (
  classId: string,
  params?: { page?: number; limit?: number; search?: string },
  token?: string
): Promise<ClassStudentListResponse> => {
  const response = await axios.get<ClassStudentListResponse>(
    `${API_BASE_URL}/classes/${classId}/students`,
    { params, headers: token ? authHeader(token) : {} }
  );
  return response.data;
};

export const getAvailableStudents = async (
  classId: string,
  search: string,
  token: string
): Promise<AvailableStudent[]> => {
  const response = await axios.get<{ success: boolean; data: { students: AvailableStudent[] } }>(
    `${API_BASE_URL}/classes/${classId}/available-students`,
    { params: { search }, headers: authHeader(token) }
  );
  return response.data.data.students;
};

export const addStudentToClass = async (
  classId: string,
  student_id: string,
  token: string
): Promise<ClassStudent> => {
  const response = await axios.post<{ success: boolean; data: { classStudent: ClassStudent } }>(
    `${API_BASE_URL}/classes/${classId}/students`,
    { student_id },
    { headers: authHeader(token) }
  );
  return response.data.data.classStudent;
};

export const removeStudentFromClass = async (
  classId: string,
  studentId: string,
  token: string
): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/classes/${classId}/students/${studentId}`, {
    headers: authHeader(token),
  });
};
