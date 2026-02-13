'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Pin, MapFilters, BoundingBox, PinSubscriptionPayload } from '@/types/silas'
import { ErrorTracker, PerformanceTracker } from '@/lib/monitoring'
import { useAuth } from '@/contexts/AuthContext'

interface UseRealtimePinsOptions {
  filters: MapFilters
  boundingBox?: BoundingBox
  enabled?: boolean
  onPinAdded?: (pin: Pin) => void
  onPinUpdated?: (pin: Pin) => void
  onPinDeleted?: (pinId: string) => void
}

interface UseRealtimePinsReturn {
  pins: Pin[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  addOptimisticPin: (pin: Partial<Pin>) => string
  updateOptimisticPin: (id: string, updates: Partial<Pin>) => void
  removeOptimisticPin: (id: string) => void
}

export function useRealtimePins({
  filters,
  boundingBox,
  enabled = true,
  onPinAdded,
  onPinUpdated,
  onPinDeleted
}: UseRealtimePinsOptions): UseRealtimePinsReturn {
  const { user } = useAuth()
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for stable references
  const channelRef = useRef<RealtimeChannel | null>(null)
  const optimisticPinsRef = useRef<Map<string, Pin>>(new Map())
  const lastFetchRef = useRef<number>(0)

  // Generate optimistic ID
  const generateOptimisticId = useCallback(() => {
    return `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Fetch pins from database
  const fetchPins = useCallback(async () => {
    if (!enabled) return

    try {
      PerformanceTracker.startTiming('realtime-pin-fetch')
      setError(null)

      // Build query
      let query = supabase
        .from('pins')
        .select(`
          *,
          author:profiles(id, display_name, role, verified),
          project:projects(id, name, status),
          group:groups(id, name, public)
        `)

      // Apply bounding box filter
      if (boundingBox) {
        query = query
          .gte('geom->coordinates->1', boundingBox.south)
          .lte('geom->coordinates->1', boundingBox.north)
          .gte('geom->coordinates->0', boundingBox.west)
          .lte('geom->coordinates->0', boundingBox.east)
      }

      // Apply status filter
      if (filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      // Apply category filter
      if (filters.categories.length > 0) {
        query = query.overlaps('categories', filters.categories)
      }

      // Apply author type filter
      if (filters.author_type.length > 0) {
        query = query.in('author_type', filters.author_type)
      }

      // Apply search query
      if (filters.search_query) {
        query = query.or(`title.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`)
      }

      // Apply date range filter
      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end)
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false })

      // Limit for performance
      query = query.limit(1000)

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // Merge with optimistic pins
      const optimisticPins = Array.from(optimisticPinsRef.current.values())
      const allPins = [...(data || []), ...optimisticPins]

      // Remove duplicates (optimistic pins override real ones)
      const uniquePins = allPins.reduce((acc, pin) => {
        acc.set(pin.id, pin)
        return acc
      }, new Map<string, Pin>())

      setPins(Array.from(uniquePins.values()))
      lastFetchRef.current = Date.now()
      
      PerformanceTracker.endTiming('realtime-pin-fetch')
      PerformanceTracker.measurePinLoad(data?.length || 0)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pins'
      setError(errorMessage)
      ErrorTracker.logCustomError('Realtime pin fetch failed', { error: err, filters })
    } finally {
      setLoading(false)
    }
  }, [enabled, boundingBox, filters])

  // Set up real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!enabled || channelRef.current) return

    try {
      const channel = supabase
        .channel('pins-realtime')
        .on(
          'postgres_changes' as any,
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pins'
          },
          (payload: PinSubscriptionPayload) => {
            if (payload.new) {
              const newPin = payload.new as Pin
              
              // Remove optimistic version if exists
              optimisticPinsRef.current.delete(newPin.id)
              
              // Add to pins list
              setPins(prev => {
                const exists = prev.find(p => p.id === newPin.id)
                if (exists) return prev
                return [newPin, ...prev]
              })

              onPinAdded?.(newPin)
            }
          }
        )
        .on(
          'postgres_changes' as any,
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pins'
          },
          (payload: PinSubscriptionPayload) => {
            if (payload.new) {
              const updatedPin = payload.new as Pin
              
              // Remove optimistic version if exists
              optimisticPinsRef.current.delete(updatedPin.id)
              
              // Update pins list
              setPins(prev => prev.map(pin => 
                pin.id === updatedPin.id ? updatedPin : pin
              ))

              onPinUpdated?.(updatedPin)
            }
          }
        )
        .on(
          'postgres_changes' as any,
          {
            event: 'DELETE',
            schema: 'public',
            table: 'pins'
          },
          (payload: PinSubscriptionPayload) => {
            if (payload.old) {
              const deletedPin = payload.old as Pin
              
              // Remove from pins list
              setPins(prev => prev.filter(pin => pin.id !== deletedPin.id))
              
              // Remove optimistic version if exists
              optimisticPinsRef.current.delete(deletedPin.id)

              onPinDeleted?.(deletedPin.id)
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime subscription established')
          } else if (status === 'CHANNEL_ERROR') {
            ErrorTracker.logCustomError('Realtime subscription error', { status })
          }
        })

      channelRef.current = channel

    } catch (error) {
      ErrorTracker.logCustomError('Realtime subscription setup failed', { error })
    }
  }, [enabled, onPinAdded, onPinUpdated, onPinDeleted])

  // Cleanup subscription
  const cleanupSubscription = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
  }, [])

  // Optimistic updates
  const addOptimisticPin = useCallback((pinData: Partial<Pin>): string => {
    const optimisticId = generateOptimisticId()
    const optimisticPin: Pin = {
      id: optimisticId,
      title: pinData.title || 'New Pin',
      description: pinData.description || null,
      categories: pinData.categories || ['community'],
      project_id: pinData.project_id || null,
      group_id: pinData.group_id || null,
      author_type: pinData.author_type || 'individual',
      geom: pinData.geom || { type: 'Point', coordinates: [0, 0] },
      status: 'draft',
      metadata: pinData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...pinData
    }

    optimisticPinsRef.current.set(optimisticId, optimisticPin)
    setPins(prev => [optimisticPin, ...prev])

    return optimisticId
  }, [generateOptimisticId])

  const updateOptimisticPin = useCallback((id: string, updates: Partial<Pin>) => {
    const existingPin = optimisticPinsRef.current.get(id)
    if (existingPin) {
      const updatedPin = { ...existingPin, ...updates, updated_at: new Date().toISOString() }
      optimisticPinsRef.current.set(id, updatedPin)
      setPins(prev => prev.map(pin => pin.id === id ? updatedPin : pin))
    }
  }, [])

  const removeOptimisticPin = useCallback((id: string) => {
    optimisticPinsRef.current.delete(id)
    setPins(prev => prev.filter(pin => pin.id !== id))
  }, [])

  // Initial fetch and subscription setup
  useEffect(() => {
    if (enabled) {
      fetchPins()
      setupRealtimeSubscription()
    }

    return cleanupSubscription
  }, [enabled, fetchPins, setupRealtimeSubscription, cleanupSubscription])

  // Refetch when filters change
  useEffect(() => {
    if (enabled) {
      fetchPins()
    }
  }, [filters, boundingBox, fetchPins])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscription()
      optimisticPinsRef.current.clear()
    }
  }, [cleanupSubscription])

  return {
    pins,
    loading,
    error,
    refetch: fetchPins,
    addOptimisticPin,
    updateOptimisticPin,
    removeOptimisticPin
  }
}

// Hook for single pin real-time updates
export function useRealtimePin(pinId: string) {
  const [pin, setPin] = useState<Pin | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPin = useCallback(async () => {
    if (!pinId) return

    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('pins')
        .select(`
          *,
          author:profiles(id, display_name, role, verified),
          project:projects(id, name, status),
          group:groups(id, name, public)
        `)
        .eq('id', pinId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      setPin(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pin'
      setError(errorMessage)
      ErrorTracker.logCustomError('Single pin fetch failed', { error: err, pinId })
    } finally {
      setLoading(false)
    }
  }, [pinId])

  useEffect(() => {
    fetchPin()

    // Set up real-time subscription for this specific pin
    const channel = supabase
      .channel(`pin-${pinId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pins',
          filter: `id=eq.${pinId}`
        },
        (payload) => {
          if (payload.new) {
            setPin(payload.new as Pin)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [pinId, fetchPin])

  return { pin, loading, error, refetch: fetchPin }
}
