import { createSupabaseClient, subscribeToTable } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import { handleError } from '@/lib/error-handling'

export interface RealtimeSubscription {
  unsubscribe: () => void
}

export interface PinUpdate {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: any
  old: any
}

export interface CommentUpdate {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: any
  old: any
}

export interface NotificationUpdate {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: any
  old: any
}

export interface ActivityUpdate {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: any
  old: any
}

class RealtimeService {
  private supabase = createSupabaseClient()
  private subscriptions: Map<string, RealtimeSubscription> = new Map()

  // Subscribe to pin updates
  subscribeToPins(
    callback: (update: PinUpdate) => void,
    filters?: {
      category?: string
      group_id?: string
      location?: { lat: number; lng: number; radius: number }
    }
  ): RealtimeSubscription {
    const subscriptionId = `pins-${Date.now()}`
    
    let filter = ''
    if (filters?.category) {
      filter += `category=eq.${filters.category}`
    }
    if (filters?.group_id) {
      filter += filter ? `,group_id=eq.${filters.group_id}` : `group_id=eq.${filters.group_id}`
    }

    try {
      const unsubscribe = subscribeToTable(
        this.supabase,
        'pins',
        (payload) => {
          callback({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          })
        },
        filter || undefined
      )

      const subscription = { unsubscribe }
      this.subscriptions.set(subscriptionId, subscription)

      return {
        unsubscribe: () => {
          unsubscribe()
          this.subscriptions.delete(subscriptionId)
        }
      }
    } catch (error: any) {
      handleError(error, 'RealtimeService - subscribeToPins', true)
      return { unsubscribe: () => {} } // Return a no-op unsubscribe on error
    }
  }

  // Subscribe to comments for a specific pin
  subscribeToPinComments(
    pinId: string,
    callback: (update: CommentUpdate) => void
  ): RealtimeSubscription {
    const subscriptionId = `comments-${pinId}-${Date.now()}`
    
    try {
      const unsubscribe = subscribeToTable(
        this.supabase,
        'pin_comments',
        (payload) => {
          callback({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          })
        },
        `pin_id=eq.${pinId}`
      )

      const subscription = { unsubscribe }
      this.subscriptions.set(subscriptionId, subscription)

      return {
        unsubscribe: () => {
          unsubscribe()
          this.subscriptions.delete(subscriptionId)
        }
      }
    } catch (error: any) {
      handleError(error, 'RealtimeService - subscribeToPinComments', true)
      return { unsubscribe: () => {} }
    }
  }

  // Subscribe to user notifications
  subscribeToNotifications(
    userId: string,
    callback: (update: NotificationUpdate) => void
  ): RealtimeSubscription {
    const subscriptionId = `notifications-${userId}-${Date.now()}`
    
    try {
      const unsubscribe = subscribeToTable(
        this.supabase,
        'notifications',
        (payload) => {
          callback({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          })
        },
        `user_id=eq.${userId}`
      )

      const subscription = { unsubscribe }
      this.subscriptions.set(subscriptionId, subscription)

      return {
        unsubscribe: () => {
          unsubscribe()
          this.subscriptions.delete(subscriptionId)
        }
      }
    } catch (error: any) {
      handleError(error, 'RealtimeService - subscribeToNotifications', true)
      return { unsubscribe: () => {} }
    }
  }

  // Subscribe to group activities
  subscribeToGroupActivities(
    groupId: string,
    callback: (update: ActivityUpdate) => void
  ): RealtimeSubscription {
    const subscriptionId = `group-activities-${groupId}-${Date.now()}`
    
    try {
      // Subscribe to pins in the group
      const pinsUnsubscribe = subscribeToTable(
        this.supabase,
        'pins',
        (payload) => {
          if (payload.new?.group_id === groupId || payload.old?.group_id === groupId) {
            callback({
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old
            })
          }
        }
      )

      // Subscribe to group membership changes
      const membershipsUnsubscribe = subscribeToTable(
        this.supabase,
        'group_memberships',
        (payload) => {
          if (payload.new?.group_id === groupId || payload.old?.group_id === groupId) {
            callback({
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old
            })
          }
        }
      )

      const subscription = {
        unsubscribe: () => {
          pinsUnsubscribe()
          membershipsUnsubscribe()
        }
      }
      
      this.subscriptions.set(subscriptionId, subscription)

      return {
        unsubscribe: () => {
          subscription.unsubscribe()
          this.subscriptions.delete(subscriptionId)
        }
      }
    } catch (error: any) {
      handleError(error, 'RealtimeService - subscribeToGroupActivities', true)
      return { unsubscribe: () => {} }
    }
  }

  // Subscribe to user activity feed
  subscribeToActivityFeed(
    userId: string,
    callback: (update: ActivityUpdate) => void
  ): RealtimeSubscription {
    const subscriptionId = `activity-feed-${userId}-${Date.now()}`
    
    try {
      // Get users that this user follows
      this.supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId)
        .then(({ data: follows }) => {
          const followingIds = follows?.map(f => (f as any).following_id) || []
          followingIds.push(userId) // Include own activities

          const unsubscribe = subscribeToTable(
            this.supabase,
            'activities',
            (payload) => {
              if (followingIds.includes(payload.new?.user_id) || followingIds.includes(payload.old?.user_id)) {
                callback({
                  eventType: payload.eventType,
                  new: payload.new,
                  old: payload.old
                })
              }
            }
          )

          const subscription = { unsubscribe }
          this.subscriptions.set(subscriptionId, subscription)
        })

      return {
        unsubscribe: () => {
          const subscription = this.subscriptions.get(subscriptionId)
          if (subscription) {
            subscription.unsubscribe()
            this.subscriptions.delete(subscriptionId)
          }
        }
      }
    } catch (error: any) {
      handleError(error, 'RealtimeService - subscribeToActivityFeed', true)
      return { unsubscribe: () => {} }
    }
  }

  // Subscribe to map updates (pins in viewport)
  subscribeToMapUpdates(
    bounds: {
      north: number
      south: number
      east: number
      west: number
    },
    callback: (update: PinUpdate) => void
  ): RealtimeSubscription {
    const subscriptionId = `map-updates-${Date.now()}`
    
    try {
      const unsubscribe = subscribeToTable(
        this.supabase,
        'pins',
        async (payload) => {
          // Check if the pin is within the bounds
          let isInBounds = false
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const pin = payload.new
            if (pin.location) {
              // Parse PostGIS POINT format
              const match = pin.location.match(/POINT\(([^)]+)\)/)
              if (match) {
                const [lng, lat] = match[1].split(' ').map(Number)
                isInBounds = lat >= bounds.south && lat <= bounds.north && 
                            lng >= bounds.west && lng <= bounds.east
              }
            }
          } else if (payload.eventType === 'DELETE') {
            // For deletions, we always notify to remove from map
            isInBounds = true
          }

          if (isInBounds) {
            callback({
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old
            })
          }
        }
      )

      const subscription = { unsubscribe }
      this.subscriptions.set(subscriptionId, subscription)

      return {
        unsubscribe: () => {
          unsubscribe()
          this.subscriptions.delete(subscriptionId)
        }
      }
    } catch (error: any) {
      handleError(error, 'RealtimeService - subscribeToMapUpdates', true)
      return { unsubscribe: () => {} }
    }
  }

  // Subscribe to presence (online users)
  subscribeToPresence(
    channel: string,
    callback: (presenceState: any) => void
  ): RealtimeSubscription {
    const subscriptionId = `presence-${channel}-${Date.now()}`
    
    try {
      const presenceChannel = this.supabase.channel(channel)
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState()
          callback(state)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          callback({ type: 'join', key, newPresences })
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          callback({ type: 'leave', key, leftPresences })
        })
        .subscribe()

      const subscription = {
        unsubscribe: () => {
          this.supabase.removeChannel(presenceChannel)
        }
      }
      
      this.subscriptions.set(subscriptionId, subscription)

      return {
        unsubscribe: () => {
          subscription.unsubscribe()
          this.subscriptions.delete(subscriptionId)
        }
      }
    } catch (error: any) {
      handleError(error, 'RealtimeService - subscribeToPresence', true)
      return { unsubscribe: () => {} }
    }
  }

  // Track user presence
  async trackPresence(
    channel: string,
    userInfo: {
      user_id: string
      username?: string
      avatar_url?: string
      status?: string
    }
  ): Promise<RealtimeSubscription> {
    const subscriptionId = `presence-track-${channel}-${Date.now()}`
    
    try {
      const presenceChannel = this.supabase.channel(channel)
      
      await presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            ...userInfo,
            online_at: new Date().toISOString()
          })
        }
      })

      const subscription = {
        unsubscribe: async () => {
          await presenceChannel.untrack()
          this.supabase.removeChannel(presenceChannel)
        }
      }
      
      this.subscriptions.set(subscriptionId, subscription)

      return {
        unsubscribe: () => {
          const sub = this.subscriptions.get(subscriptionId)
          if (sub) {
            sub.unsubscribe()
            this.subscriptions.delete(subscriptionId)
          }
        }
      }
    } catch (error: any) {
      handleError(error, 'RealtimeService - trackPresence', true)
      return { unsubscribe: () => {} }
    }
  }

  // Send real-time message
  async sendMessage(
    channel: string,
    event: string,
    payload: any
  ): Promise<void> {
    try {
      const messageChannel = this.supabase.channel(channel)
      
      await messageChannel.subscribe()
      await messageChannel.send({
        type: 'broadcast',
        event,
        payload
      })
      
      this.supabase.removeChannel(messageChannel)
    } catch (error: any) {
      handleError(error, 'RealtimeService - sendMessage', true)
    }
  }

  // Subscribe to real-time messages
  subscribeToMessages(
    channel: string,
    event: string,
    callback: (payload: any) => void
  ): RealtimeSubscription {
    const subscriptionId = `messages-${channel}-${event}-${Date.now()}`
    
    try {
      const messageChannel = this.supabase.channel(channel)
        .on('broadcast', { event }, ({ payload }) => {
          callback(payload)
        })
        .subscribe()

      const subscription = {
        unsubscribe: () => {
          this.supabase.removeChannel(messageChannel)
        }
      }
      
      this.subscriptions.set(subscriptionId, subscription)

      return {
        unsubscribe: () => {
          subscription.unsubscribe()
          this.subscriptions.delete(subscriptionId)
        }
      }
    } catch (error: any) {
      handleError(error, 'RealtimeService - subscribeToMessages', true)
      return { unsubscribe: () => {} }
    }
  }

  // Cleanup all subscriptions
  cleanup(): void {
    try {
      this.subscriptions.forEach(subscription => {
        subscription.unsubscribe()
      })
      this.subscriptions.clear()
    } catch (error: any) {
      handleError(error, 'RealtimeService - cleanup', false) // Don't show toast for cleanup errors
    }
  }

  // Get active subscription count
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size
  }

  // Check if subscription exists
  hasSubscription(pattern: string): boolean {
    for (const key of this.subscriptions.keys()) {
      if (key.includes(pattern)) {
        return true
      }
    }
    return false
  }
}

export const realtimeService = new RealtimeService()
export default realtimeService
