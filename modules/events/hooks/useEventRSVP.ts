/**
 * Hook for managing event RSVPs
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/error-handling'
import { useFeedback } from '@/lib/user-feedback'
import type {
  EventRSVP,
  CreateRSVPData,
  UpdateRSVPData,
  RSVPSummary,
  RSVPStatus
} from '../types'

export function useEventRSVP(eventId?: string) {
  const [rsvps, setRSVPs] = useState<EventRSVP[]>([])
  const [userRSVP, setUserRSVP] = useState<EventRSVP | null>(null)
  const [rsvpSummary, setRSVPSummary] = useState<RSVPSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const feedback = useFeedback()

  const fetchRSVPs = useCallback(async (targetEventId?: string) => {
    if (!targetEventId && !eventId) return

    try {
      setLoading(true)
      setError(null)

      const id = targetEventId || eventId!

      // Fetch all RSVPs for the event
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          user_profile:user_id(id, name, avatar_url)
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: false })

      if (rsvpError) throw rsvpError

      setRSVPs(rsvpData || [])

      // Check if current user has RSVP'd
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const currentUserRSVP = rsvpData?.find(rsvp => rsvp.user_id === user.id)
        setUserRSVP(currentUserRSVP || null)
      }

      // Calculate RSVP summary
      const summary = calculateRSVPSummary(rsvpData || [])
      setRSVPSummary(summary)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch RSVPs'
      setError(errorMessage)
      handleError(err as Error, 'useEventRSVP.fetchRSVPs')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  const createOrUpdateRSVP = useCallback(async (rsvpData: CreateRSVPData) => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        feedback.authRequired()
        throw new Error('Authentication required')
      }

      // Check if user has already RSVP'd
      const { data: existingRSVP } = await supabase
        .from('event_rsvps')
        .select('id')
        .eq('event_id', rsvpData.event_id)
        .eq('user_id', user.id)
        .single()

      if (existingRSVP) {
        // Update existing RSVP
        const { data, error } = await supabase
          .from('event_rsvps')
          .update({
            status: rsvpData.status,
            guests_count: rsvpData.guests_count || 0,
            dietary_requirements: rsvpData.dietary_requirements,
            accessibility_needs: rsvpData.accessibility_needs,
            notes: rsvpData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRSVP.id)
          .select(`
            *,
            user_profile:user_id(id, name, avatar_url)
          `)
          .single()

        if (error) throw error

        setUserRSVP(data)
        feedback.success('RSVP updated successfully')
      } else {
        // Create new RSVP
        const { data, error } = await supabase
          .from('event_rsvps')
          .insert([{
            ...rsvpData,
            user_id: user.id,
            guests_count: rsvpData.guests_count || 0
          }])
          .select(`
            *,
            user_profile:user_id(id, name, avatar_url)
          `)
          .single()

        if (error) throw error

        setUserRSVP(data)
        feedback.success(`RSVP confirmed as "${rsvpData.status}"`)
      }

      // Refresh RSVPs and update event attendee count
      await fetchRSVPs(rsvpData.event_id)
      await updateEventAttendeeCount(rsvpData.event_id)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update RSVP'
      handleError(err as Error, 'useEventRSVP.createOrUpdateRSVP')
      feedback.error('Failed to update RSVP', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback, fetchRSVPs])

  const removeRSVP = useCallback(async (eventId: string) => {
    try {
      setLoading(true)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

      if (error) throw error

      setUserRSVP(null)
      feedback.success('RSVP removed successfully')

      // Refresh RSVPs and update event attendee count
      await fetchRSVPs(eventId)
      await updateEventAttendeeCount(eventId)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove RSVP'
      handleError(err as Error, 'useEventRSVP.removeRSVP')
      feedback.error('Failed to remove RSVP', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback, fetchRSVPs])

  // Helper function to update event attendee count
  const updateEventAttendeeCount = useCallback(async (eventId: string) => {
    try {
      // Get current RSVP count for "going" status
      const { data: goingRSVPs } = await supabase
        .from('event_rsvps')
        .select('guests_count')
        .eq('event_id', eventId)
        .eq('status', 'going')

      if (!goingRSVPs) return

      const totalAttendees = goingRSVPs.reduce((sum, rsvp) => sum + (rsvp.guests_count || 0) + 1, 0)

      // Update event attendee count
      await supabase
        .from('community_events')
        .update({ current_attendees: totalAttendees })
        .eq('id', eventId)

    } catch (err) {
      console.error('Failed to update event attendee count:', err)
    }
  }, [])

  useEffect(() => {
    if (eventId) {
      fetchRSVPs()

      // Subscribe to real-time RSVP updates
      const subscription = supabase
        .channel(`rsvps_${eventId}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_rsvps',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            fetchRSVPs()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [eventId, fetchRSVPs])

  return {
    rsvps,
    userRSVP,
    rsvpSummary,
    loading,
    error,
    createOrUpdateRSVP,
    removeRSVP,
    refetch: () => fetchRSVPs()
  }
}

// Helper function to calculate RSVP summary
function calculateRSVPSummary(rsvps: EventRSVP[]): RSVPSummary {
  const going = rsvps.filter(r => r.status === 'going').length
  const maybe = rsvps.filter(r => r.status === 'maybe').length
  const notGoing = rsvps.filter(r => r.status === 'not_going').length
  const totalGuests = rsvps
    .filter(r => r.status === 'going')
    .reduce((sum, r) => sum + (r.guests_count || 0), 0)

  return {
    going,
    maybe,
    not_going: notGoing,
    total: rsvps.length,
    total_guests: totalGuests
  }
}
