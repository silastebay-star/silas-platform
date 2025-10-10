/**
 * Hook for managing voting functionality
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/error-handling'
import { useFeedback } from '@/lib/user-feedback'
import type { Vote, CreateVoteData, VotingStats } from '../types'

export function useVoting(proposalId?: string) {
  const [votes, setVotes] = useState<Vote[]>([])
  const [userVote, setUserVote] = useState<Vote | null>(null)
  const [votingStats, setVotingStats] = useState<VotingStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const feedback = useFeedback()

  const fetchVotes = useCallback(async (targetProposalId?: string) => {
    if (!targetProposalId && !proposalId) return

    try {
      setLoading(true)
      setError(null)

      const id = targetProposalId || proposalId!

      // Fetch all votes for the proposal
      const { data: votesData, error: votesError } = await supabase
        .from('fund_votes')
        .select(`
          *,
          user_profile:user_id(id, name, avatar_url)
        `)
        .eq('proposal_id', id)
        .order('created_at', { ascending: false })

      if (votesError) throw votesError

      setVotes(votesData || [])

      // Check if current user has voted
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const currentUserVote = votesData?.find(vote => vote.user_id === user.id)
        setUserVote(currentUserVote || null)
      }

      // Calculate voting statistics
      const stats = calculateVotingStats(votesData || [])
      setVotingStats(stats)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch votes'
      setError(errorMessage)
      handleError(err as Error, 'useVoting.fetchVotes')
    } finally {
      setLoading(false)
    }
  }, [proposalId])

  const castVote = useCallback(async (voteData: CreateVoteData) => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        feedback.authRequired()
        throw new Error('Authentication required')
      }

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('fund_votes')
        .select('id')
        .eq('proposal_id', voteData.proposal_id)
        .eq('user_id', user.id)
        .single()

      if (existingVote) {
        // Update existing vote
        const { data, error } = await supabase
          .from('fund_votes')
          .update({
            vote_type: voteData.vote_type,
            comment: voteData.comment
          })
          .eq('id', existingVote.id)
          .select(`
            *,
            user_profile:user_id(id, name, avatar_url)
          `)
          .single()

        if (error) throw error

        setUserVote(data)
        feedback.success('Vote updated successfully')
      } else {
        // Create new vote
        const { data, error } = await supabase
          .from('fund_votes')
          .insert([{
            ...voteData,
            user_id: user.id,
            weight: 1 // Default weight, could be based on user reputation
          }])
          .select(`
            *,
            user_profile:user_id(id, name, avatar_url)
          `)
          .single()

        if (error) throw error

        setUserVote(data)
        feedback.reactionAdded(voteData.vote_type === 'for' ? 'Support' :
                              voteData.vote_type === 'against' ? 'Opposition' : 'Abstention')
      }

      // Refresh votes and update proposal vote counts
      await fetchVotes(voteData.proposal_id)
      await updateProposalVoteCounts(voteData.proposal_id)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cast vote'
      handleError(err as Error, 'useVoting.castVote')
      feedback.error('Failed to cast vote', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback, fetchVotes])

  const removeVote = useCallback(async (proposalId: string) => {
    try {
      setLoading(true)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      const { error } = await supabase
        .from('fund_votes')
        .delete()
        .eq('proposal_id', proposalId)
        .eq('user_id', user.id)

      if (error) throw error

      setUserVote(null)
      feedback.success('Vote removed successfully')

      // Refresh votes and update proposal vote counts
      await fetchVotes(proposalId)
      await updateProposalVoteCounts(proposalId)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove vote'
      handleError(err as Error, 'useVoting.removeVote')
      feedback.error('Failed to remove vote', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback, fetchVotes])

  // Helper function to update proposal vote counts
  const updateProposalVoteCounts = useCallback(async (proposalId: string) => {
    try {
      // Get current vote counts
      const { data: votes } = await supabase
        .from('fund_votes')
        .select('vote_type, weight')
        .eq('proposal_id', proposalId)

      if (!votes) return

      const votesFor = votes.filter(v => v.vote_type === 'for').reduce((sum, v) => sum + v.weight, 0)
      const votesAgainst = votes.filter(v => v.vote_type === 'against').reduce((sum, v) => sum + v.weight, 0)
      const totalVotes = votes.length

      // Update proposal with new counts
      await supabase
        .from('fund_proposals')
        .update({
          votes_for: votesFor,
          votes_against: votesAgainst,
          total_votes: totalVotes
        })
        .eq('id', proposalId)

    } catch (err) {
      console.error('Failed to update proposal vote counts:', err)
    }
  }, [])

  useEffect(() => {
    if (proposalId) {
      fetchVotes()

      // Subscribe to real-time vote updates
      const subscription = supabase
        .channel(`votes_${proposalId}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'fund_votes',
            filter: `proposal_id=eq.${proposalId}`
          },
          () => {
            fetchVotes()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [proposalId, fetchVotes])

  return {
    votes,
    userVote,
    votingStats,
    loading,
    error,
    castVote,
    removeVote,
    refetch: () => fetchVotes()
  }
}

// Helper function to calculate voting statistics
function calculateVotingStats(votes: Vote[]): VotingStats {
  const votesFor = votes.filter(v => v.vote_type === 'for').length
  const votesAgainst = votes.filter(v => v.vote_type === 'against').length
  const votesAbstain = votes.filter(v => v.vote_type === 'abstain').length
  const totalVotes = votes.length

  return {
    total_votes: totalVotes,
    votes_for: votesFor,
    votes_against: votesAgainst,
    votes_abstain: votesAbstain,
    approval_percentage: totalVotes > 0 ? Math.round((votesFor / totalVotes) * 100) : 0,
    participation_rate: 100, // Would need total eligible voters to calculate properly
    recent_votes: votes.slice(0, 10) // Last 10 votes
  }
}
