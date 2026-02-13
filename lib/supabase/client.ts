/**
 * Supabase Client Configuration
 * Production-ready client with proper error handling and type safety
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { handleError } from '@/lib/error-handling'

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client
export const createSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

// Admin client for server-side operations
export const createSupabaseAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Storage configuration
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  PIN_IMAGES: 'pin-images',
  GROUP_IMAGES: 'group-images'
} as const

// Real-time channel configuration
export const REALTIME_CHANNELS = {
  PINS: 'pins',
  COMMENTS: 'comments',
  NOTIFICATIONS: 'notifications',
  ACTIVITIES: 'activities'
} as const

// Error handling utility
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

// Helper function to handle Supabase responses
export function handleSupabaseResponse<T>(response: {
  data: T | null
  error: any
}): T {
  if (response.error) {
    throw new SupabaseError(
      response.error.message,
      response.error.code,
      response.error.details
    )
  }
  
  if (response.data === null) {
    throw new SupabaseError('No data returned from query')
  }
  
  return response.data
}

// Helper function for async Supabase operations with error handling
export async function withSupabaseErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  try {
    const response = await operation()
    return handleSupabaseResponse(response)
  } catch (error: any) {
    if (error instanceof SupabaseError) {
      handleError(error, 'Supabase Operation', true)
      throw error
    }
    const genericError = new SupabaseError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    )
    handleError(genericError, 'Supabase Operation', true)
    throw genericError
  }
}

// Pagination helper
export interface PaginationOptions {
  page?: number
  limit?: number
  orderBy?: string
  ascending?: boolean
}

export function buildPaginationQuery(
  query: any,
  options: PaginationOptions = {}
) {
  const { page = 1, limit = 20, orderBy = 'created_at', ascending = false } = options
  
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  return query
    .order(orderBy, { ascending })
    .range(from, to)
}

// File upload helper
export async function uploadFile(
  supabase: ReturnType<typeof createSupabaseClient>,
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string
    contentType?: string
    upsert?: boolean
  }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType || file.type,
      upsert: options?.upsert || false
    })
  
  if (error) {
    throw new SupabaseError(`File upload failed: ${error.message}`)
  }
  
  return data
}

// Get public URL for uploaded file
export function getPublicUrl(
  supabase: ReturnType<typeof createSupabaseClient>,
  bucket: string,
  path: string
) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

// Real-time subscription helper
export function subscribeToTable<T = any>(
  supabase: ReturnType<typeof createSupabaseClient>,
  table: string,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: T
    old: T
  }) => void,
  filter?: string
) {
  const channel = (supabase as any)
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter
      },
      callback
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}

// Batch operations helper
export async function batchOperation<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 10
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(op => op()))
    results.push(...batchResults)
  }
  
  return results
}

// Geographic query helpers
export function buildLocationQuery(
  query: any,
  center: { lat: number; lng: number },
  radiusKm: number
) {
  return query.rpc('pins_within_radius', {
    center_lat: center.lat,
    center_lng: center.lng,
    radius_km: radiusKm
  })
}

// Search helper
export function buildSearchQuery(
  query: any,
  searchTerm: string,
  columns: string[] = ['title', 'description']
) {
  const searchQuery = columns
    .map(col => `${col}.ilike.%${searchTerm}%`)
    .join(',')
  
  return query.or(searchQuery)
}

// Type-safe query builder
export class QueryBuilder<T> {
  constructor(private query: any) {}
  
  select(columns?: string) {
    return new QueryBuilder<T>(this.query.select(columns))
  }
  
  filter(column: string, operator: string, value: any) {
    return new QueryBuilder<T>(this.query.filter(column, operator, value))
  }
  
  order(column: string, ascending = true) {
    return new QueryBuilder<T>(this.query.order(column, { ascending }))
  }
  
  limit(count: number) {
    return new QueryBuilder<T>(this.query.limit(count))
  }
  
  range(from: number, to: number) {
    return new QueryBuilder<T>(this.query.range(from, to))
  }
  
  async execute(): Promise<T[]> {
    const { data, error } = await this.query
    
    if (error) {
      throw new SupabaseError(error.message, error.code, error.details)
    }
    
    return data || []
  }
  
  async single(): Promise<T> {
    const { data, error } = await this.query.single()
    
    if (error) {
      throw new SupabaseError(error.message, error.code, error.details)
    }
    
    return data
  }
}

// Create typed query builder
export function createQuery<T>(query: any): QueryBuilder<T> {
  return new QueryBuilder<T>(query)
}
