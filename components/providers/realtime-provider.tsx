/**
 * Realtime Provider
 * Manages real-time subscriptions and notifications across the application
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import realtimeService, { RealtimeSubscription } from '@/lib/services/realtime-service'
import notificationService, { Notification } from '@/lib/services/notification-service'
import { toast } from 'sonner'
import { handleError } from '@/lib/error-handling'

interface RealtimeContextType {
  isConnected: boolean
  notifications: Notification[]
  unreadCount: number
  subscribeToMapUpdates: (bounds: any, callback: any) => RealtimeSubscription
  subscribeToGroupActivities: (groupId: string, callback: any) => RealtimeSubscription
  markNotificationAsRead: (notificationId: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

interface RealtimeProviderProps {
  children: ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, isAuthenticated } = useAuth()

  // Initialize real-time connection and notifications
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsConnected(false)
      setNotifications([])
      setUnreadCount(0)
      return
    }

    let notificationSubscription: RealtimeSubscription | null = null

    const initializeRealtime = async () => {
      try {
        // Load initial notifications
        const { notifications: initialNotifications, unread_count } = await notificationService.getNotifications(user.id, {
          limit: 50
        })
        
        setNotifications(initialNotifications)
        setUnreadCount(unread_count)

        // Subscribe to new notifications
        notificationSubscription = realtimeService.subscribeToNotifications(user.id, (update) => {
          if (update.eventType === 'INSERT' && update.new) {
            const notification = update.new as Notification
            setNotifications(prev => [notification, ...prev])
            setUnreadCount(prev => prev + 1)

            // Show toast notification
            toast.info(notification.title, {
              description: notification.message,
              action: {
                label: 'View',
                onClick: () => {
                  // Handle notification click
                  markNotificationAsRead(notification.id)
              }
            }
          })

            // Send push notification if supported
            notificationService.sendPushNotification(user.id, {
              title: notification.title,
              body: notification.message || '',
              data: notification.data
            })
          }
        })

        setIsConnected(true)
      } catch (error: any) {
        handleError(error, 'RealtimeProvider - initializeRealtime', true)
        setIsConnected(false)
      }
    }

    initializeRealtime()

    return () => {
      if (notificationSubscription) {
        notificationSubscription.unsubscribe()
      }
      setIsConnected(false)
    }
  }, [isAuthenticated, user])

  // Request notification permission on mount
  useEffect(() => {
    if (isAuthenticated) {
      notificationService.requestNotificationPermission()
    }
  }, [isAuthenticated])

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error: any) {
      handleError(error, 'RealtimeProvider - markNotificationAsRead', true)
    }
  }

  const markAllNotificationsAsRead = async () => {
    if (!user) return

    try {
      await notificationService.markAllAsRead(user.id)
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
      
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error: any) {
      handleError(error, 'RealtimeProvider - markAllNotificationsAsRead', true)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId)
      
      const notification = notifications.find(n => n.id === notificationId)
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      toast.success('Notification deleted')
    } catch (error: any) {
      handleError(error, 'RealtimeProvider - deleteNotification', true)
    }
  }

  const subscribeToMapUpdates = (bounds: any, callback: any) => {
    return realtimeService.subscribeToMapUpdates(bounds, callback)
  }

  const subscribeToGroupActivities = (groupId: string, callback: any) => {
    return realtimeService.subscribeToGroupActivities(groupId, callback)
  }

  const value: RealtimeContextType = {
    isConnected,
    notifications,
    unreadCount,
    subscribeToMapUpdates,
    subscribeToGroupActivities,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime(): RealtimeContextType {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

// Hook for connection status
export function useRealtimeConnection() {
  const { isConnected } = useRealtime()
  return isConnected
}

// Hook for notifications
export function useNotifications() {
  const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = useRealtime()
  
  return {
    notifications,
    unreadCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification
  }
}

// Hook for map real-time updates
export function useMapRealtime() {
  const { subscribeToMapUpdates } = useRealtime()
  return { subscribeToMapUpdates }
}

// Hook for group real-time updates
export function useGroupRealtime() {
  const { subscribeToGroupActivities } = useRealtime()
  return { subscribeToGroupActivities }
}

export default RealtimeContext
