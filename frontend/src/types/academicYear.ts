export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicYearFormData {
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface AcademicYearListResponse {
  success: boolean;
  message: string;
  data: AcademicYear[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AcademicYearDetailResponse {
  success: boolean;
  message: string;
  data: { academicYear: AcademicYear };
}
