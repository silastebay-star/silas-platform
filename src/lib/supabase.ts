import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      pins: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          lat: number;
          lng: number;
          type: string;
          category: string | null;
          photos: string[] | null;
          metadata: Record<string, any> | null;
          created_at: string;
          created_by: string | null;
          likes: number | null;
          comments: number | null;
          status: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          lat: number;
          lng: number;
          type: string;
          category?: string | null;
          photos?: string[] | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          created_by?: string | null;
          likes?: number | null;
          comments?: number | null;
          status?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          lat?: number;
          lng?: number;
          type?: string;
          category?: string | null;
          photos?: string[] | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          created_by?: string | null;
          likes?: number | null;
          comments?: number | null;
          status?: string;
        };
      };
    };
  };
}
