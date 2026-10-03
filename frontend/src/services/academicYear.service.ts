import axios from 'axios';
import type {
  AcademicYear,
  AcademicYearFormData,
  AcademicYearListResponse,
  AcademicYearDetailResponse,
} from '../types/academicYear';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getAcademicYears = async (
  params?: { page?: number; limit?: number; search?: string; is_active?: string },
  token?: string
): Promise<AcademicYearListResponse> => {
  const response = await axios.get<AcademicYearListResponse>(`${API_BASE_URL}/academic-years`, {
    params,
    headers: token ? authHeader(token) : {},
  });
  return response.data;
};

export const getAcademicYearsAll = async (token: string): Promise<AcademicYear[]> => {
  const response = await axios.get<{ success: boolean; data: { academicYears: AcademicYear[] } }>(
    `${API_BASE_URL}/academic-years/all`,
    { headers: authHeader(token) }
  );
  return response.data.data.academicYears;
};

export const getAcademicYearById = async (id: string, token: string): Promise<AcademicYear> => {
  const response = await axios.get<AcademicYearDetailResponse>(
    `${API_BASE_URL}/academic-years/${id}`,
    { headers: authHeader(token) }
  );
  return response.data.data.academicYear;
};

export const createAcademicYear = async (
  data: AcademicYearFormData,
  token: string
): Promise<AcademicYear> => {
  const response = await axios.post<{ success: boolean; data: { academicYear: AcademicYear } }>(
    `${API_BASE_URL}/academic-years`,
    data,
    { headers: authHeader(token) }
  );
  return response.data.data.academicYear;
};

export const updateAcademicYear = async (
  id: string,
  data: Partial<AcademicYearFormData>,
  token: string
): Promise<AcademicYear> => {
  const response = await axios.put<AcademicYearDetailResponse>(
    `${API_BASE_URL}/academic-years/${id}`,
    data,
    { headers: authHeader(token) }
  );
  return response.data.data.academicYear;
};

export const setActiveAcademicYear = async (id: string, token: string): Promise<AcademicYear> => {
  const response = await axios.patch<AcademicYearDetailResponse>(
    `${API_BASE_URL}/academic-years/${id}/set-active`,
    {},
    { headers: authHeader(token) }
  );
  return response.data.data.academicYear;
};

export const deleteAcademicYear = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/academic-years/${id}`, { headers: authHeader(token) });
};
