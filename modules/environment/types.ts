/**
 * Environment Module Types
 */

export interface EnvironmentalMetric {
  id: string
  metric_type: string
  value: number
  unit: string
  location?: {
    x: number
    y: number
  }
  latitude?: number
  longitude?: number
  recorded_at: string
  source?: string
  quality_score?: number
  verified: boolean
  metadata?: Record<string, any>
  // Computed fields
  trend?: 'improving' | 'declining' | 'stable'
  comparison_to_target?: 'above' | 'below' | 'on_target'
  // Related data
  category_info?: EnvironmentalCategory
}

export interface CreateEnvironmentalMetricData {
  metric_type: string
  value: number
  unit: string
  latitude?: number
  longitude?: number
  source?: string
  quality_score?: number
  metadata?: Record<string, any>
}

export interface UpdateEnvironmentalMetricData {
  value?: number
  unit?: string
  latitude?: number
  longitude?: number
  source?: string
  quality_score?: number
  verified?: boolean
  metadata?: Record<string, any>
}

export interface EnvironmentalCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color: string
  unit?: string
  target_value?: number
  target_direction?: 'increase' | 'decrease' | 'maintain'
  created_at: string
  // Computed fields
  current_average?: number
  trend?: 'improving' | 'declining' | 'stable'
  metrics_count?: number
}

export interface SustainabilityProject {
  id: string
  title: string
  description: string
  category: string
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date?: string
  end_date?: string
  budget?: number
  funding_source?: string
  location?: {
    x: number
    y: number
  }
  latitude?: number
  longitude?: number
  impact_metrics?: Record<string, any>
  participants_count: number
  created_by?: string
  created_at: string
  updated_at: string
  pin_id?: string
  metadata?: Record<string, any>
  // Computed fields
  progress_percentage?: number
  days_remaining?: number
  is_overdue?: boolean
  budget_utilization?: number
  // Related data
  creator_profile?: UserProfile
  pin_location?: PinLocation
  participants?: ProjectParticipant[]
  recent_updates?: ProjectUpdate[]
}

export interface CreateSustainabilityProjectData {
  title: string
  description: string
  category: string
  priority?: SustainabilityProject['priority']
  start_date?: string
  end_date?: string
  budget?: number
  funding_source?: string
  latitude?: number
  longitude?: number
  impact_metrics?: Record<string, any>
  pin_id?: string
  metadata?: Record<string, any>
}

export interface UpdateSustainabilityProjectData {
  title?: string
  description?: string
  category?: string
  status?: SustainabilityProject['status']
  priority?: SustainabilityProject['priority']
  start_date?: string
  end_date?: string
  budget?: number
  funding_source?: string
  latitude?: number
  longitude?: number
  impact_metrics?: Record<string, any>
  metadata?: Record<string, any>
}

export interface ProjectParticipant {
  id: string
  project_id: string
  user_id: string
  role: 'participant' | 'volunteer' | 'coordinator' | 'leader'
  joined_at: string
  contribution_hours: number
  notes?: string
  // Related data
  user_profile?: UserProfile
  project?: SustainabilityProject
}

export interface CreateProjectParticipantData {
  project_id: string
  role?: ProjectParticipant['role']
  notes?: string
}

export interface UpdateProjectParticipantData {
  role?: ProjectParticipant['role']
  contribution_hours?: number
  notes?: string
}

export interface GreenInitiative {
  id: string
  title: string
  description: string
  category: string
  proposed_by?: string
  status: 'proposed' | 'under_review' | 'approved' | 'rejected' | 'implemented'
  votes_for: number
  votes_against: number
  implementation_cost?: number
  expected_impact?: string
  timeline_months?: number
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  // Computed fields
  total_votes?: number
  approval_percentage?: number
  user_vote?: InitiativeVoteType
  // Related data
  proposer_profile?: UserProfile
  recent_votes?: InitiativeVote[]
}

export interface CreateGreenInitiativeData {
  title: string
  description: string
  category: string
  implementation_cost?: number
  expected_impact?: string
  timeline_months?: number
  metadata?: Record<string, any>
}

export interface UpdateGreenInitiativeData {
  title?: string
  description?: string
  category?: string
  status?: GreenInitiative['status']
  implementation_cost?: number
  expected_impact?: string
  timeline_months?: number
  metadata?: Record<string, any>
}

export interface InitiativeVote {
  id: string
  initiative_id: string
  user_id: string
  vote: InitiativeVoteType
  reason?: string
  created_at: string
  // Related data
  user_profile?: UserProfile
  initiative?: GreenInitiative
}

export interface CreateInitiativeVoteData {
  initiative_id: string
  vote: InitiativeVoteType
  reason?: string
}

export interface EnvironmentalAlert {
  id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location?: {
    x: number
    y: number
  }
  latitude?: number
  longitude?: number
  metric_value?: number
  threshold_value?: number
  status: 'active' | 'acknowledged' | 'resolved'
  created_at: string
  resolved_at?: string
  metadata?: Record<string, any>
  // Computed fields
  duration_hours?: number
  is_urgent?: boolean
}

export interface CreateEnvironmentalAlertData {
  alert_type: string
  severity: EnvironmentalAlert['severity']
  title: string
  description: string
  latitude?: number
  longitude?: number
  metric_value?: number
  threshold_value?: number
  metadata?: Record<string, any>
}

export interface UpdateEnvironmentalAlertData {
  status?: EnvironmentalAlert['status']
  resolved_at?: string
  metadata?: Record<string, any>
}

export interface ProjectUpdate {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string
  update_type: 'progress' | 'milestone' | 'issue' | 'completion'
  created_at: string
  // Related data
  user_profile?: UserProfile
  project?: SustainabilityProject
}

export interface EnvironmentalFilters {
  metric_type?: string[]
  category?: string[]
  verified?: boolean
  quality_score_min?: number
  date_from?: string
  date_to?: string
  location?: {
    latitude: number
    longitude: number
    radius: number // in kilometers
  }
  source?: string[]
  sort_by?: 'recorded_at' | 'value' | 'quality_score' | 'metric_type'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ProjectFilters {
  category?: string[]
  status?: SustainabilityProject['status'][]
  priority?: SustainabilityProject['priority'][]
  created_by?: string
  start_date_from?: string
  start_date_to?: string
  budget_min?: number
  budget_max?: number
  location?: {
    latitude: number
    longitude: number
    radius: number
  }
  search?: string
  sort_by?: 'created_at' | 'start_date' | 'priority' | 'participants_count' | 'budget'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface InitiativeFilters {
  category?: string[]
  status?: GreenInitiative['status'][]
  proposed_by?: string
  cost_max?: number
  timeline_max?: number
  search?: string
  sort_by?: 'created_at' | 'votes_for' | 'implementation_cost' | 'timeline_months'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface EnvironmentMetrics {
  total_metrics: number
  verified_metrics: number
  active_projects: number
  completed_projects: number
  pending_initiatives: number
  approved_initiatives: number
  active_alerts: number
  critical_alerts: number
  category_averages: Array<{
    category: string
    average_value: number
    trend: 'improving' | 'declining' | 'stable'
    target_progress: number
  }>
  monthly_activity: Array<{
    month: string
    new_metrics: number
    new_projects: number
    completed_projects: number
  }>
}

// Supporting types
export type InitiativeVoteType = 'for' | 'against' | 'abstain'

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

// Validation schemas
export interface EnvironmentalValidationErrors {
  metric_type?: string
  value?: string
  unit?: string
  source?: string
  quality_score?: string
  general?: string
}

export interface ProjectValidationErrors {
  title?: string
  description?: string
  category?: string
  start_date?: string
  end_date?: string
  budget?: string
  general?: string
}

export interface InitiativeValidationErrors {
  title?: string
  description?: string
  category?: string
  implementation_cost?: string
  timeline_months?: string
  general?: string
}
