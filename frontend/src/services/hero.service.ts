import axios, { type AxiosInstance } from 'axios';
import type {
  HeroSlideResponse,
  HeroSlideDetailResponse,
  CreateHeroSlideRequest,
  UpdateHeroSlideRequest,
} from '../types/hero';

class HeroService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor untuk menambahkan token jika ada
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all hero slides
   * @param isActive - Filter by active status (optional)
   */
  async getAll(isActive?: boolean): Promise<HeroSlideResponse> {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const response = await this.api.get<HeroSlideResponse>('/hero-slides', { params });
    return response.data;
  }

  /**
   * Get hero slide by ID
   * @param id - Hero slide UUID
   */
  async getById(id: string): Promise<HeroSlideDetailResponse> {
    const response = await this.api.get<HeroSlideDetailResponse>(`/hero-slides/${id}`);
    return response.data;
  }

  /**
   * Create new hero slide (Admin only)
   * @param data - Hero slide data
   */
  async create(data: CreateHeroSlideRequest): Promise<HeroSlideDetailResponse> {
    const response = await this.api.post<HeroSlideDetailResponse>('/hero-slides', data);
    return response.data;
  }

  /**
   * Update hero slide (Admin only)
   * @param id - Hero slide UUID
   * @param data - Updated hero slide data
   */
  async update(id: string, data: UpdateHeroSlideRequest): Promise<HeroSlideDetailResponse> {
    const response = await this.api.put<HeroSlideDetailResponse>(`/hero-slides/${id}`, data);
    return response.data;
  }

  /**
   * Delete hero slide (Admin only)
   * @param id - Hero slide UUID
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.delete<{ success: boolean; message: string }>(`/hero-slides/${id}`);
    return response.data;
  }
}

export default new HeroService();
