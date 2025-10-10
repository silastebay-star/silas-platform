/**
 * Hook for managing community events
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/error-handling'
import { useFeedback } from '@/lib/user-feedback'
import type {
  CommunityEvent,
  CreateEventData,
  UpdateEventData,
  EventFilters,
  EventMetrics
} from '../types'

export function useEvents(filters?: EventFilters) {
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [metrics, setMetrics] = useState<EventMetrics | null>(null)
  const feedback = useFeedback()

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('community_events')
        .select(`
          *,
          creator_profile:created_by(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address),
          category_info:event_categories!inner(id, name, color, icon)
        `, { count: 'exact' })

      // Apply filters
      if (filters?.category?.length) {
        query = query.in('category', filters.category)
      }
      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      }
      if (filters?.start_date) {
        query = query.gte('start_time', filters.start_date)
      }
      if (filters?.end_date) {
        query = query.lte('start_time', filters.end_date)
      }
      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by)
      }
      if (filters?.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public)
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'start_time'
      const sortOrder = filters?.sort_order || 'asc'
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

      // Enhance events with computed fields
      const enhancedEvents = (data || []).map(enhanceEvent)

      setEvents(enhancedEvents)
      setTotalCount(count || 0)

      // Fetch metrics if no filters applied (for dashboard)
      if (!filters || Object.keys(filters).length === 0) {
        await fetchMetrics()
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events'
      setError(errorMessage)
      handleError(err as Error, 'useEvents.fetchEvents')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchMetrics = useCallback(async () => {
    try {
      // Get event statistics
      const { data: eventStats, error: statsError } = await supabase
        .rpc('get_event_metrics')

      if (statsError) {
        console.warn('Failed to fetch event metrics:', statsError)
        return
      }

      setMetrics(eventStats)
    } catch (err) {
      console.warn('Error fetching event metrics:', err)
    }
  }, [])

  const createEvent = useCallback(async (eventData: CreateEventData) => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        feedback.authRequired()
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('community_events')
        .insert([{
          ...eventData,
          created_by: user.id,
          current_attendees: 0,
          status: 'active'
        }])
        .select(`
          *,
          creator_profile:created_by(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address),
          category_info:event_categories!inner(id, name, color, icon)
        `)
        .single()

      if (error) throw error

      const enhancedEvent = enhanceEvent(data)
      setEvents(prev => [enhancedEvent, ...prev])

      feedback.success('Event created successfully!', {
        description: `"${data.title}" has been created and is now live`
      })

      return enhancedEvent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event'
      handleError(err as Error, 'useEvents.createEvent')
      feedback.error('Failed to create event', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const updateEvent = useCallback(async (id: string, updates: UpdateEventData) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('community_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          creator_profile:created_by(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address),
          category_info:event_categories!inner(id, name, color, icon)
        `)
        .single()

      if (error) throw error

      const enhancedEvent = enhanceEvent(data)
      setEvents(prev => prev.map(e => e.id === id ? enhancedEvent : e))

      feedback.success('Event updated successfully')
      return enhancedEvent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event'
      handleError(err as Error, 'useEvents.updateEvent')
      feedback.error('Failed to update event', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const deleteEvent = useCallback(async (id: string) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('community_events')
        .delete()
        .eq('id', id)

      if (error) throw error

      setEvents(prev => prev.filter(e => e.id !== id))
      feedback.success('Event deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event'
      handleError(err as Error, 'useEvents.deleteEvent')
      feedback.error('Failed to delete event', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  useEffect(() => {
    fetchEvents()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('events_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'community_events' },
        () => {
          fetchEvents()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_rsvps' },
        () => {
          // Refresh events when RSVPs change to update attendee counts
          fetchEvents()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchEvents])

  return {
    events,
    loading,
    error,
    totalCount,
    metrics,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  }
}

// Helper function to enhance events with computed fields
function enhanceEvent(event: any): CommunityEvent {
  const now = new Date()
  const startTime = new Date(event.start_time)
  const endTime = new Date(event.end_time)

  return {
    ...event,
    is_past: endTime < now,
    is_today: startTime.toDateString() === now.toDateString(),
    is_upcoming: startTime > now,
    duration_hours: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 10) / 10,
    attendee_percentage: event.max_attendees > 0
      ? Math.round((event.current_attendees / event.max_attendees) * 100)
      : 0
  }
}
