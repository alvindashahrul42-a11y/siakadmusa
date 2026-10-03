export type AttendanceStatus = 'present' | 'late' | 'sick' | 'permission' | 'absent';

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present:    'Hadir',
  late:       'Terlambat',
  sick:       'Sakit',
  permission: 'Izin',
  absent:     'Alpha',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present:    'bg-emerald-100 text-emerald-700',
  late:       'bg-amber-100 text-amber-700',
  sick:       'bg-blue-100 text-blue-700',
  permission: 'bg-violet-100 text-violet-700',
  absent:     'bg-red-100 text-red-600',
};

export interface Attendance {
  id: string;
  class_subject_id: string;
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string | null;
  // joined
  student_name: string;
  student_number: string;
  gender: string | null;
  subject_name?: string;
  subject_code?: string;
  class_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  student_id: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface BulkAttendancePayload {
  class_subject_id: string;
  attendance_date: string;
  records: AttendanceRecord[];
}

export interface AttendanceSummary {
  student_id: string;
  student_name: string;
  student_number: string;
  total_meetings: number;
  present_count: number;
  late_count: number;
  sick_count: number;
  permission_count: number;
  absent_count: number;
}

export interface AttendanceListResponse {
  success: boolean;
  message: string;
  data: Attendance[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
