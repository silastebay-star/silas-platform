/**
 * Community Fund Types
 */

export interface Proposal {
  id: string
  title: string
  description: string
  amount_requested: number
  category: string
  status: 'draft' | 'active' | 'approved' | 'rejected' | 'completed'
  created_by: string
  created_at: string
  voting_deadline: string | null
  votes_for: number
  votes_against: number
  total_votes: number
  funding_goal: number
  current_funding: number
  metadata?: Record<string, any>
  // Computed fields
  approval_percentage?: number
  days_remaining?: number
  is_user_voted?: boolean
  user_vote_type?: 'for' | 'against' | 'abstain'
  // Related data
  creator_profile?: UserProfile
  pin_location?: PinLocation
}

export interface CreateProposalData {
  title: string
  description: string
  amount_requested: number
  category: string
  voting_deadline?: string
  funding_goal?: number
  metadata?: Record<string, any>
  pin_id?: string // Optional link to map pin
}

export interface UpdateProposalData {
  title?: string
  description?: string
  amount_requested?: number
  category?: string
  voting_deadline?: string
  status?: Proposal['status']
  metadata?: Record<string, any>
}

export interface Vote {
  id: string
  proposal_id: string
  user_id: string
  vote_type: 'for' | 'against' | 'abstain'
  weight: number
  created_at: string
  comment?: string
  // Related data
  user_profile?: UserProfile
}

export interface CreateVoteData {
  proposal_id: string
  vote_type: 'for' | 'against' | 'abstain'
  comment?: string
}

export interface VotingStats {
  total_votes: number
  votes_for: number
  votes_against: number
  votes_abstain: number
  approval_percentage: number
  participation_rate: number
  recent_votes: Vote[]
}

export interface FundTransaction {
  id: string
  type: 'contribution' | 'disbursement' | 'fee'
  amount: number
  description: string
  proposal_id?: string
  user_id?: string
  created_at: string
  status: 'pending' | 'completed' | 'failed'
  metadata?: Record<string, any>
}

export interface FundBalance {
  id: string
  total_balance: number
  available_balance: number
  committed_balance: number
  monthly_contributions: number
  last_updated: string
  created_at: string
  // Computed fields
  growth_rate?: number
  projected_balance?: number
  funding_capacity?: number
}

// Supporting types
export interface UserProfile {
  id: string
  name?: string
  avatar_url?: string
  reputation_score?: number
}

export interface PinLocation {
  id: string
  title: string
  latitude: number
  longitude: number
  address?: string
}

export interface FundCategory {
  id: string
  name: string
  description: string
  color: string
  icon?: string
  budget_allocation?: number
}

export interface ProposalFilters {
  status?: Proposal['status'][]
  category?: string[]
  amount_min?: number
  amount_max?: number
  created_after?: string
  created_before?: string
  search?: string
  sort_by?: 'created_at' | 'amount_requested' | 'votes_for' | 'voting_deadline'
  sort_order?: 'asc' | 'desc'
}

export interface FundMetrics {
  total_proposals: number
  active_proposals: number
  approved_proposals: number
  total_funding_requested: number
  total_funding_approved: number
  average_proposal_amount: number
  success_rate: number
  community_participation: number
}
