/**
 * Hook for managing community fund proposals
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/error-handling'
import { useFeedback } from '@/lib/user-feedback'
import type { Proposal, CreateProposalData, UpdateProposalData, ProposalFilters } from '../types'

export function useProposals(filters?: ProposalFilters) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const feedback = useFeedback()

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('fund_proposals')
        .select(`
          *,
          creator_profile:created_by(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address)
        `, { count: 'exact' })

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      }
      if (filters?.category?.length) {
        query = query.in('category', filters.category)
      }
      if (filters?.amount_min !== undefined) {
        query = query.gte('amount_requested', filters.amount_min)
      }
      if (filters?.amount_max !== undefined) {
        query = query.lte('amount_requested', filters.amount_max)
      }
      if (filters?.created_after) {
        query = query.gte('created_at', filters.created_after)
      }
      if (filters?.created_before) {
        query = query.lte('created_at', filters.created_before)
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'created_at'
      const sortOrder = filters?.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error, count } = await query

      if (error) throw error

      // Enhance proposals with computed fields
      const enhancedProposals = (data || []).map(enhanceProposal)

      setProposals(enhancedProposals)
      setTotalCount(count || 0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proposals'
      setError(errorMessage)
      handleError(err as Error, 'useProposals.fetchProposals')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const createProposal = useCallback(async (proposalData: CreateProposalData) => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('fund_proposals')
        .insert([{
          ...proposalData,
          created_by: user.id,
          votes_for: 0,
          votes_against: 0,
          total_votes: 0,
          current_funding: 0,
          status: 'draft'
        }])
        .select(`
          *,
          creator_profile:created_by(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address)
        `)
        .single()

      if (error) throw error

      const enhancedProposal = enhanceProposal(data)
      setProposals(prev => [enhancedProposal, ...prev])

      feedback.success('Proposal created successfully!', {
        description: `"${data.title}" has been created and is ready for review`
      })

      return enhancedProposal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create proposal'
      handleError(err as Error, 'useProposals.createProposal')
      feedback.error('Failed to create proposal', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const updateProposal = useCallback(async (id: string, updates: UpdateProposalData) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('fund_proposals')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          creator_profile:created_by(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address)
        `)
        .single()

      if (error) throw error

      const enhancedProposal = enhanceProposal(data)
      setProposals(prev => prev.map(p => p.id === id ? enhancedProposal : p))

      feedback.success('Proposal updated successfully')
      return enhancedProposal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update proposal'
      handleError(err as Error, 'useProposals.updateProposal')
      feedback.error('Failed to update proposal', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const deleteProposal = useCallback(async (id: string) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('fund_proposals')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProposals(prev => prev.filter(p => p.id !== id))
      feedback.success('Proposal deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete proposal'
      handleError(err as Error, 'useProposals.deleteProposal')
      feedback.error('Failed to delete proposal', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  useEffect(() => {
    fetchProposals()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('proposals_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fund_proposals' },
        () => {
          fetchProposals()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fund_votes' },
        () => {
          // Refresh proposals when votes change to update vote counts
          fetchProposals()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProposals])

  return {
    proposals,
    loading,
    error,
    totalCount,
    createProposal,
    updateProposal,
    deleteProposal,
    refetch: fetchProposals
  }
}

// Helper function to enhance proposals with computed fields
function enhanceProposal(proposal: any): Proposal {
  const now = new Date()
  const deadline = proposal.voting_deadline ? new Date(proposal.voting_deadline) : null

  return {
    ...proposal,
    approval_percentage: proposal.total_votes > 0
      ? Math.round((proposal.votes_for / proposal.total_votes) * 100)
      : 0,
    days_remaining: deadline
      ? Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null
  }
}
