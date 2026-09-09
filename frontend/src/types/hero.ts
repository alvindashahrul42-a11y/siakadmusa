export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeroSlideResponse {
  success: boolean;
  message: string;
  status: number;
  timestamp: string;
  data: HeroSlide[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface HeroSlideDetailResponse {
  success: boolean;
  message: string;
  status: number;
  timestamp: string;
  data: {
    hero_slide: HeroSlide;
  };
}

export interface CreateHeroSlideRequest {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateHeroSlideRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ApiError {
  success: false;
  message: string;
  status: number;
  timestamp: string;
  errors?: string[];
}
