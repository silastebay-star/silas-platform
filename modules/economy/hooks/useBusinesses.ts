/**
 * Hook for managing local businesses
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/error-handling'
import { useFeedback } from '@/lib/user-feedback'
import type {
  LocalBusiness,
  CreateBusinessData,
  UpdateBusinessData,
  BusinessFilters,
  EconomyMetrics
} from '../types'

export function useBusinesses(filters?: BusinessFilters) {
  const [businesses, setBusinesses] = useState<LocalBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [metrics, setMetrics] = useState<EconomyMetrics | null>(null)
  const feedback = useFeedback()

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('local_businesses')
        .select(`
          *,
          owner_profile:owner_id(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address),
          category_info:business_categories!inner(id, name, color, icon)
        `, { count: 'exact' })

      // Apply filters
      if (filters?.category?.length) {
        query = query.in('category', filters.category)
      }
      if (filters?.subcategory?.length) {
        query = query.in('subcategory', filters.subcategory)
      }
      if (filters?.verified !== undefined) {
        query = query.eq('verified', filters.verified)
      }
      if (filters?.rating_min) {
        query = query.gte('rating', filters.rating_min)
      }
      if (filters?.price_range?.length) {
        query = query.in('price_range', filters.price_range)
      }
      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      } else {
        // Default to active businesses only
        query = query.eq('status', 'active')
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'created_at'
      const sortOrder = filters?.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      // Enhance businesses with computed fields
      const enhancedBusinesses = (data || []).map(enhanceBusiness)

      setBusinesses(enhancedBusinesses)
      setTotalCount(count || 0)

      // Fetch metrics if no filters applied (for dashboard)
      if (!filters || Object.keys(filters).length === 0) {
        await fetchMetrics()
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch businesses'
      setError(errorMessage)
      handleError(err as Error, 'useBusinesses.fetchBusinesses')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchMetrics = useCallback(async () => {
    try {
      // Get business statistics
      const { data: businessStats, error: statsError } = await supabase
        .rpc('get_economy_metrics')

      if (statsError) {
        console.warn('Failed to fetch economy metrics:', statsError)
        return
      }

      setMetrics(businessStats)
    } catch (err) {
      console.warn('Error fetching economy metrics:', err)
    }
  }, [])

  const createBusiness = useCallback(async (businessData: CreateBusinessData) => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        feedback.authRequired()
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('local_businesses')
        .insert([{
          ...businessData,
          owner_id: user.id,
          status: 'pending', // Require approval for new businesses
          verified: false,
          rating: 0,
          review_count: 0,
          features: businessData.features || [],
          images: businessData.images || []
        }])
        .select(`
          *,
          owner_profile:owner_id(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address),
          category_info:business_categories!inner(id, name, color, icon)
        `)
        .single()

      if (error) throw error

      const enhancedBusiness = enhanceBusiness(data)
      setBusinesses(prev => [enhancedBusiness, ...prev])

      feedback.success('Business submitted successfully!', {
        description: `"${data.name}" has been submitted for review and will be visible once approved`
      })

      return enhancedBusiness
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create business'
      handleError(err as Error, 'useBusinesses.createBusiness')
      feedback.error('Failed to create business', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const updateBusiness = useCallback(async (id: string, updates: UpdateBusinessData) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('local_businesses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          owner_profile:owner_id(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address),
          category_info:business_categories!inner(id, name, color, icon)
        `)
        .single()

      if (error) throw error

      const enhancedBusiness = enhanceBusiness(data)
      setBusinesses(prev => prev.map(b => b.id === id ? enhancedBusiness : b))

      feedback.success('Business updated successfully')
      return enhancedBusiness
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update business'
      handleError(err as Error, 'useBusinesses.updateBusiness')
      feedback.error('Failed to update business', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const deleteBusiness = useCallback(async (id: string) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('local_businesses')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBusinesses(prev => prev.filter(b => b.id !== id))
      feedback.success('Business deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete business'
      handleError(err as Error, 'useBusinesses.deleteBusiness')
      feedback.error('Failed to delete business', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  useEffect(() => {
    fetchBusinesses()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('businesses_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'local_businesses' },
        () => {
          fetchBusinesses()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'business_reviews' },
        () => {
          // Refresh businesses when reviews change to update ratings
          fetchBusinesses()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchBusinesses])

  return {
    businesses,
    loading,
    error,
    totalCount,
    metrics,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    refetch: fetchBusinesses
  }
}

// Helper function to enhance businesses with computed fields
function enhanceBusiness(business: any): LocalBusiness {
  const now = new Date()
  const openingHours = business.opening_hours || {}

  // Calculate if business is currently open
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() // monday, tuesday, etc.
  const currentTime = now.toTimeString().substring(0, 5) // HH:MM
  const todayHours = openingHours[currentDay]

  let isOpen = false
  let nextOpening = ''

  if (todayHours && !todayHours.closed) {
    isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close
    if (!isOpen && currentTime < todayHours.open) {
      nextOpening = `Opens at ${todayHours.open} today`
    }
  }

  return {
    ...business,
    is_open: isOpen,
    next_opening: nextOpening,
    average_rating: business.rating || 0
  }
}
