export interface Teacher {
  id: string;
  user_id: string;
  teacher_number: string;
  full_name: string;
  gender: string | null;
  birth_place: string | null;
  birth_date: string | null;
  phone: string | null;
  address: string | null;
  subject: string | null;
  email: string;
  username: string | null;
  is_active: boolean;
  role_name: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherCreateFormData {
  email: string;
  password: string;
  username?: string;
  teacher_number: string;
  full_name: string;
  gender?: string;
  birth_place?: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  subject?: string;
}

export interface TeacherUpdateFormData {
  teacher_number?: string;
  full_name?: string;
  gender?: string;
  birth_place?: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  subject?: string;
}

export interface TeacherListResponse {
  success: boolean;
  message: string;
  data: Teacher[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface TeacherDetailResponse {
  success: boolean;
  message: string;
  data: { teacher: Teacher };
}
