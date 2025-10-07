// Common types used across SILAS modules

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  alt_text?: string;
  width?: number;
  height?: number;
}

export interface Address {
  street?: string;
  city?: string;
  postcode?: string;
  country?: string;
  formatted?: string;
}

export interface SocialCounts {
  likes: number;
  comments: number;
  shares: number;
  reactions: Record<string, number>;
}

export interface UserProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'guest' | 'user' | 'doer' | 'business' | 'admin';
  is_verified: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}
