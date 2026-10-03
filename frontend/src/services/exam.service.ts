import axios from 'axios';
import type {
  ExamType, ExamTypeFormData, ExamTypeListResponse, ExamTypeDetailResponse,
  Exam, ExamFormData, ExamListResponse, ExamDetailResponse,
  ExamSchedule, ExamScheduleFormData, ExamScheduleListResponse, ExamScheduleDetailResponse,
  ExamSupervisor, ExamSupervisorFormData, ExamSupervisorListResponse,
} from '../types/exam';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

// ── ExamType ──────────────────────────────────────────────────────────────────

export const getExamTypes = async (
  params: { page?: number; limit?: number; search?: string },
  token: string
): Promise<ExamTypeListResponse> => {
  const res = await axios.get<ExamTypeListResponse>(`${API_BASE_URL}/exam-types`, {
    params,
    headers: authHeader(token),
  });
  return res.data;
};

export const getExamTypesActive = async (token: string): Promise<ExamType[]> => {
  const res = await axios.get<{ success: boolean; data: { examTypes: ExamType[] } }>(
    `${API_BASE_URL}/exam-types/active`,
    { headers: authHeader(token) }
  );
  return res.data.data.examTypes;
};

export const getExamTypeById = async (id: string, token: string): Promise<ExamType> => {
  const res = await axios.get<ExamTypeDetailResponse>(`${API_BASE_URL}/exam-types/${id}`, {
    headers: authHeader(token),
  });
  return res.data.data.examType;
};

export const createExamType = async (data: ExamTypeFormData, token: string): Promise<ExamType> => {
  const res = await axios.post<ExamTypeDetailResponse>(`${API_BASE_URL}/exam-types`, data, {
    headers: authHeader(token),
  });
  return res.data.data.examType;
};

export const updateExamType = async (
  id: string,
  data: Partial<ExamTypeFormData>,
  token: string
): Promise<ExamType> => {
  const res = await axios.put<ExamTypeDetailResponse>(`${API_BASE_URL}/exam-types/${id}`, data, {
    headers: authHeader(token),
  });
  return res.data.data.examType;
};

export const deleteExamType = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/exam-types/${id}`, { headers: authHeader(token) });
};

// ── Exam ──────────────────────────────────────────────────────────────────────

export const getExams = async (
  params: { page?: number; limit?: number; search?: string; academic_year_id?: string; semester?: string },
  token: string
): Promise<ExamListResponse> => {
  const res = await axios.get<ExamListResponse>(`${API_BASE_URL}/exams`, {
    params,
    headers: authHeader(token),
  });
  return res.data;
};

export const getExamById = async (id: string, token: string): Promise<Exam> => {
  const res = await axios.get<ExamDetailResponse>(`${API_BASE_URL}/exams/${id}`, {
    headers: authHeader(token),
  });
  return res.data.data.exam;
};

export const createExam = async (data: ExamFormData, token: string): Promise<Exam> => {
  const res = await axios.post<ExamDetailResponse>(`${API_BASE_URL}/exams`, data, {
    headers: authHeader(token),
  });
  return res.data.data.exam;
};

export const updateExam = async (
  id: string,
  data: Partial<ExamFormData>,
  token: string
): Promise<Exam> => {
  const res = await axios.put<ExamDetailResponse>(`${API_BASE_URL}/exams/${id}`, data, {
    headers: authHeader(token),
  });
  return res.data.data.exam;
};

export const toggleExamPublish = async (id: string, token: string): Promise<Exam> => {
  const res = await axios.patch<ExamDetailResponse>(
    `${API_BASE_URL}/exams/${id}/toggle-publish`,
    {},
    { headers: authHeader(token) }
  );
  return res.data.data.exam;
};

export const deleteExam = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/exams/${id}`, { headers: authHeader(token) });
};

// ── ExamSchedule ──────────────────────────────────────────────────────────────

export const getExamSchedules = async (
  params: { exam_id: string; page?: number; limit?: number; search?: string },
  token: string
): Promise<ExamScheduleListResponse> => {
  const res = await axios.get<ExamScheduleListResponse>(`${API_BASE_URL}/exam-schedules`, {
    params,
    headers: authHeader(token),
  });
  return res.data;
};

export const getExamScheduleById = async (id: string, token: string): Promise<ExamSchedule> => {
  const res = await axios.get<ExamScheduleDetailResponse>(`${API_BASE_URL}/exam-schedules/${id}`, {
    headers: authHeader(token),
  });
  return res.data.data.schedule;
};

export const createExamSchedule = async (
  data: ExamScheduleFormData,
  token: string
): Promise<ExamSchedule> => {
  const res = await axios.post<ExamScheduleDetailResponse>(`${API_BASE_URL}/exam-schedules`, data, {
    headers: authHeader(token),
  });
  return res.data.data.schedule;
};

export const updateExamSchedule = async (
  id: string,
  data: Partial<Omit<ExamScheduleFormData, 'exam_id'>>,
  token: string
): Promise<ExamSchedule> => {
  const res = await axios.put<ExamScheduleDetailResponse>(`${API_BASE_URL}/exam-schedules/${id}`, data, {
    headers: authHeader(token),
  });
  return res.data.data.schedule;
};

export const deleteExamSchedule = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/exam-schedules/${id}`, { headers: authHeader(token) });
};

// ── ExamSupervisor ────────────────────────────────────────────────────────────

export const getExamSupervisors = async (
  exam_schedule_id: string,
  token: string
): Promise<ExamSupervisor[]> => {
  const res = await axios.get<ExamSupervisorListResponse>(`${API_BASE_URL}/exam-supervisors`, {
    params: { exam_schedule_id },
    headers: authHeader(token),
  });
  return res.data.data.supervisors;
};

export const createExamSupervisor = async (
  data: ExamSupervisorFormData,
  token: string
): Promise<ExamSupervisor> => {
  const res = await axios.post<{ success: boolean; data: { supervisor: ExamSupervisor } }>(
    `${API_BASE_URL}/exam-supervisors`,
    data,
    { headers: authHeader(token) }
  );
  return res.data.data.supervisor;
};

export const deleteExamSupervisor = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/exam-supervisors/${id}`, { headers: authHeader(token) });
};
