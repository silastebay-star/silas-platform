/**
 * Community Events Types
 */

export interface CommunityEvent {
  id: string
  title: string
  description: string
  category: string
  start_time: string
  end_time: string
  location: string
  location_coords?: {
    x: number
    y: number
  }
  max_attendees?: number
  current_attendees: number
  is_recurring: boolean
  recurrence_pattern?: RecurrencePattern
  parent_event_id?: string
  status: 'draft' | 'active' | 'cancelled' | 'completed'
  is_public: boolean
  requires_approval: boolean
  tags: string[]
  image_url?: string
  contact_info?: ContactInfo
  created_by: string
  created_at: string
  updated_at: string
  pin_id?: string
  metadata?: Record<string, any>
  // Computed fields
  is_past?: boolean
  is_today?: boolean
  is_upcoming?: boolean
  duration_hours?: number
  attendee_percentage?: number
  user_rsvp_status?: RSVPStatus
  // Related data
  creator_profile?: UserProfile
  pin_location?: PinLocation
  category_info?: EventCategory
  rsvp_summary?: RSVPSummary
}

export interface CreateEventData {
  title: string
  description: string
  category: string
  start_time: string
  end_time: string
  location: string
  location_coords?: {
    x: number
    y: number
  }
  max_attendees?: number
  is_recurring?: boolean
  recurrence_pattern?: RecurrencePattern
  is_public?: boolean
  requires_approval?: boolean
  tags?: string[]
  image_url?: string
  contact_info?: ContactInfo
  pin_id?: string
  metadata?: Record<string, any>
}

export interface UpdateEventData {
  title?: string
  description?: string
  category?: string
  start_time?: string
  end_time?: string
  location?: string
  location_coords?: {
    x: number
    y: number
  }
  max_attendees?: number
  status?: CommunityEvent['status']
  is_public?: boolean
  requires_approval?: boolean
  tags?: string[]
  image_url?: string
  contact_info?: ContactInfo
  metadata?: Record<string, any>
}

export interface EventRSVP {
  id: string
  event_id: string
  user_id: string
  status: RSVPStatus
  guests_count: number
  dietary_requirements?: string
  accessibility_needs?: string
  notes?: string
  created_at: string
  updated_at: string
  // Related data
  user_profile?: UserProfile
  event?: CommunityEvent
}

export interface CreateRSVPData {
  event_id: string
  status: RSVPStatus
  guests_count?: number
  dietary_requirements?: string
  accessibility_needs?: string
  notes?: string
}

export interface UpdateRSVPData {
  status?: RSVPStatus
  guests_count?: number
  dietary_requirements?: string
  accessibility_needs?: string
  notes?: string
}

export interface EventCategory {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  created_at: string
}

export interface EventComment {
  id: string
  event_id: string
  user_id: string
  content: string
  parent_comment_id?: string
  created_at: string
  updated_at: string
  // Related data
  user_profile?: UserProfile
  replies?: EventComment[]
}

export interface CreateEventCommentData {
  event_id: string
  content: string
  parent_comment_id?: string
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // Every N days/weeks/months/years
  days_of_week?: number[] // 0-6, Sunday = 0
  day_of_month?: number // 1-31
  month_of_year?: number // 1-12
  end_date?: string
  max_occurrences?: number
}

export interface ContactInfo {
  email?: string
  phone?: string
  website?: string
  social_media?: Record<string, string>
}

export interface RSVPSummary {
  going: number
  maybe: number
  not_going: number
  total: number
  total_guests: number
}

export interface EventFilters {
  category?: string[]
  status?: CommunityEvent['status'][]
  start_date?: string
  end_date?: string
  location?: string
  tags?: string[]
  created_by?: string
  is_public?: boolean
  search?: string
  sort_by?: 'start_time' | 'created_at' | 'title' | 'current_attendees'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface EventMetrics {
  total_events: number
  upcoming_events: number
  past_events: number
  total_attendees: number
  average_attendance: number
  popular_categories: Array<{
    category: string
    count: number
    percentage: number
  }>
  monthly_activity: Array<{
    month: string
    events: number
    attendees: number
  }>
}

export interface CalendarView {
  view: 'month' | 'week' | 'day' | 'list'
  date: string // ISO date string for the current view date
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  category: string
  color: string
  attendees: number
  max_attendees?: number
  status: CommunityEvent['status']
  user_rsvp?: RSVPStatus
}

// Supporting types
export type RSVPStatus = 'going' | 'maybe' | 'not_going'

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

// Event validation schemas
export interface EventValidationErrors {
  title?: string
  description?: string
  category?: string
  start_time?: string
  end_time?: string
  location?: string
  max_attendees?: string
  general?: string
}
