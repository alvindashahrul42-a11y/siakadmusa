export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectFormData {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface SubjectListResponse {
  success: boolean;
  message: string;
  data: Subject[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface SubjectDetailResponse {
  success: boolean;
  message: string;
  data: { subject: Subject };
}
