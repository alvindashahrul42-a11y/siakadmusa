import axios, { type AxiosInstance } from 'axios';
import type {
  PpdbRegisterResponse,
  PpdbStepResponse,
  PpdbMyRegistrationResponse,
  PpdbListResponse,
  PpdbDetailResponse,
  Step1Data,
  Step2And3Data,
  Step4Data,
  Step5Data,
  Step6Data,
  Step7Achievement,
  Step8ParentData,
} from '../types/ppdb';

class PpdbService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    });

    // Attach token jika ada
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('ppdb_token') || localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ── Step 1: Register akun ──────────────────────────────
  async register(data: Step1Data): Promise<PpdbRegisterResponse> {
    const res = await this.api.post<PpdbRegisterResponse>('/ppdb/register', data);
    if (res.data.success && res.data.data?.token) {
      // Simpan ke 'token' juga agar authService & ProtectedRoute mengenali sesi kandidat
      localStorage.setItem('ppdb_token', res.data.data.token);
      localStorage.setItem('token', res.data.data.token);
    }
    return res.data;
  }

  // ── Step 2 & 3 ────────────────────────────────────────
  async saveStep2And3(data: Step2And3Data): Promise<PpdbStepResponse> {
    const res = await this.api.post<PpdbStepResponse>('/ppdb/step/2-3', data);
    return res.data;
  }

  // ── Step 4: Data diri (multipart) ─────────────────────
  async saveStep4(data: Step4Data): Promise<PpdbStepResponse> {
    const form = new FormData();
    const fields: (keyof Step4Data)[] = [
      'nik', 'nisn', 'full_name', 'nickname', 'nationality',
      'birth_place', 'birth_date', 'gender', 'religion', 'family_status',
      'child_order', 'total_siblings', 'total_biological_siblings',
      'total_step_siblings', 'total_adopted_siblings',
      'school_origin', 'study_duration', 'diploma_number', 'diploma_date', 'npsn',
      'kip_number', 'living_status', 'daily_language', 'siblings_in_school',
      'transportation', 'distance_to_school', 'travel_time',
      'phone', 'contact_email', 'province', 'city', 'district',
      'village', 'rt', 'rw', 'full_address',
    ];
    fields.forEach((key) => {
      const val = data[key];
      if (val !== undefined && val !== null) {
        form.append(key, String(val));
      }
    });
    form.append('has_kip', String(data.has_kip));
    if (data.photoFile) form.append('photo', data.photoFile);

    const res = await this.api.post<PpdbStepResponse>('/ppdb/step/4', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // ── Step 5: Kesehatan ──────────────────────────────────
  async saveStep5(data: Step5Data): Promise<PpdbStepResponse> {
    const res = await this.api.post<PpdbStepResponse>('/ppdb/step/5', data);
    return res.data;
  }

  // ── Step 6: Dokumen (multipart) ────────────────────────
  async saveStep6(data: Step6Data): Promise<PpdbStepResponse> {
    const form = new FormData();
    if (data.kk_document) form.append('kk_document', data.kk_document);
    if (data.diploma_document) form.append('diploma_document', data.diploma_document);

    const res = await this.api.post<PpdbStepResponse>('/ppdb/step/6', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // ── Step 7: Tambah prestasi ────────────────────────────
  async addAchievement(data: Step7Achievement): Promise<{ success: boolean; message: string; data: { achievement: any } }> {
    const form = new FormData();
    form.append('achievement_name', data.achievement_name);
    if (data.documentFile) form.append('document', data.documentFile);

    const res = await this.api.post('/ppdb/step/7/achievements', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // ── Step 7: Hapus prestasi ─────────────────────────────
  async deleteAchievement(achievementId: string): Promise<{ success: boolean; message: string }> {
    const res = await this.api.delete(`/ppdb/step/7/achievements/${achievementId}`);
    return res.data;
  }

  // ── Step 8: Data orang tua ─────────────────────────────
  async saveParent(parentType: 'ayah' | 'ibu', data: Step8ParentData): Promise<PpdbStepResponse> {
    const res = await this.api.post<PpdbStepResponse>(`/ppdb/step/8/${parentType}`, data);
    return res.data;
  }

  // ── Submit pendaftaran ─────────────────────────────────
  async submit(): Promise<{ success: boolean; message: string; data: { registration_id: string; registration_status: string } }> {
    const res = await this.api.post('/ppdb/submit');
    return res.data;
  }

  // ── Lihat pendaftaran sendiri ──────────────────────────
  async getMyRegistration(): Promise<PpdbMyRegistrationResponse> {
    const res = await this.api.get<PpdbMyRegistrationResponse>('/ppdb/my-registration');
    return res.data;
  }

  // ── ADMIN: list semua ──────────────────────────────────
  async adminGetAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    major?: string;
    search?: string;
  }): Promise<PpdbListResponse> {
    const res = await this.api.get<PpdbListResponse>('/ppdb/admin/registrations', { params });
    return res.data;
  }

  // ── ADMIN: detail ──────────────────────────────────────
  async adminGetDetail(id: string): Promise<PpdbDetailResponse> {
    const res = await this.api.get<PpdbDetailResponse>(`/ppdb/admin/registrations/${id}`);
    return res.data;
  }

  // ── ADMIN: update status ───────────────────────────────
  async adminUpdateStatus(id: string, status: string, notes?: string): Promise<{ success: boolean; message: string }> {
    const res = await this.api.patch(`/ppdb/admin/registrations/${id}/status`, { status, notes });
    return res.data;
  }

  // ── Clear token PPDB (setelah submit) ─────────────────
  clearToken(): void {
    localStorage.removeItem('ppdb_token');
    // Jangan hapus 'token' — biarkan sesi tetap aktif untuk lihat status
  }
}

export default new PpdbService();
