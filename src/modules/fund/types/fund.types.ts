import type { BaseEntity, UserProfile } from '@/core/types/common';

export interface FundTransaction extends BaseEntity {
  transaction_type: 'contribution' | 'allocation' | 'refund';
  amount: number;
  
  // Source tracking
  source_type: 'subscription' | 'donation' | 'grant' | 'allocation';
  source_reference?: string; // Stripe payment ID, etc.
  
  // Allocation tracking
  project_id?: string;
  allocated_by?: string;
  
  // Metadata
  description?: string;
  metadata: Record<string, any>;
  
  // Relations
  project?: {
    id: string;
    title: string;
    pin_id: string;
  };
  allocator?: UserProfile;
}

export interface FundBalance {
  total_balance: number;
  total_contributions: number;
  total_allocations: number;
  available_balance: number;
  pending_allocations: number;
}

export interface FundProposal extends BaseEntity {
  title: string;
  description: string;
  requested_amount: number;
  project_id?: string;
  pin_id?: string;
  
  // Status
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'funded';
  
  // Voting
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  voting_deadline?: string;
  
  // Relations
  submitted_by: string;
  submitter?: UserProfile;
  project?: {
    id: string;
    title: string;
    pin_id: string;
  };
}

export interface FundVote extends BaseEntity {
  proposal_id: string;
  user_id: string;
  vote: 'for' | 'against' | 'abstain';
  comment?: string;
  
  // Relations
  user?: UserProfile;
  proposal?: FundProposal;
}

export interface FundAllocation extends BaseEntity {
  proposal_id: string;
  project_id: string;
  amount: number;
  allocated_by: string;
  status: 'pending' | 'approved' | 'disbursed' | 'completed';
  
  // Disbursement tracking
  disbursement_date?: string;
  completion_date?: string;
  
  // Relations
  proposal?: FundProposal;
  project?: {
    id: string;
    title: string;
    pin_id: string;
  };
  allocator?: UserProfile;
}

export interface StripeSubscription {
  id: string;
  customer_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  
  // SILAS specific
  user_id: string;
  fund_contribution_percentage: number; // Default 50%
}

export interface FundStats {
  total_raised: number;
  total_allocated: number;
  total_projects_funded: number;
  active_proposals: number;
  recent_transactions: FundTransaction[];
  top_contributors: {
    user: UserProfile;
    total_contributed: number;
  }[];
  funding_by_category: Record<string, number>;
}

export interface CreateProposalRequest {
  title: string;
  description: string;
  requested_amount: number;
  project_id?: string;
  pin_id?: string;
}

export interface VoteOnProposalRequest {
  proposal_id: string;
  vote: 'for' | 'against' | 'abstain';
  comment?: string;
}

export interface AllocateFundsRequest {
  proposal_id: string;
  amount: number;
}

export interface FundFilters {
  transaction_type?: FundTransaction['transaction_type'];
  source_type?: FundTransaction['source_type'];
  project_id?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
}
