import axios from 'axios';
import type { User, UserFormData, UserListResponse, UserDetailResponse } from '../types/user';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getUsers = async (
  params?: { page?: number; limit?: number; role?: string; is_active?: boolean; search?: string },
  token?: string
): Promise<UserListResponse> => {
  const response = await axios.get<UserListResponse>(`${API_BASE_URL}/users`, {
    params,
    headers: token ? authHeader(token) : {},
  });
  return response.data;
};

export const getUserById = async (id: string, token: string): Promise<User> => {
  const response = await axios.get<UserDetailResponse>(`${API_BASE_URL}/users/${id}`, {
    headers: authHeader(token),
  });
  return response.data.data.user;
};

export const updateUser = async (id: string, data: UserFormData, token: string): Promise<User> => {
  const response = await axios.put<UserDetailResponse>(`${API_BASE_URL}/users/${id}`, data, {
    headers: authHeader(token),
  });
  return response.data.data.user;
};

export const toggleUserActive = async (id: string, token: string): Promise<User> => {
  const response = await axios.patch<UserDetailResponse>(
    `${API_BASE_URL}/users/${id}/toggle-active`,
    {},
    { headers: authHeader(token) }
  );
  return response.data.data.user;
};

export const deleteUser = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/users/${id}`, { headers: authHeader(token) });
};
