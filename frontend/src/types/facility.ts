export interface SchoolFacility {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolFacilityFormData {
  name: string;
  description?: string;
  imageFile?: File | null;
  sort_order: number;
  is_active: boolean;
}

export interface SchoolFacilityResponse {
  success: boolean;
  message: string;
  data: SchoolFacility[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface SchoolFacilityDetailResponse {
  success: boolean;
  message: string;
  data: {
    facility: SchoolFacility;
  };
}
