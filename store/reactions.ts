'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type ReactionType = 'like' | 'love' | 'support' | 'pray' | 'celebrate' | 'concern'

export interface Reaction {
  id: string
  pin_id: string
  user_id: string
  reaction_type: ReactionType
  created_at: string
}

export interface ReactionCounts {
  like: number
  love: number
  support: number
  pray: number
  celebrate: number
  concern: number
  total: number
}

interface ReactionsState {
  // Reactions by pin_id
  reactions: Record<string, Reaction[]>
  // User's reactions by pin_id
  userReactions: Record<string, ReactionType[]>
  // Reaction counts by pin_id
  counts: Record<string, ReactionCounts>
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchReactions: (pinId: string) => Promise<void>
  addReaction: (pinId: string, reactionType: ReactionType) => Promise<void>
  removeReaction: (pinId: string, reactionType: ReactionType) => Promise<void>
  toggleReaction: (pinId: string, reactionType: ReactionType) => Promise<void>
  
  // Getters
  getReactionCounts: (pinId: string) => ReactionCounts
  hasUserReacted: (pinId: string, reactionType: ReactionType) => boolean
  getUserReactions: (pinId: string) => ReactionType[]
}

const defaultCounts: ReactionCounts = {
  like: 0,
  love: 0,
  support: 0,
  pray: 0,
  celebrate: 0,
  concern: 0,
  total: 0
}

export const useReactionsStore = create<ReactionsState>((set, get) => ({
  reactions: {},
  userReactions: {},
  counts: {},
  isLoading: false,
  error: null,

  fetchReactions: async (pinId: string) => {
    set({ isLoading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('pin_reactions')
        .select('*')
        .eq('pin_id', pinId)

      if (error) throw error

      const reactions = data || []
      const currentUserId = 'current_user' // TODO: Get from auth

      // Calculate counts
      const counts = reactions.reduce((acc, reaction) => {
        acc[reaction.reaction_type as ReactionType] = (acc[reaction.reaction_type as ReactionType] || 0) + 1
        acc.total += 1
        return acc
      }, { ...defaultCounts })

      // Get user's reactions
      const userReactions = reactions
        .filter(r => r.user_id === currentUserId)
        .map(r => r.reaction_type as ReactionType)

      set(state => ({
        reactions: {
          ...state.reactions,
          [pinId]: reactions
        },
        userReactions: {
          ...state.userReactions,
          [pinId]: userReactions
        },
        counts: {
          ...state.counts,
          [pinId]: counts
        },
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch reactions', 
        isLoading: false 
      })
    }
  },

  addReaction: async (pinId: string, reactionType: ReactionType) => {
    const currentUserId = 'current_user' // TODO: Get from auth
    
    // Optimistic update
    set(state => {
      const currentUserReactions = state.userReactions[pinId] || []
      const currentCounts = state.counts[pinId] || { ...defaultCounts }
      
      // Don't add if already exists
      if (currentUserReactions.includes(reactionType)) {
        return state
      }

      return {
        userReactions: {
          ...state.userReactions,
          [pinId]: [...currentUserReactions, reactionType]
        },
        counts: {
          ...state.counts,
          [pinId]: {
            ...currentCounts,
            [reactionType]: currentCounts[reactionType] + 1,
            total: currentCounts.total + 1
          }
        }
      }
    })

    try {
      const { error } = await supabase
        .from('pin_reactions')
        .insert([{
          pin_id: pinId,
          user_id: currentUserId,
          reaction_type: reactionType
        }])

      if (error) throw error
    } catch (error) {
      // Revert optimistic update
      set(state => {
        const currentUserReactions = state.userReactions[pinId] || []
        const currentCounts = state.counts[pinId] || { ...defaultCounts }
        
        return {
          userReactions: {
            ...state.userReactions,
            [pinId]: currentUserReactions.filter(r => r !== reactionType)
          },
          counts: {
            ...state.counts,
            [pinId]: {
              ...currentCounts,
              [reactionType]: Math.max(0, currentCounts[reactionType] - 1),
              total: Math.max(0, currentCounts.total - 1)
            }
          },
          error: error instanceof Error ? error.message : 'Failed to add reaction'
        }
      })
    }
  },

  removeReaction: async (pinId: string, reactionType: ReactionType) => {
    const currentUserId = 'current_user' // TODO: Get from auth
    
    // Optimistic update
    set(state => {
      const currentUserReactions = state.userReactions[pinId] || []
      const currentCounts = state.counts[pinId] || { ...defaultCounts }
      
      // Don't remove if doesn't exist
      if (!currentUserReactions.includes(reactionType)) {
        return state
      }

      return {
        userReactions: {
          ...state.userReactions,
          [pinId]: currentUserReactions.filter(r => r !== reactionType)
        },
        counts: {
          ...state.counts,
          [pinId]: {
            ...currentCounts,
            [reactionType]: Math.max(0, currentCounts[reactionType] - 1),
            total: Math.max(0, currentCounts.total - 1)
          }
        }
      }
    })

    try {
      const { error } = await supabase
        .from('pin_reactions')
        .delete()
        .eq('pin_id', pinId)
        .eq('user_id', currentUserId)
        .eq('reaction_type', reactionType)

      if (error) throw error
    } catch (error) {
      // Revert optimistic update
      set(state => {
        const currentUserReactions = state.userReactions[pinId] || []
        const currentCounts = state.counts[pinId] || { ...defaultCounts }
        
        return {
          userReactions: {
            ...state.userReactions,
            [pinId]: [...currentUserReactions, reactionType]
          },
          counts: {
            ...state.counts,
            [pinId]: {
              ...currentCounts,
              [reactionType]: currentCounts[reactionType] + 1,
              total: currentCounts.total + 1
            }
          },
          error: error instanceof Error ? error.message : 'Failed to remove reaction'
        }
      })
    }
  },

  toggleReaction: async (pinId: string, reactionType: ReactionType) => {
    const { hasUserReacted, addReaction, removeReaction } = get()
    
    if (hasUserReacted(pinId, reactionType)) {
      await removeReaction(pinId, reactionType)
    } else {
      await addReaction(pinId, reactionType)
    }
  },

  getReactionCounts: (pinId: string) => {
    const state = get()
    return state.counts[pinId] || { ...defaultCounts }
  },

  hasUserReacted: (pinId: string, reactionType: ReactionType) => {
    const state = get()
    const userReactions = state.userReactions[pinId] || []
    return userReactions.includes(reactionType)
  },

  getUserReactions: (pinId: string) => {
    const state = get()
    return state.userReactions[pinId] || []
  }
}))

// Reaction configuration
export const REACTION_CONFIG = {
  like: { emoji: '👍', label: 'Like', color: '#3B82F6' },
  love: { emoji: '❤️', label: 'Love', color: '#EF4444' },
  support: { emoji: '🤝', label: 'Support', color: '#10B981' },
  pray: { emoji: '🙏', label: 'Pray', color: '#8B5CF6' },
  celebrate: { emoji: '🎉', label: 'Celebrate', color: '#F59E0B' },
  concern: { emoji: '😟', label: 'Concern', color: '#F97316' }
} as const
