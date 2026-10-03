export interface Class {
  id: string;
  academic_year_id: string;
  major_id: string | null;
  homeroom_teacher_id: string | null;
  name: string;
  grade_level: number;
  capacity: number | null;
  is_active: boolean;
  // joined fields
  academic_year_name: string;
  major_code: string | null;
  major_name: string | null;
  homeroom_teacher_name: string | null;
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClassFormData {
  academic_year_id: string;
  major_id?: string;
  homeroom_teacher_id?: string;
  name: string;
  grade_level: number | string;
  capacity?: number | string;
  is_active?: boolean;
}

export interface ClassListResponse {
  success: boolean;
  message: string;
  data: Class[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ClassDetailResponse {
  success: boolean;
  message: string;
  data: { class: Class };
}

// ── ClassStudent types ────────────────────────────────────────────────────────

export interface ClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  student_number: string;
  student_name: string;
  gender: string | null;
  enrollment_year: number | null;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AvailableStudent {
  student_id: string;
  student_number: string;
  student_name: string;
  gender: string | null;
  enrollment_year: number | null;
  email: string;
}

export interface ClassStudentListResponse {
  success: boolean;
  message: string;
  data: ClassStudent[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
