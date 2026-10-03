// =========================================================
// PPDB Types
// =========================================================

export interface PpdbRegistration {
  id: string;
  user_id: string;
  email: string;
  // Step 2-3
  registered_by: 'diri_sendiri' | 'ayah' | 'ibu' | 'saudara' | 'guru';
  major: 'TKJ' | 'teknik_otomotif';
  education_system: 'reguler' | 'pondok' | 'panti';
  // Step 4 - Identitas
  nik: string;
  nisn: string;
  full_name: string;
  nickname: string | null;
  nationality: string;
  birth_place: string;
  birth_date: string;
  gender: 'laki-laki' | 'perempuan';
  religion: string;
  family_status: string;
  // Step 4 - Keluarga
  child_order: number;
  total_siblings: number;
  total_biological_siblings: number;
  total_step_siblings: number | null;
  total_adopted_siblings: number | null;
  // Step 4 - Asal Sekolah
  school_origin: string;
  study_duration: number;
  diploma_number: string;
  diploma_date: string;
  npsn: string;
  // Step 4 - KIP
  has_kip: boolean;
  kip_number: string | null;
  // Step 4 - Info Lainnya
  living_status: string;
  daily_language: string;
  siblings_in_school: number;
  transportation: string;
  distance_to_school: number;
  travel_time: number;
  photo: string;
  // Step 4 - Kontak & Alamat
  phone: string;
  contact_email: string | null;
  province: string;
  city: string;
  district: string;
  village: string;
  rt: string;
  rw: string;
  full_address: string;
  // Status
  registration_status: 'draft' | 'submitted' | 'verified' | 'accepted' | 'rejected';
  current_step: number;
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  health?: PpdbHealth | null;
  documents?: PpdbDocuments | null;
  achievements?: PpdbAchievement[];
  parents?: PpdbParent[];
}

export interface PpdbHealth {
  id: string;
  registration_id: string;
  health_history: string | null;
  disability: string | null;
  height: number | null;
  weight: number | null;
}

export interface PpdbDocuments {
  id: string;
  registration_id: string;
  kk_document: string;
  diploma_document: string;
}

export interface PpdbAchievement {
  id: string;
  registration_id: string;
  achievement_name: string;
  document: string | null;
  created_at: string;
}

export interface PpdbParent {
  id: string;
  registration_id: string;
  parent_type: 'ayah' | 'ibu';
  full_name: string;
  nik: string;
  education: string;
  occupation: string;
  marital_status: 'menikah' | 'cerai_hidup' | 'cerai_mati' | 'lainnya';
  phone: string;
  birth_place: string;
  birth_date: string;
  nationality: string;
  religion: string;
  monthly_income: number | null;
}

// ── Form State Types ──────────────────────────────────────

export interface Step1Data {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface Step2And3Data {
  registered_by: string;
  major: string;
  education_system: string;
}

export interface Step4Data {
  nik: string;
  nisn: string;
  full_name: string;
  nickname: string;
  nationality: string;
  birth_place: string;
  birth_date: string;
  gender: string;
  religion: string;
  family_status: string;
  child_order: string;
  total_siblings: string;
  total_biological_siblings: string;
  total_step_siblings: string;
  total_adopted_siblings: string;
  school_origin: string;
  study_duration: string;
  diploma_number: string;
  diploma_date: string;
  npsn: string;
  has_kip: boolean;
  kip_number: string;
  living_status: string;
  daily_language: string;
  siblings_in_school: string;
  transportation: string;
  distance_to_school: string;
  travel_time: string;
  photoFile: File | null;
  phone: string;
  contact_email: string;
  province: string;
  city: string;
  district: string;
  village: string;
  rt: string;
  rw: string;
  full_address: string;
}

export interface Step5Data {
  health_history: string;
  disability: string;
  height: string;
  weight: string;
}

export interface Step6Data {
  kk_document: File | null;
  diploma_document: File | null;
}

export interface Step7Achievement {
  achievement_name: string;
  documentFile: File | null;
}

export interface Step8ParentData {
  full_name: string;
  nik: string;
  education: string;
  occupation: string;
  marital_status: string;
  phone: string;
  birth_place: string;
  birth_date: string;
  nationality: string;
  religion: string;
  monthly_income: string;
}

// ── API Response Types ────────────────────────────────────

export interface PpdbRegisterResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user_id: string;
    username: string;
    step_completed: number;
    next_step: number;
  };
}

export interface PpdbStepResponse {
  success: boolean;
  message: string;
  data: {
    registration_id: string;
    step_completed: number;
    next_step?: number;
  };
}

export interface PpdbMyRegistrationResponse {
  success: boolean;
  message: string;
  data: {
    registration: PpdbRegistration | null;
  };
}

export interface PpdbListResponse {
  success: boolean;
  message: string;
  data: PpdbRegistration[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PpdbDetailResponse {
  success: boolean;
  message: string;
  data: {
    registration: PpdbRegistration;
  };
}
