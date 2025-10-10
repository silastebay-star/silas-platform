/**
 * Local Economy Module Types
 */

export interface LocalBusiness {
  id: string
  name: string
  description?: string
  category: string
  subcategory?: string
  address: string
  contact_email?: string
  contact_phone?: string
  website?: string
  social_media?: Record<string, string>
  opening_hours?: OpeningHours
  location: {
    x: number
    y: number
  }
  latitude?: number
  longitude?: number
  verified: boolean
  rating: number
  review_count: number
  price_range?: '$' | '$$' | '$$$' | '$$$$'
  features: string[]
  images: string[]
  owner_id?: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  created_at: string
  updated_at: string
  pin_id?: string
  metadata?: Record<string, any>
  // Computed fields
  distance?: number
  is_open?: boolean
  next_opening?: string
  average_rating?: number
  recent_reviews?: BusinessReview[]
  // Related data
  owner_profile?: UserProfile
  pin_location?: PinLocation
  category_info?: BusinessCategory
  marketplace_items?: MarketplaceItem[]
}

export interface CreateBusinessData {
  name: string
  description?: string
  category: string
  subcategory?: string
  address: string
  contact_email?: string
  contact_phone?: string
  website?: string
  social_media?: Record<string, string>
  opening_hours?: OpeningHours
  latitude?: number
  longitude?: number
  price_range?: LocalBusiness['price_range']
  features?: string[]
  images?: string[]
  pin_id?: string
  metadata?: Record<string, any>
}

export interface UpdateBusinessData {
  name?: string
  description?: string
  category?: string
  subcategory?: string
  address?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  social_media?: Record<string, string>
  opening_hours?: OpeningHours
  latitude?: number
  longitude?: number
  price_range?: LocalBusiness['price_range']
  features?: string[]
  images?: string[]
  status?: LocalBusiness['status']
  metadata?: Record<string, any>
}

export interface BusinessCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color: string
  parent_category_id?: string
  created_at: string
  // Computed fields
  business_count?: number
  subcategories?: BusinessCategory[]
}

export interface BusinessReview {
  id: string
  business_id: string
  user_id: string
  rating: number
  title?: string
  content?: string
  images: string[]
  helpful_count: number
  created_at: string
  updated_at: string
  // Related data
  user_profile?: UserProfile
  business?: LocalBusiness
}

export interface CreateBusinessReviewData {
  business_id: string
  rating: number
  title?: string
  content?: string
  images?: string[]
}

export interface UpdateBusinessReviewData {
  rating?: number
  title?: string
  content?: string
  images?: string[]
}

export interface MarketplaceItem {
  id: string
  business_id?: string
  seller_id: string
  title: string
  description: string
  category: string
  price?: number
  currency: string
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  images: string[]
  tags: string[]
  status: 'available' | 'sold' | 'reserved' | 'inactive'
  location?: string
  delivery_options: string[]
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  // Related data
  seller_profile?: UserProfile
  business?: LocalBusiness
}

export interface CreateMarketplaceItemData {
  business_id?: string
  title: string
  description: string
  category: string
  price?: number
  currency?: string
  condition?: MarketplaceItem['condition']
  images?: string[]
  tags?: string[]
  location?: string
  delivery_options?: string[]
  metadata?: Record<string, any>
}

export interface UpdateMarketplaceItemData {
  title?: string
  description?: string
  category?: string
  price?: number
  condition?: MarketplaceItem['condition']
  images?: string[]
  tags?: string[]
  status?: MarketplaceItem['status']
  location?: string
  delivery_options?: string[]
  metadata?: Record<string, any>
}

export interface EconomicMetric {
  id: string
  metric_type: string
  value: number
  period_start: string
  period_end: string
  location?: string
  category?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface EconomicIndicators {
  id: string
  total_businesses: number
  new_businesses_this_month: number
  local_spending: number
  economic_diversity_index: number
  employment_rate: number
  average_business_rating: number
  total_marketplace_items: number
  last_updated: string
  created_at: string
}

export interface OpeningHours {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
}

export interface DayHours {
  open: string // HH:MM format
  close: string // HH:MM format
  closed?: boolean
}

export interface BusinessFilters {
  category?: string[]
  subcategory?: string[]
  verified?: boolean
  rating_min?: number
  price_range?: LocalBusiness['price_range'][]
  features?: string[]
  status?: LocalBusiness['status'][]
  location?: {
    latitude: number
    longitude: number
    radius: number // in kilometers
  }
  search?: string
  sort_by?: 'name' | 'rating' | 'distance' | 'created_at' | 'review_count'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface MarketplaceFilters {
  category?: string[]
  price_min?: number
  price_max?: number
  condition?: MarketplaceItem['condition'][]
  status?: MarketplaceItem['status'][]
  seller_id?: string
  business_id?: string
  tags?: string[]
  search?: string
  sort_by?: 'created_at' | 'price' | 'title'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface EconomyMetrics {
  total_businesses: number
  verified_businesses: number
  new_businesses_this_month: number
  total_reviews: number
  average_rating: number
  total_marketplace_items: number
  active_marketplace_items: number
  category_distribution: Array<{
    category: string
    count: number
    percentage: number
  }>
  monthly_activity: Array<{
    month: string
    new_businesses: number
    new_reviews: number
    new_marketplace_items: number
  }>
}

// Supporting types
export interface UserProfile {
  id: string
  name?: string
  avatar_url?: string
  email?: string
}

export interface PinLocation {
  id: string
  title: string
  latitude: number
  longitude: number
  address?: string
}

// Business validation schemas
export interface BusinessValidationErrors {
  name?: string
  description?: string
  category?: string
  address?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  general?: string
}

// Marketplace validation schemas
export interface MarketplaceValidationErrors {
  title?: string
  description?: string
  category?: string
  price?: string
  condition?: string
  general?: string
}

// Business search and discovery
export interface BusinessSearchResult {
  businesses: LocalBusiness[]
  total_count: number
  facets: {
    categories: Array<{ name: string; count: number }>
    price_ranges: Array<{ range: string; count: number }>
    features: Array<{ name: string; count: number }>
    ratings: Array<{ rating: number; count: number }>
  }
}

// Economic analytics
export interface BusinessAnalytics {
  business_id: string
  views: number
  profile_visits: number
  review_engagement: number
  marketplace_item_views: number
  contact_clicks: number
  website_clicks: number
  monthly_metrics: Array<{
    month: string
    views: number
    reviews: number
    marketplace_items: number
  }>
}
