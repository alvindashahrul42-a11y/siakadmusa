import axios from 'axios';
import type {
  Article,
  ArticleFormData,
  ArticleResponse,
  ArticleDetailResponse,
} from '../types/article';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/** Get all articles (Public) */
export const getArticles = async (params?: {
  page?: number;
  limit?: number;
  is_published?: boolean;
  category?: string;
  search?: string;
}): Promise<ArticleResponse> => {
  const response = await axios.get<ArticleResponse>(`${API_BASE_URL}/articles`, { params });
  return response.data;
};

/** Get article by ID (Public) */
export const getArticleById = async (id: string): Promise<Article> => {
  const response = await axios.get<ArticleDetailResponse>(`${API_BASE_URL}/articles/${id}`);
  return response.data.data.article;
};

/** Get article by slug (Public) */
export const getArticleBySlug = async (slug: string): Promise<Article> => {
  const response = await axios.get<ArticleDetailResponse>(`${API_BASE_URL}/articles/slug/${slug}`);
  return response.data.data.article;
};

/** Create article (Admin only) */
export const createArticle = async (
  data: ArticleFormData,
  token: string
): Promise<Article> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('excerpt', data.excerpt);
  formData.append('content', data.content);
  formData.append('category', data.category);
  formData.append('is_published', data.is_published.toString());
  if (data.thumbnailFile) formData.append('thumbnail', data.thumbnailFile);

  const response = await axios.post<ArticleDetailResponse>(
    `${API_BASE_URL}/articles`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.article;
};

/** Update article (Admin only) */
export const updateArticle = async (
  id: string,
  data: ArticleFormData,
  token: string
): Promise<Article> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('excerpt', data.excerpt);
  formData.append('content', data.content);
  formData.append('category', data.category);
  formData.append('is_published', data.is_published.toString());
  if (data.thumbnailFile) formData.append('thumbnail', data.thumbnailFile);

  const response = await axios.put<ArticleDetailResponse>(
    `${API_BASE_URL}/articles/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.article;
};

/** Delete article (Admin only) */
export const deleteArticle = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/articles/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
