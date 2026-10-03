export interface Grade {
  id: string;
  class_subject_id: string;
  student_id: string;
  assignment_score: number | null;
  midterm_score: number | null;
  final_exam_score: number | null;
  final_score: number | null;
  notes: string | null;
  // joined
  student_name: string;
  student_number: string;
  gender?: string | null;
  subject_name?: string;
  subject_code?: string;
  class_name?: string;
  teacher_name?: string;
  created_at: string;
  updated_at: string;
}

export interface GradeFormData {
  class_subject_id: string;
  student_id: string;
  assignment_score?: number | string;
  midterm_score?: number | string;
  final_exam_score?: number | string;
  final_score?: number | string;
  notes?: string;
}

export interface GradeListResponse {
  success: boolean;
  message: string;
  data: Grade[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface GradeDetailResponse {
  success: boolean;
  message: string;
  data: { grade: Grade };
}
