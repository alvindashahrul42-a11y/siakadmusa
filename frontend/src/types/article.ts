export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  thumbnail: string | null;
  category: string | null;
  author_id: string | null;
  author_name: string | null;
  published_at: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArticleFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  is_published: boolean;
  thumbnailFile?: File | null;
}

export interface ArticleResponse {
  success: boolean;
  message: string;
  data: Article[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ArticleDetailResponse {
  success: boolean;
  message: string;
  data: {
    article: Article;
  };
}
