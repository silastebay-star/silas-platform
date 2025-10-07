'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Comment {
  id: string
  pin_id: string
  user_id: string
  parent_id?: string
  content: string
  is_edited: boolean
  is_flagged: boolean
  created_at: string
  updated_at: string
  // Joined data
  user_profile?: {
    display_name?: string
    avatar_url?: string
  }
  replies?: Comment[]
}

interface CommentState {
  comments: Record<string, Comment[]> // Keyed by pin_id
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchComments: (pinId: string) => Promise<void>
  addComment: (pinId: string, content: string, parentId?: string) => Promise<Comment | null>
  updateComment: (commentId: string, content: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  flagComment: (commentId: string) => Promise<void>
  
  // Optimistic updates
  addOptimisticComment: (pinId: string, content: string, parentId?: string) => string
  removeOptimisticComment: (pinId: string, tempId: string) => void
  updateOptimisticComment: (pinId: string, tempId: string, comment: Comment) => void
}

export const useCommentsStore = create<CommentState>((set, get) => ({
  comments: {},
  isLoading: false,
  error: null,

  fetchComments: async (pinId: string) => {
    set({ isLoading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('pin_comments')
        .select(`
          *,
          user_profiles!pin_comments_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('pin_id', pinId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Transform flat comments into threaded structure
      const commentsMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      // First pass: create all comment objects
      data.forEach(row => {
        const comment: Comment = {
          id: row.id,
          pin_id: row.pin_id,
          user_id: row.user_id,
          parent_id: row.parent_id,
          content: row.content,
          is_edited: row.is_edited,
          is_flagged: row.is_flagged,
          created_at: row.created_at,
          updated_at: row.updated_at,
          user_profile: row.user_profiles,
          replies: []
        }
        commentsMap.set(comment.id, comment)
      })

      // Second pass: build threaded structure
      commentsMap.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id)
          if (parent) {
            parent.replies = parent.replies || []
            parent.replies.push(comment)
          }
        } else {
          rootComments.push(comment)
        }
      })

      set(state => ({
        comments: {
          ...state.comments,
          [pinId]: rootComments
        },
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch comments', 
        isLoading: false 
      })
    }
  },

  addOptimisticComment: (pinId: string, content: string, parentId?: string) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`
    const optimisticComment: Comment = {
      id: tempId,
      pin_id: pinId,
      user_id: 'current_user', // TODO: Get from auth
      parent_id: parentId,
      content,
      is_edited: false,
      is_flagged: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_profile: {
        display_name: 'You',
        avatar_url: undefined
      },
      replies: []
    }

    set(state => {
      const pinComments = state.comments[pinId] || []
      
      if (parentId) {
        // Add as reply to parent comment
        const updatedComments = addReplyToComment(pinComments, parentId, optimisticComment)
        return {
          comments: {
            ...state.comments,
            [pinId]: updatedComments
          }
        }
      } else {
        // Add as root comment
        return {
          comments: {
            ...state.comments,
            [pinId]: [...pinComments, optimisticComment]
          }
        }
      }
    })

    return tempId
  },

  removeOptimisticComment: (pinId: string, tempId: string) => {
    set(state => {
      const pinComments = state.comments[pinId] || []
      const updatedComments = removeCommentById(pinComments, tempId)
      return {
        comments: {
          ...state.comments,
          [pinId]: updatedComments
        }
      }
    })
  },

  updateOptimisticComment: (pinId: string, tempId: string, comment: Comment) => {
    set(state => {
      const pinComments = state.comments[pinId] || []
      const updatedComments = replaceCommentById(pinComments, tempId, comment)
      return {
        comments: {
          ...state.comments,
          [pinId]: updatedComments
        }
      }
    })
  },

  addComment: async (pinId: string, content: string, parentId?: string) => {
    // Add optimistic comment first
    const tempId = get().addOptimisticComment(pinId, content, parentId)

    try {
      const { data, error } = await supabase
        .from('pin_comments')
        .insert([{
          pin_id: pinId,
          user_id: 'current_user', // TODO: Get from auth
          parent_id: parentId,
          content
        }])
        .select(`
          *,
          user_profiles!pin_comments_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      const newComment: Comment = {
        id: data.id,
        pin_id: data.pin_id,
        user_id: data.user_id,
        parent_id: data.parent_id,
        content: data.content,
        is_edited: data.is_edited,
        is_flagged: data.is_flagged,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_profile: data.user_profiles,
        replies: []
      }

      // Replace optimistic comment with real one
      get().updateOptimisticComment(pinId, tempId, newComment)
      
      return newComment
    } catch (error) {
      // Remove optimistic comment on error
      get().removeOptimisticComment(pinId, tempId)
      
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add comment'
      })
      return null
    }
  },

  updateComment: async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('pin_comments')
        .update({ 
          content, 
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (error) throw error

      // TODO: Update local state
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update comment'
      })
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('pin_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      // TODO: Update local state
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete comment'
      })
    }
  },

  flagComment: async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('pin_comments')
        .update({ is_flagged: true })
        .eq('id', commentId)

      if (error) throw error

      // TODO: Update local state
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to flag comment'
      })
    }
  }
}))

// Helper functions for nested comment operations
function addReplyToComment(comments: Comment[], parentId: string, reply: Comment): Comment[] {
  return comments.map(comment => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), reply]
      }
    } else if (comment.replies) {
      return {
        ...comment,
        replies: addReplyToComment(comment.replies, parentId, reply)
      }
    }
    return comment
  })
}

function removeCommentById(comments: Comment[], commentId: string): Comment[] {
  return comments
    .filter(comment => comment.id !== commentId)
    .map(comment => ({
      ...comment,
      replies: comment.replies ? removeCommentById(comment.replies, commentId) : []
    }))
}

function replaceCommentById(comments: Comment[], oldId: string, newComment: Comment): Comment[] {
  return comments.map(comment => {
    if (comment.id === oldId) {
      return newComment
    } else if (comment.replies) {
      return {
        ...comment,
        replies: replaceCommentById(comment.replies, oldId, newComment)
      }
    }
    return comment
  })
}
