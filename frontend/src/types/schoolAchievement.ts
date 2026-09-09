export interface SchoolAchievement {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  student_name: string | null;
  achievement_date: string | null; // YYYY-MM-DD
  image: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolAchievementResponse {
  success: boolean;
  message: string;
  data: SchoolAchievement[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface SchoolAchievementDetailResponse {
  success: boolean;
  message: string;
  data: {
    achievement: SchoolAchievement;
  };
}
