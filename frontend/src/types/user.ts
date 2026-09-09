export interface User {
  id: string;
  username: string | null;
  email: string;
  role_name: string;
  role_description: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: User[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface UserDetailResponse {
  success: boolean;
  message: string;
  data: {
    user: User & { profile?: Record<string, unknown> | null };
  };
}
