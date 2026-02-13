/**
 * Database Types for SILAS Platform
 * Auto-generated types for type-safe database operations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          username: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          website: string | null
          role: 'user' | 'moderator' | 'admin'
          is_verified: boolean
          is_active: boolean
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          role?: 'user' | 'moderator' | 'admin'
          is_verified?: boolean
          is_active?: boolean
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          role?: 'user' | 'moderator' | 'admin'
          is_verified?: boolean
          is_active?: boolean
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: 'community' | 'faith' | 'projects' | 'economy' | 'events' | 'data_ai' | 'issues' | 'heritage_culture' | 'governance'
          avatar_url: string | null
          banner_url: string | null
          is_public: boolean
          is_verified: boolean
          member_count: number
          pin_count: number
          location: string | null
          website: string | null
          rules: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category: 'community' | 'faith' | 'projects' | 'economy' | 'events' | 'data_ai' | 'issues' | 'heritage_culture' | 'governance'
          avatar_url?: string | null
          banner_url?: string | null
          is_public?: boolean
          is_verified?: boolean
          member_count?: number
          pin_count?: number
          location?: string | null
          website?: string | null
          rules?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category?: 'community' | 'faith' | 'projects' | 'economy' | 'events' | 'data_ai' | 'issues' | 'heritage_culture' | 'governance'
          avatar_url?: string | null
          banner_url?: string | null
          is_public?: boolean
          is_verified?: boolean
          member_count?: number
          pin_count?: number
          location?: string | null
          website?: string | null
          rules?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      group_memberships: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'member' | 'moderator' | 'admin'
          joined_at: string
          invited_by: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'member' | 'moderator' | 'admin'
          joined_at?: string
          invited_by?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'member' | 'moderator' | 'admin'
          joined_at?: string
          invited_by?: string | null
        }
      }
      pins: {
        Row: {
          id: string
          title: string
          description: string | null
          category: 'community' | 'faith' | 'projects' | 'economy' | 'events' | 'data_ai' | 'issues' | 'heritage_culture' | 'governance'
          status: 'active' | 'pending' | 'archived' | 'flagged'
          location: unknown // PostGIS geography type
          address: string | null
          images: string[]
          tags: string[]
          metadata: Json
          like_count: number
          comment_count: number
          view_count: number
          is_featured: boolean
          expires_at: string | null
          created_by: string | null
          group_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: 'community' | 'faith' | 'projects' | 'economy' | 'events' | 'data_ai' | 'issues' | 'heritage_culture' | 'governance'
          status?: 'active' | 'pending' | 'archived' | 'flagged'
          location: unknown
          address?: string | null
          images?: string[]
          tags?: string[]
          metadata?: Json
          like_count?: number
          comment_count?: number
          view_count?: number
          is_featured?: boolean
          expires_at?: string | null
          created_by?: string | null
          group_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: 'community' | 'faith' | 'projects' | 'economy' | 'events' | 'data_ai' | 'issues' | 'heritage_culture' | 'governance'
          status?: 'active' | 'pending' | 'archived' | 'flagged'
          location?: unknown
          address?: string | null
          images?: string[]
          tags?: string[]
          metadata?: Json
          like_count?: number
          comment_count?: number
          view_count?: number
          is_featured?: boolean
          expires_at?: string | null
          created_by?: string | null
          group_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pin_likes: {
        Row: {
          id: string
          pin_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          pin_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          pin_id?: string
          user_id?: string
          created_at?: string
        }
      }
      pin_comments: {
        Row: {
          id: string
          pin_id: string
          user_id: string
          parent_id: string | null
          content: string
          like_count: number
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pin_id: string
          user_id: string
          parent_id?: string | null
          content: string
          like_count?: number
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pin_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          like_count?: number
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'pin_created' | 'pin_liked' | 'pin_commented' | 'group_invite' | 'group_joined' | 'group_post' | 'system'
          title: string
          message: string | null
          data: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'pin_created' | 'pin_liked' | 'pin_commented' | 'group_invite' | 'group_joined' | 'group_post' | 'system'
          title: string
          message?: string | null
          data?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'pin_created' | 'pin_liked' | 'pin_commented' | 'group_invite' | 'group_joined' | 'group_post' | 'system'
          title?: string
          message?: string | null
          data?: Json
          is_read?: boolean
          created_at?: string
        }
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      pin_reports: {
        Row: {
          id: string
          pin_id: string
          reported_by: string
          reason: string
          description: string | null
          status: string
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pin_id: string
          reported_by: string
          reason: string
          description?: string | null
          status?: string
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pin_id?: string
          reported_by?: string
          reason?: string
          description?: string | null
          status?: string
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          type: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          data?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_moderator_or_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_group_member: {
        Args: {
          user_id: string
          group_id: string
        }
        Returns: boolean
      }
      is_group_admin_or_moderator: {
        Args: {
          user_id: string
          group_id: string
        }
        Returns: boolean
      }
      create_activity: {
        Args: {
          user_id: string
          activity_type: string
          activity_data?: Json
        }
        Returns: string
      }
      create_notification: {
        Args: {
          target_user_id: string
          notification_type: 'pin_created' | 'pin_liked' | 'pin_commented' | 'group_invite' | 'group_joined' | 'group_post' | 'system'
          title: string
          message?: string
          data?: Json
        }
        Returns: string
      }
    }
    Enums: {
      user_role: 'user' | 'moderator' | 'admin'
      pin_category: 'community' | 'faith' | 'projects' | 'economy' | 'events' | 'data_ai' | 'issues' | 'heritage_culture' | 'governance'
      pin_status: 'active' | 'pending' | 'archived' | 'flagged'
      group_role: 'member' | 'moderator' | 'admin'
      notification_type: 'pin_created' | 'pin_liked' | 'pin_commented' | 'group_invite' | 'group_joined' | 'group_post' | 'system'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
