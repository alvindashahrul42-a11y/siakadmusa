import axios from 'axios';
import type { Schedule, ScheduleFormData, ScheduleDetailResponse } from '../types/schedule';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getSchedulesByClass = async (
  classId: string,
  params?: { day_of_week?: number },
  token?: string
): Promise<Schedule[]> => {
  const res = await axios.get<{ success: boolean; data: { schedules: Schedule[] } }>(
    `${API_BASE_URL}/classes/${classId}/schedules`,
    { params, headers: token ? authHeader(token) : {} }
  );
  return res.data.data.schedules;
};

export const getSchedulesByClassSubject = async (
  classId: string,
  classSubjectId: string,
  token: string
): Promise<Schedule[]> => {
  const res = await axios.get<{ success: boolean; data: { schedules: Schedule[] } }>(
    `${API_BASE_URL}/classes/${classId}/subjects/${classSubjectId}/schedules`,
    { headers: authHeader(token) }
  );
  return res.data.data.schedules;
};

export const createSchedule = async (
  classId: string,
  classSubjectId: string,
  data: Omit<ScheduleFormData, 'class_subject_id'>,
  token: string
): Promise<Schedule> => {
  const res = await axios.post<ScheduleDetailResponse>(
    `${API_BASE_URL}/classes/${classId}/subjects/${classSubjectId}/schedules`,
    data,
    { headers: authHeader(token) }
  );
  return res.data.data.schedule;
};

export const updateSchedule = async (
  id: string,
  data: Partial<Omit<ScheduleFormData, 'class_subject_id'>>,
  token: string
): Promise<Schedule> => {
  const res = await axios.put<ScheduleDetailResponse>(
    `${API_BASE_URL}/schedules/${id}`,
    data,
    { headers: authHeader(token) }
  );
  return res.data.data.schedule;
};

export const deleteSchedule = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/schedules/${id}`, { headers: authHeader(token) });
};

/** GET /api/schedules/my — jadwal kelas siswa yang sedang login */
export const getMySchedules = async (
  params?: { day_of_week?: number },
  token?: string
): Promise<Schedule[]> => {
  const res = await axios.get<{ success: boolean; data: { schedules: Schedule[] } }>(
    `${API_BASE_URL}/schedules/my`,
    { params, headers: token ? authHeader(token) : {} }
  );
  return res.data.data.schedules;
};
