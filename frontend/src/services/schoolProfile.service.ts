import axios from 'axios';
import type { SchoolProfile, SchoolProfileFormData, SchoolProfileResponse } from '../types/schoolProfile';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get school profile (Public)
 */
export const getSchoolProfile = async (): Promise<SchoolProfile> => {
  try {
    const response = await axios.get<SchoolProfileResponse>(
      `${API_BASE_URL}/school-profile`,
      { timeout: 8000 }
    );
    return response.data.data.school_profile;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
        throw new Error('Server tidak dapat dihubungi. Pastikan backend sedang berjalan.');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch school profile');
    }
    throw error;
  }
};

/**
 * Create school profile (Admin only)
 */
export const createSchoolProfile = async (
  data: SchoolProfileFormData,
  token: string
): Promise<SchoolProfile> => {
  try {
    const formData = new FormData();
    
    formData.append('school_name', data.school_name);
    if (data.tagline) formData.append('tagline', data.tagline);
    if (data.description) formData.append('description', data.description);
    if (data.logo) formData.append('logo', data.logo);
    if (data.address) formData.append('address', data.address);
    if (data.phone) formData.append('phone', data.phone);
    if (data.email) formData.append('email', data.email);
    if (data.website) formData.append('website', data.website);
    if (data.vision) formData.append('vision', data.vision);
    if (data.mission) formData.append('mission', data.mission);
    if (data.instagram) formData.append('instagram', data.instagram);
    if (data.facebook) formData.append('facebook', data.facebook);
    if (data.youtube) formData.append('youtube', data.youtube);

    const response = await axios.post<SchoolProfileResponse>(
      `${API_BASE_URL}/school-profile`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data.data.school_profile;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to create school profile');
    }
    throw error;
  }
};

/**
 * Update school profile (Admin only)
 */
export const updateSchoolProfile = async (
  id: string,
  data: SchoolProfileFormData,
  token: string
): Promise<SchoolProfile> => {
  try {
    const formData = new FormData();
    
    if (data.school_name) formData.append('school_name', data.school_name);
    if (data.tagline !== undefined) formData.append('tagline', data.tagline);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.logo) formData.append('logo', data.logo);
    if (data.address !== undefined) formData.append('address', data.address);
    if (data.phone !== undefined) formData.append('phone', data.phone);
    if (data.email !== undefined) formData.append('email', data.email);
    if (data.website !== undefined) formData.append('website', data.website);
    if (data.vision !== undefined) formData.append('vision', data.vision);
    if (data.mission !== undefined) formData.append('mission', data.mission);
    if (data.instagram !== undefined) formData.append('instagram', data.instagram);
    if (data.facebook !== undefined) formData.append('facebook', data.facebook);
    if (data.youtube !== undefined) formData.append('youtube', data.youtube);

    const response = await axios.put<SchoolProfileResponse>(
      `${API_BASE_URL}/school-profile/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data.data.school_profile;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to update school profile');
    }
    throw error;
  }
};

/**
 * Delete school profile (Admin only)
 */
export const deleteSchoolProfile = async (
  id: string,
  token: string
): Promise<void> => {
  try {
    await axios.delete(
      `${API_BASE_URL}/school-profile/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to delete school profile');
    }
    throw error;
  }
};
