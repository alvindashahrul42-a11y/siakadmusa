// ── QuestionSet ───────────────────────────────────────────────────────────────

export interface QuestionSet {
  id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  duration_minutes: number;
  passing_score: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_result: boolean;
  status: 'draft' | 'ready';
  // joined
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  question_count: number;
  total_points?: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionSetFormData {
  subject_id: string;
  title: string;
  description?: string;
  instructions?: string;
  duration_minutes: number | string;
  passing_score?: number | string;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_result?: boolean;
  status?: 'draft' | 'ready';
}

export interface QuestionSetListResponse {
  success: boolean;
  message: string;
  data: QuestionSet[];
  metadata: { page: number; limit: number; total: number; total_pages: number };
}

export interface QuestionSetDetailResponse {
  success: boolean;
  message: string;
  data: { questionSet: QuestionSet };
}

// ── Question & Options ────────────────────────────────────────────────────────

export type QuestionType = 'multiple_choice' | 'multiple_choice_complex' | 'essay';

export interface QuestionOption {
  id: string;
  question_id: string;
  label: string;           // A-E
  option_text: string;
  image: string | null;
  is_correct?: boolean;    // hidden for students
  sort_order: number;
}

export interface Question {
  id: string;
  question_set_id: string;
  type: QuestionType;
  question_text: string;
  image: string | null;
  points: number;
  explanation: string | null;
  sort_order: number;
  options: QuestionOption[];
  created_at: string;
  updated_at: string;
}

export interface QuestionFormData {
  question_set_id: string;
  type: QuestionType;
  question_text: string;
  image?: string;
  points: number | string;
  explanation?: string;
  sort_order?: number;
  options?: QuestionOptionFormData[];
}

export interface QuestionOptionFormData {
  label: string;
  option_text: string;
  image?: string;
  is_correct: boolean;
  sort_order?: number;
}

export interface QuestionListResponse {
  success: boolean;
  message: string;
  data: { questions: Question[]; question_set: QuestionSet };
}

export interface QuestionDetailResponse {
  success: boolean;
  message: string;
  data: { question: Question };
}

// ── ExamAttempt ───────────────────────────────────────────────────────────────

export type AttemptStatus = 'in_progress' | 'submitted' | 'timed_out' | 'graded';

export interface ExamAttempt {
  id: string;
  exam_schedule_id: string;
  student_id: string;
  status: AttemptStatus;
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  question_order: string | null;
  objective_score: number | null;
  essay_score: number | null;
  total_score: number | null;
  tab_switch_count: number;
  ip_address: string | null;
  // joined
  student_name: string;
  student_number: string;
  gender?: string;
  exam_date?: string;
  start_time?: string;
  end_time?: string;
  question_set_id?: string;
  duration_minutes?: number;
  show_result?: boolean;
  passing_score?: number | null;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  created_at: string;
  updated_at: string;
}

export interface StartAttemptResponse {
  success: boolean;
  message: string;
  data: {
    attempt: ExamAttempt;
    questions: Question[];
    answers: ExamAnswer[];
  };
}

export interface AttemptListResponse {
  success: boolean;
  message: string;
  data: { attempts: ExamAttempt[]; schedule: import('./exam').ExamSchedule };
}

// ── ExamAnswer ────────────────────────────────────────────────────────────────

export interface ExamAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  selected_option_ids: string | null;   // JSON string of string[]
  answer_text: string | null;
  is_correct: boolean | null;
  score: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  // joined
  question_type?: QuestionType;
  question_text?: string;
  max_points?: number;
  sort_order?: number;
  selected_label?: string;
  selected_option_text?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveAnswerPayload {
  attempt_id: string;
  question_id: string;
  selected_option_id?: string | null;
  selected_option_ids?: string[] | null;   // for multiple_choice_complex
  answer_text?: string | null;
}

export interface GradeEssayPayload {
  score: number;
  feedback?: string;
}

export interface AnswerListResponse {
  success: boolean;
  message: string;
  data: { answers: ExamAnswer[]; attempt: ExamAttempt };
}

// ── Student exam schedule view ────────────────────────────────────────────────

export interface StudentExamSchedule {
  id: string;
  exam_id: string;
  class_subject_id: string;
  question_set_id: string | null;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  subject_name: string;
  subject_code: string;
  class_name: string;
  exam_name: string;
  exam_type_code: string;
  question_set_title: string | null;
  duration_minutes: number | null;
  attempt_id: string | null;
  attempt_status: AttemptStatus | null;
  total_score: number | null;
  submitted_at: string | null;
}
