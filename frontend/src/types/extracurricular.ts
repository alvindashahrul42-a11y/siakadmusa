export interface Extracurricular {
  id: string;
  name: string;
  image: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtracurricularFormData {
  name: string;
  imageFile?: File | null;
  sort_order: number;
  is_active: boolean;
}

export interface ExtracurricularResponse {
  success: boolean;
  message: string;
  data: Extracurricular[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ExtracurricularDetailResponse {
  success: boolean;
  message: string;
  data: {
    extracurricular: Extracurricular;
  };
}
