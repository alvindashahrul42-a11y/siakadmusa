export interface Student {
  id: string;
  user_id: string;
  student_number: string;
  full_name: string;
  gender: string | null;
  birth_place: string | null;
  birth_date: string | null;
  phone: string | null;
  address: string | null;
  class_name: string | null;
  major: string | null;
  enrollment_year: number | null;
  email: string;
  username: string | null;
  is_active: boolean;
  role_name: string;
  created_at: string;
  updated_at: string;
}

export interface StudentFormData {
  student_number?: string;
  full_name?: string;
  gender?: string;
  birth_place?: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  class_name?: string;
  major?: string;
  enrollment_year?: number | string;
}

export interface StudentListResponse {
  success: boolean;
  message: string;
  data: Student[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface StudentDetailResponse {
  success: boolean;
  message: string;
  data: { student: Student };
}
