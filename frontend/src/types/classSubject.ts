export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  // joined
  subject_code: string;
  subject_name: string;
  teacher_name: string | null;
  teacher_number: string | null;
  class_name: string;
  grade_count: number;
  schedule_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClassSubjectFormData {
  subject_id: string;
  teacher_id?: string;
}

export interface ClassSubjectUpdateData {
  teacher_id?: string | null;
}

export interface ClassSubjectListResponse {
  success: boolean;
  message: string;
  data: ClassSubject[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ClassSubjectDetailResponse {
  success: boolean;
  message: string;
  data: { classSubject: ClassSubject };
}
