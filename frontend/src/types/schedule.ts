export const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

export interface Schedule {
  id: string;
  class_subject_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  // joined
  subject_code: string;
  subject_name: string;
  teacher_name: string | null;
  class_name: string;
  class_id: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleFormData {
  class_subject_id: string;
  day_of_week: number | string;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface ScheduleListResponse {
  success: boolean;
  message: string;
  data: { schedules: Schedule[] };
}

export interface ScheduleDetailResponse {
  success: boolean;
  message: string;
  data: { schedule: Schedule };
}
