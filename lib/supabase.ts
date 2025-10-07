import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      pins: {
        Row: {
          id: string
          title: string
          description: string | null
          lat: number
          lng: number
          type: string
          category: string | null
          photos: string[] | null
          metadata: Record<string, any> | null
          created_at: string
          created_by: string | null
          likes: number | null
          comments: number | null
          status: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          lat: number
          lng: number
          type: string
          category?: string | null
          photos?: string[] | null
          metadata?: Record<string, any> | null
          created_at?: string
          created_by?: string | null
          likes?: number | null
          comments?: number | null
          status?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          lat?: number
          lng?: number
          type?: string
          category?: string | null
          photos?: string[] | null
          metadata?: Record<string, any> | null
          created_at?: string
          created_by?: string | null
          likes?: number | null
          comments?: number | null
          status?: string
        }
      }
      comments: {
        Row: {
          id: string
          pin_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pin_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pin_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
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
    }
  }
}
