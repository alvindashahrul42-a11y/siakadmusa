import axios from 'axios';
import type {
  SchoolAchievement,
  SchoolAchievementResponse,
  SchoolAchievementDetailResponse,
} from '../types/schoolAchievement';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get all achievements (Public)
 */
export const getAchievements = async (params?: {
  page?: number;
  limit?: number;
  is_published?: boolean;
  category?: string;
  level?: string;
}): Promise<SchoolAchievementResponse> => {
  const response = await axios.get<SchoolAchievementResponse>(
    `${API_BASE_URL}/school-achievements`,
    { params }
  );
  return response.data;
};

/**
 * Get achievement by ID (Public)
 */
export const getAchievementById = async (id: string): Promise<SchoolAchievement> => {
  const response = await axios.get<SchoolAchievementDetailResponse>(
    `${API_BASE_URL}/school-achievements/${id}`
  );
  return response.data.data.achievement;
};
