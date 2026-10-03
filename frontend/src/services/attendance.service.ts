import axios from 'axios';
import type {
  Attendance,
  AttendanceRecord,
  BulkAttendancePayload,
  AttendanceSummary,
  AttendanceListResponse,
} from '../types/attendance';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getAttendance = async (
  params: {
    class_subject_id: string;
    attendance_date?: string;
    student_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  },
  token: string
): Promise<AttendanceListResponse> => {
  const res = await axios.get<AttendanceListResponse>(`${API_BASE_URL}/attendance`, {
    params,
    headers: authHeader(token),
  });
  return res.data;
};

export const getAttendanceByDate = async (
  class_subject_id: string,
  attendance_date: string,
  token: string
): Promise<Attendance[]> => {
  const res = await axios.get<{ success: boolean; data: { attendance: Attendance[] } }>(
    `${API_BASE_URL}/attendance/by-date`,
    { params: { class_subject_id, attendance_date }, headers: authHeader(token) }
  );
  return res.data.data.attendance;
};

export const getAttendanceSummary = async (
  class_subject_id: string,
  token: string
): Promise<AttendanceSummary[]> => {
  const res = await axios.get<{ success: boolean; data: { summary: AttendanceSummary[] } }>(
    `${API_BASE_URL}/attendance/summary`,
    { params: { class_subject_id }, headers: authHeader(token) }
  );
  return res.data.data.summary;
};

export const upsertAttendance = async (
  data: {
    class_subject_id: string;
    student_id: string;
    attendance_date: string;
    status: string;
    notes?: string;
  },
  token: string
): Promise<Attendance> => {
  const res = await axios.post<{ success: boolean; data: { attendance: Attendance } }>(
    `${API_BASE_URL}/attendance`,
    data,
    { headers: authHeader(token) }
  );
  return res.data.data.attendance;
};

export const bulkUpsertAttendance = async (
  payload: BulkAttendancePayload,
  token: string
): Promise<{ saved: number; attendance: Attendance[] }> => {
  const res = await axios.post<{
    success: boolean;
    data: { saved: number; attendance: Attendance[] };
  }>(`${API_BASE_URL}/attendance/bulk`, payload, { headers: authHeader(token) });
  return res.data.data;
};

export const deleteAttendance = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/attendance/${id}`, { headers: authHeader(token) });
};
