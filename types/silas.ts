/**
 * SILAS Platform TypeScript Definitions
 * Comprehensive type definitions for the community mapping platform
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type UUID = string

export type UserRole = 'observer' | 'participant' | 'doer' | 'owner' | 'admin'

export type PinStatus = 'draft' | 'proposed' | 'published' | 'archived' | 'deleted'

export type ProposalStatus = 'pending' | 'approved' | 'rejected'

export type ProposalAction = 'create' | 'edit' | 'delete'

export type AuthorType = 'individual' | 'business' | 'group'

// ============================================================================
// CATEGORY SYSTEM
// ============================================================================

export type CategoryKey = 'community' | 'faith' | 'projects' | 'economy' | 'events' | 'data_ai' | 'issues'

export interface Category {
  key: CategoryKey
  label: string
  description: string
  color: string
  accent_color: string
  icon?: string
}

// ============================================================================
// GEOSPATIAL TYPES
// ============================================================================

export interface Coordinates {
  lat: number
  lng: number
}

export interface BoundingBox {
  north: number
  south: number
  east: number
  west: number
}

export interface GeoJSONPoint {
  type: 'Point'
  coordinates: [number, number] // [lng, lat]
}

export interface GeoJSONLineString {
  type: 'LineString'
  coordinates: [number, number][]
}

export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: [number, number][][]
}

export type GeoJSONGeometry = GeoJSONPoint | GeoJSONLineString | GeoJSONPolygon

// ============================================================================
// USER PROFILES
// ============================================================================

export interface UserProfile {
  id: UUID
  display_name: string | null
  role: UserRole
  verified: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// ============================================================================
// GROUPS
// ============================================================================

export interface Group {
  id: UUID
  name: string
  description: string | null
  owner_id: UUID
  members: UUID[]
  created_at: string
  public: boolean
  metadata: Record<string, any>
}

// ============================================================================
// PROJECTS
// ============================================================================

export interface Project {
  id: UUID
  name: string
  group_id: UUID | null
  description: string | null
  area: GeoJSONGeometry | null
  status: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  
  // Computed fields
  pin_count?: number
  total_funding?: number
  completion_percentage?: number
}

// ============================================================================
// PINS
// ============================================================================

export interface Pin {
  id: UUID
  title: string
  description: string | null
  categories: CategoryKey[]
  project_id: UUID | null
  group_id: UUID | null
  author_type: AuthorType
  geom: GeoJSONPoint
  status: PinStatus
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  
  // Computed fields
  author?: UserProfile
  project?: Project
  group?: Group
  photos?: string[]
  comment_count?: number
  vote_count?: number
  funding_amount?: number
  distance?: number // Distance from user location
}

// ============================================================================
// PIN PROPOSALS
// ============================================================================

export interface PinProposal {
  id: UUID
  pin_id: UUID | null
  proposer_id: UUID
  action: ProposalAction
  payload: Record<string, any>
  status: ProposalStatus
  created_at: string
  reviewed_at?: string
  reviewer_id?: UUID
  
  // Computed fields
  proposer?: UserProfile
  reviewer?: UserProfile
  original_pin?: Pin
}

// ============================================================================
// COMMUNITY FUND
// ============================================================================

export interface CommunityFund {
  id: UUID
  community_id: UUID
  balance: number
  updated_at: string
}

export interface FundAllocation {
  id: UUID
  fund_id: UUID
  project_id: UUID | null
  pin_id: UUID | null
  amount: number
  purpose: string
  allocated_by: UUID
  allocated_at: string
  status: 'pending' | 'approved' | 'disbursed' | 'completed'
}

// ============================================================================
// AI/RAG SYSTEM
// ============================================================================

export interface AIDocument {
  id: UUID
  community_id: UUID
  title: string | null
  content: string
  embedding: number[] // Vector embedding
  metadata: Record<string, any>
  created_at: string
}

export interface AIQuery {
  query: string
  context?: Record<string, any>
  max_results?: number
}

export interface AIResponse {
  response: string
  sources: AIDocument[]
  confidence: number
  processing_time: number
}

// ============================================================================
// MAP INTERFACE TYPES
// ============================================================================

export interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
}

export interface MapFilters {
  categories: CategoryKey[]
  status: PinStatus[]
  author_type: AuthorType[]
  date_range?: {
    start: string
    end: string
  }
  bounding_box?: BoundingBox
  search_query?: string
}

export interface ClusterProperties {
  cluster: boolean
  cluster_id: number
  point_count: number
  point_count_abbreviated: string
  categories: CategoryKey[]
  dominant_category: CategoryKey
}

export interface PinFeature {
  type: 'Feature'
  id: string
  geometry: GeoJSONPoint
  properties: Pin & {
    cluster?: boolean
  }
}

export interface ClusterFeature {
  type: 'Feature'
  id: string
  geometry: GeoJSONPoint
  properties: ClusterProperties
}

export type MapFeature = PinFeature | ClusterFeature

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface MapRootProps {
  activeCategory?: CategoryKey
  filters?: MapFilters
  onPinSelect: (pin: Pin) => void
  onPinHover?: (pin: Pin | null) => void
  onMapMove?: (viewState: MapViewState) => void
  className?: string
  style?: React.CSSProperties
}

export interface PinLayerProps {
  pins: Pin[]
  selectedPinId?: UUID
  hoveredPinId?: UUID
  filters: MapFilters
  onPinClick: (pin: Pin) => void
  onPinHover: (pin: Pin | null) => void
  showClustering?: boolean
  clusterRadius?: number
}

export interface PinMarkerProps {
  pin: Pin
  isSelected?: boolean
  isHovered?: boolean
  onClick: (pin: Pin) => void
  onHover: (pin: Pin | null) => void
  size?: 'small' | 'medium' | 'large'
  showBadge?: boolean
}

export interface PinPreviewTooltipProps {
  pin: Pin
  position: { x: number; y: number }
  isVisible: boolean
  onClose: () => void
  onSignInClick: () => void
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface APIError {
  message: string
  code?: string
  details?: Record<string, any>
}

export interface APIResponse<T> {
  data?: T
  error?: APIError
  success: boolean
}

// ============================================================================
// REAL-TIME SUBSCRIPTION TYPES
// ============================================================================

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: T
  old?: T
  errors?: string[]
}

export interface PinSubscriptionPayload extends RealtimePayload<Pin> {}

export interface ProjectSubscriptionPayload extends RealtimePayload<Project> {}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// ============================================================================
// CONSTANTS
// ============================================================================

export const CATEGORIES: Category[] = [
  {
    key: 'community',
    label: 'Community',
    description: 'Community events, gatherings, and social initiatives',
    color: '#6B8E6B',
    accent_color: '#8CBFA5'
  },
  {
    key: 'faith',
    label: 'Faith',
    description: 'Religious services, spiritual events, and faith communities',
    color: '#3A5D3A',
    accent_color: '#6B8E6B'
  },
  {
    key: 'projects',
    label: 'Projects',
    description: 'Local action and volunteer projects',
    color: '#4C764C',
    accent_color: '#6B8E6B'
  },
  {
    key: 'economy',
    label: 'Economy',
    description: 'Local businesses, economic development, and commerce',
    color: '#4C6F76',
    accent_color: '#8CBFA5'
  },
  {
    key: 'events',
    label: 'Events',
    description: 'Upcoming events, festivals, and public gatherings',
    color: '#8CBFA5',
    accent_color: '#6B8E6B'
  },
  {
    key: 'data_ai',
    label: 'Data & AI',
    description: 'Data insights, AI analysis, and digital initiatives',
    color: '#5E6E6E',
    accent_color: '#8CBFA5'
  },
  {
    key: 'issues',
    label: 'Issues',
    description: 'Community issues, problems, and areas needing attention',
    color: '#C97340',
    accent_color: '#8CBFA5'
  }
]

export const USER_ROLES: Record<UserRole, string> = {
  observer: 'Observer',
  participant: 'Participant',
  doer: 'Doer',
  owner: 'Owner',
  admin: 'Administrator'
}

export const PIN_STATUSES: Record<PinStatus, string> = {
  draft: 'Draft',
  proposed: 'Proposed',
  published: 'Published',
  archived: 'Archived',
  deleted: 'Deleted'
}
