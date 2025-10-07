import type { BaseEntity, Coordinates, Photo, Address, SocialCounts, UserProfile, Category } from '@/core/types/common';

export interface Pin extends BaseEntity {
  name: string;
  description: string;
  category_id: string;
  subcategory?: string;
  pin_type?: string;
  
  // Location
  coordinates: Coordinates;
  geom?: any; // PostGIS geometry
  address?: Address;
  
  // Status
  status: 'draft' | 'active' | 'archived' | 'flagged';
  social_visibility: 'public' | 'members' | 'private';
  is_verified: boolean;
  
  // Metadata
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  photos: Photo[];
  metadata: Record<string, any>;
  
  // Fund eligibility
  fund_eligible: boolean;
  fund_requested_amount?: number;
  fund_approved_amount?: number;
  
  // Relations
  category?: Category;
  created_by: string;
  creator?: UserProfile;
  
  // Social
  social_counts?: SocialCounts;
}

export interface PinFormData {
  name: string;
  description: string;
  category_id: string;
  subcategory?: string;
  pin_type?: string;
  coordinates: Coordinates;
  address?: Address;
  priority: Pin['priority'];
  tags: string[];
  photos: Photo[];
  social_visibility: Pin['social_visibility'];
  fund_eligible: boolean;
  fund_requested_amount?: number;
}

export interface PinFilters {
  category_id?: string;
  subcategory?: string;
  pin_type?: string;
  status?: Pin['status'];
  priority?: Pin['priority'];
  tags?: string[];
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  search?: string;
  created_by?: string;
  fund_eligible?: boolean;
}

export interface PinCluster {
  id: string;
  coordinates: Coordinates;
  pins: Pin[];
  count: number;
  dominant_category: string;
}

export interface CreatePinRequest {
  pin_data: PinFormData;
  photos?: File[];
}

export interface UpdatePinRequest {
  id: string;
  updates: Partial<PinFormData>;
  photos?: File[];
}

export interface PinSearchResult {
  pins: Pin[];
  total_count: number;
  clusters: PinCluster[];
}

export interface PinStats {
  total_pins: number;
  pins_by_category: Record<string, number>;
  pins_by_status: Record<string, number>;
  recent_pins: Pin[];
  trending_pins: Pin[];
}
