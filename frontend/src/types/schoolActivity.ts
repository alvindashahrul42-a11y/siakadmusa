export interface SchoolActivity {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  activity_date: string | null; // YYYY-MM-DD
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolActivityFormData {
  title: string;
  description?: string;
  imageFile?: File | null;
  activity_date?: string;
  sort_order: number;
  is_published: boolean;
}

export interface SchoolActivityResponse {
  success: boolean;
  message: string;
  data: SchoolActivity[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface SchoolActivityDetailResponse {
  success: boolean;
  message: string;
  data: {
    activity: SchoolActivity;
  };
}
