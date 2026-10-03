// ── ExamType ──────────────────────────────────────────────────────────────────

export interface ExamType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamTypeFormData {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface ExamTypeListResponse {
  success: boolean;
  message: string;
  data: ExamType[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ExamTypeDetailResponse {
  success: boolean;
  message: string;
  data: { examType: ExamType };
}

// ── Exam ──────────────────────────────────────────────────────────────────────

export type Semester = 'ganjil' | 'genap';

export interface Exam {
  id: string;
  academic_year_id: string;
  exam_type_id: string;
  name: string;
  semester: Semester;
  start_date: string;
  end_date: string;
  is_published: boolean;
  notes: string | null;
  // joined
  academic_year_name: string;
  exam_type_code: string;
  exam_type_name: string;
  schedule_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExamFormData {
  academic_year_id: string;
  exam_type_id: string;
  name: string;
  semester: Semester | '';
  start_date: string;
  end_date: string;
  is_published?: boolean;
  notes?: string;
}

export interface ExamListResponse {
  success: boolean;
  message: string;
  data: Exam[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ExamDetailResponse {
  success: boolean;
  message: string;
  data: { exam: Exam };
}

// ── ExamSchedule ──────────────────────────────────────────────────────────────

export interface ExamSchedule {
  id: string;
  exam_id: string;
  class_subject_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  notes: string | null;
  // joined
  subject_name: string;
  subject_code: string;
  class_name: string;
  grade_level: string;
  teacher_name: string | null;
  exam_name?: string;
  exam_type_code?: string;
  exam_type_name?: string;
  question_set_id?: string | null;
  question_set_title?: string | null;
  question_set_status?: string | null;
  duration_minutes?: number | null;
  supervisor_count: number;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExamScheduleFormData {
  exam_id: string;
  class_subject_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room?: string;
  notes?: string;
}

export interface ExamScheduleListResponse {
  success: boolean;
  message: string;
  data: ExamSchedule[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ExamScheduleDetailResponse {
  success: boolean;
  message: string;
  data: { schedule: ExamSchedule };
}

// ── ExamSupervisor ────────────────────────────────────────────────────────────

export interface ExamSupervisor {
  id: string;
  exam_schedule_id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_number: string;
  teacher_phone?: string | null;
  exam_date?: string;
  start_time?: string;
  end_time?: string;
  room?: string | null;
  created_at: string;
}

export interface ExamSupervisorFormData {
  exam_schedule_id: string;
  teacher_id: string;
}

export interface ExamSupervisorListResponse {
  success: boolean;
  message: string;
  data: { supervisors: ExamSupervisor[] };
}
