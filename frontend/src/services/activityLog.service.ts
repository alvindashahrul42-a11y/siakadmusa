import axios from 'axios';
import type { ActivityLog, ActivityLogListResponse } from '../types/activityLog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeader   = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getActivityLogs = async (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    user_id?: string;
    action?: string;
    module?: string;
    method?: string;
    device_type?: string;
    date_from?: string;
    date_to?: string;
  },
  token?: string
): Promise<ActivityLogListResponse> => {
  const res = await axios.get<ActivityLogListResponse>(`${API_BASE_URL}/activity-logs`, {
    params,
    headers: token ? authHeader(token) : {},
  });
  return res.data;
};

export const getActivityLogById = async (id: string, token: string): Promise<ActivityLog> => {
  const res = await axios.get<{ success: boolean; data: { log: ActivityLog } }>(
    `${API_BASE_URL}/activity-logs/${id}`,
    { headers: authHeader(token) }
  );
  return res.data.data.log;
};

export const deleteActivityLog = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/activity-logs/${id}`, {
    headers: authHeader(token),
  });
};

export const purgeActivityLogs = async (days: number, token: string): Promise<{ deleted: number; days: number }> => {
  const res = await axios.delete<{ success: boolean; data: { deleted: number; days: number } }>(
    `${API_BASE_URL}/activity-logs/purge`,
    { params: { days }, headers: authHeader(token) }
  );
  return res.data.data;
};
