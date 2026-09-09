export interface SchoolProgram {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolProgramFormData {
  name: string;
  description?: string;
  imageFile?: File | null;
  sort_order: number;
  is_active: boolean;
}

export interface SchoolProgramResponse {
  success: boolean;
  message: string;
  data: SchoolProgram[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface SchoolProgramDetailResponse {
  success: boolean;
  message: string;
  data: {
    program: SchoolProgram;
  };
}
