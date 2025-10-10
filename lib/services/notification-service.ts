import { createSupabaseClient, withSupabaseErrorHandling, SupabaseError } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import realtimeService, { RealtimeSubscription } from './realtime-service'
import { handleError } from '@/lib/error-handling'

export type NotificationType = 'pin_created' | 'pin_liked' | 'pin_commented' | 'group_invite' | 'group_joined' | 'group_post' | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string | null
  data: Record<string, any>
  is_read: boolean
  created_at: string
}

export interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  pin_likes: boolean
  pin_comments: boolean
  group_invites: boolean
  group_posts: boolean
  system_updates: boolean
  digest_frequency: 'never' | 'daily' | 'weekly'
}

export interface CreateNotificationData {
  user_id: string
  type: NotificationType
  title: string
  message?: string
  data?: Record<string, any>
}

class NotificationService {
  private supabase = createSupabaseClient()
  private realtimeSubscription: RealtimeSubscription | null = null

  // Get user notifications
  async getNotifications(
    userId: string,
    options: {
      unread_only?: boolean
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ notifications: Notification[]; total: number; unread_count: number }> {
    try {
      const { unread_only = false, limit = 20, offset = 0 } = options

      let query = this.supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      if (unread_only) {
        query = query.eq('is_read', false)
      }

      const { data: notifications, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      // Get unread count
      const { count: unreadCount } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      return {
        notifications: notifications || [],
        total: count || 0,
        unread_count: unreadCount || 0
      }
    } catch (error: any) {
      handleError(error, 'NotificationService - getNotifications', true)
      throw error
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await (this.supabase
        .from('notifications') as any)
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }
    } catch (error: any) {
      handleError(error, 'NotificationService - markAsRead', true)
      throw error
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await (this.supabase
        .from('notifications') as any)
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }
    } catch (error: any) {
      handleError(error, 'NotificationService - markAllAsRead', true)
      throw error
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }
    } catch (error: any) {
      handleError(error, 'NotificationService - deleteNotification', true)
      throw error
    }
  }

  // Delete all notifications
  async deleteAllNotifications(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }
    } catch (error: any) {
      handleError(error, 'NotificationService - deleteAllNotifications', true)
      throw error
    }
  }

  // Create notification (admin/system use)
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    try {
      const { data: notification, error } = await (this.supabase
        .from('notifications') as any)
        .insert({
          user_id: data.user_id,
          type: data.type,
          title: data.title,
          message: data.message || null,
          data: data.data || {}
        })
        .select()
        .single()

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      return notification
    } catch (error: any) {
      handleError(error, 'NotificationService - createNotification', true)
      throw error
    }
  }

  // Get notification preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single()

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      const preferences = (user as any)?.preferences as any || {}
      
      return {
        email_notifications: preferences.email_notifications ?? true,
        push_notifications: preferences.push_notifications ?? true,
        pin_likes: preferences.pin_likes ?? true,
        pin_comments: preferences.pin_comments ?? true,
        group_invites: preferences.group_invites ?? true,
        group_posts: preferences.group_posts ?? true,
        system_updates: preferences.system_updates ?? true,
        digest_frequency: preferences.digest_frequency ?? 'weekly'
      }
    } catch (error: any) {
      handleError(error, 'NotificationService - getNotificationPreferences', true)
      throw error
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      // Get current preferences
      const currentPrefs = await this.getNotificationPreferences(userId)
      const updatedPrefs = { ...currentPrefs, ...preferences }

      const { error } = await (this.supabase
        .from('users') as any)
        .update({
          preferences: updatedPrefs
        })
        .eq('id', userId)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      return updatedPrefs
    } catch (error: any) {
      handleError(error, 'NotificationService - updateNotificationPreferences', true)
      throw error
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): RealtimeSubscription {
    return realtimeService.subscribeToNotifications(userId, (update) => {
      if (update.eventType === 'INSERT' && update.new) {
        callback(update.new)
      }
    })
  }

  // Send push notification (if service worker is available)
  async sendPushNotification(
    userId: string,
    notification: {
      title: string
      body: string
      icon?: string
      badge?: string
      data?: any
    }
  ): Promise<void> {
    try {
      // Check if user has push notifications enabled
      const preferences = await this.getNotificationPreferences(userId)
      if (!preferences.push_notifications) {
        return
      }

      // Check if browser supports notifications
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        return
      }

      // Check permission
      if (Notification.permission !== 'granted') {
        return
      }

      // Send notification
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/badge-72x72.png',
        data: notification.data,
        tag: `notification-${Date.now()}`,
        requireInteraction: false,
        silent: false
      })
    } catch (error: any) {
      handleError(error, 'NotificationService - sendPushNotification', true)
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission()
    }

    return Notification.permission
  }

  // Get notification statistics
  async getNotificationStats(userId: string): Promise<{
    total: number
    unread: number
    by_type: Record<NotificationType, number>
    recent_activity: number
  }> {
    try {
      // Get total and unread counts
      const { count: total } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      const { count: unread } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      // Get counts by type
      const { data: typeStats } = await this.supabase
        .from('notifications')
        .select('type')
        .eq('user_id', userId)

      const byType: Record<NotificationType, number> = {
        pin_created: 0,
        pin_liked: 0,
        pin_commented: 0,
        group_invite: 0,
        group_joined: 0,
        group_post: 0,
        system: 0
      }

      typeStats?.forEach(stat => {
        if ((stat as any).type in byType) {
          byType[(stat as any).type as NotificationType]++
        }
      })

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentActivity } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())

      return {
        total: total || 0,
        unread: unread || 0,
        by_type: byType,
        recent_activity: recentActivity || 0
      }
    } catch (error: any) {
      handleError(error, 'NotificationService - getNotificationStats', true)
      throw error
    }
  }

  // Cleanup old notifications
  async cleanupOldNotifications(userId: string, daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { count } = await this.supabase
        .from('notifications')
        .delete({ count: 'exact' })
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString())

      return count || 0
    } catch (error: any) {
      handleError(error, 'NotificationService - cleanupOldNotifications', true)
      throw error
    }
  }
}

export const notificationService = new NotificationService()
export default notificationService
