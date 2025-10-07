import { supabase } from '@/core/lib/supabase';
import type { 
  FundTransaction, 
  FundBalance, 
  FundProposal, 
  FundVote,
  FundAllocation,
  CreateProposalRequest,
  VoteOnProposalRequest,
  AllocateFundsRequest,
  FundFilters 
} from '../types/fund.types';

export class FundApi {
  /**
   * Get fund balance and statistics
   */
  static async getFundBalance(): Promise<FundBalance> {
    const { data, error } = await supabase
      .rpc('get_fund_balance');

    if (error) throw error;
    return data;
  }

  /**
   * Get fund transactions with filtering
   */
  static async getTransactions(filters: FundFilters = {}): Promise<FundTransaction[]> {
    let query = supabase
      .from('fund_ledger')
      .select(`
        *,
        projects(id, title, pin_id),
        user_profiles!fund_ledger_allocated_by_fkey(id, display_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (filters.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type);
    }

    if (filters.source_type) {
      query = query.eq('source_type', filters.source_type);
    }

    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.amount_min) {
      query = query.gte('amount', filters.amount_min);
    }

    if (filters.amount_max) {
      query = query.lte('amount', filters.amount_max);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Record a fund contribution (from Stripe webhook)
   */
  static async recordContribution(
    amount: number,
    sourceReference: string,
    metadata: Record<string, any> = {}
  ): Promise<FundTransaction> {
    const { data, error } = await supabase
      .from('fund_ledger')
      .insert([{
        transaction_type: 'contribution',
        amount,
        source_type: 'subscription',
        source_reference: sourceReference,
        description: 'Monthly subscription contribution',
        metadata
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Proposals API
   */
  static async getProposals(status?: FundProposal['status']): Promise<FundProposal[]> {
    let query = supabase
      .from('fund_proposals')
      .select(`
        *,
        user_profiles!fund_proposals_submitted_by_fkey(id, display_name, avatar_url, role),
        projects(id, title, pin_id)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async getProposal(id: string): Promise<FundProposal | null> {
    const { data, error } = await supabase
      .from('fund_proposals')
      .select(`
        *,
        user_profiles!fund_proposals_submitted_by_fkey(id, display_name, avatar_url, role),
        projects(id, title, pin_id),
        fund_votes(id, vote, comment, user_profiles(display_name, avatar_url))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createProposal(request: CreateProposalRequest): Promise<FundProposal> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('fund_proposals')
      .insert([{
        ...request,
        submitted_by: user.data.user.id,
        status: 'submitted'
      }])
      .select(`
        *,
        user_profiles!fund_proposals_submitted_by_fkey(id, display_name, avatar_url, role),
        projects(id, title, pin_id)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProposalStatus(
    id: string, 
    status: FundProposal['status']
  ): Promise<FundProposal> {
    const { data, error } = await supabase
      .from('fund_proposals')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user_profiles!fund_proposals_submitted_by_fkey(id, display_name, avatar_url, role),
        projects(id, title, pin_id)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Voting API
   */
  static async voteOnProposal(request: VoteOnProposalRequest): Promise<FundVote> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Remove existing vote first
    await supabase
      .from('fund_votes')
      .delete()
      .eq('proposal_id', request.proposal_id)
      .eq('user_id', user.data.user.id);

    const { data, error } = await supabase
      .from('fund_votes')
      .insert([{
        ...request,
        user_id: user.data.user.id
      }])
      .select(`
        *,
        user_profiles!fund_votes_user_id_fkey(id, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Update vote counts on proposal
    await this.updateProposalVoteCounts(request.proposal_id);

    return data;
  }

  static async getUserVote(proposalId: string): Promise<FundVote | null> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return null;

    const { data, error } = await supabase
      .from('fund_votes')
      .select('*')
      .eq('proposal_id', proposalId)
      .eq('user_id', user.data.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  private static async updateProposalVoteCounts(proposalId: string): Promise<void> {
    const { data: votes, error } = await supabase
      .from('fund_votes')
      .select('vote')
      .eq('proposal_id', proposalId);

    if (error) throw error;

    const voteCounts = (votes || []).reduce((acc, vote) => {
      acc[vote.vote] = (acc[vote.vote] || 0) + 1;
      return acc;
    }, { for: 0, against: 0, abstain: 0 });

    await supabase
      .from('fund_proposals')
      .update({
        votes_for: voteCounts.for,
        votes_against: voteCounts.against,
        votes_abstain: voteCounts.abstain,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId);
  }

  /**
   * Fund allocation API
   */
  static async allocateFunds(request: AllocateFundsRequest): Promise<FundAllocation> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Create allocation record
    const { data: allocation, error: allocationError } = await supabase
      .from('fund_allocations')
      .insert([{
        proposal_id: request.proposal_id,
        amount: request.amount,
        allocated_by: user.data.user.id,
        status: 'approved'
      }])
      .select(`
        *,
        fund_proposals(id, title, project_id),
        user_profiles!fund_allocations_allocated_by_fkey(id, display_name, avatar_url)
      `)
      .single();

    if (allocationError) throw allocationError;

    // Record transaction in fund ledger
    await supabase
      .from('fund_ledger')
      .insert([{
        transaction_type: 'allocation',
        amount: request.amount,
        source_type: 'allocation',
        project_id: allocation.fund_proposals?.project_id,
        allocated_by: user.data.user.id,
        description: `Fund allocation for proposal: ${allocation.fund_proposals?.title}`,
        metadata: { allocation_id: allocation.id }
      }]);

    // Update proposal status
    await this.updateProposalStatus(request.proposal_id, 'funded');

    return allocation;
  }

  /**
   * Stripe integration
   */
  static async createStripeCheckoutSession(
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ url: string }> {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        successUrl,
        cancelUrl
      }
    });

    if (error) throw error;
    return data;
  }

  static async createStripePortalSession(returnUrl: string): Promise<{ url: string }> {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { returnUrl }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Real-time subscriptions
   */
  static subscribeToFundChanges(callback: (payload: any) => void) {
    return supabase
      .channel('fund-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fund_ledger'
      }, callback)
      .subscribe();
  }

  static subscribeToProposalChanges(callback: (payload: any) => void) {
    return supabase
      .channel('proposal-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fund_proposals'
      }, callback)
      .subscribe();
  }
}
