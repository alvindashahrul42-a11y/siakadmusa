export interface Major {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MajorFormData {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface MajorListResponse {
  success: boolean;
  message: string;
  data: Major[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface MajorDetailResponse {
  success: boolean;
  message: string;
  data: { major: Major };
}
