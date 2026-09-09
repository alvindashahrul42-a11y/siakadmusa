export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  role: 'student' | 'teacher' | 'admin' | 'candidate';
  full_name?: string;
  student_number?: string;
  teacher_number?: string;
  gender?: string;
  birth_place?: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  class_name?: string;
  major?: string;
  enrollment_year?: number;
  subject?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  role_description: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  profile?: StudentProfile | TeacherProfile;
}

export interface StudentProfile {
  id: string;
  student_number: string;
  full_name: string;
  gender: string;
  birth_place: string;
  birth_date: string;
  phone: string;
  address: string;
  class_name: string;
  major: string;
  enrollment_year: number;
}

export interface TeacherProfile {
  id: string;
  teacher_number: string;
  full_name: string;
  gender: string;
  birth_place: string;
  birth_date: string;
  phone: string;
  address: string;
  subject: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  status: number;
  timestamp: string;
  data: {
    token: string;
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  status: number;
  timestamp: string;
  data: {
    user: User;
  };
}
