/**
 * Notifications Panel Component
 * Complete notifications management with real-time updates
 */

'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, CheckCheck, Trash2, Settings, Filter, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth/auth-context'
import { useNotifications } from '@/components/providers/realtime-provider'
import notificationService, { Notification, NotificationType } from '@/lib/services/notification-service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const NOTIFICATION_ICONS = {
  pin_created: '📍',
  pin_liked: '❤️',
  pin_commented: '💬',
  group_invite: '👥',
  group_joined: '🎉',
  group_post: '📢',
  system: '⚙️'
}

const NOTIFICATION_COLORS = {
  pin_created: 'bg-blue-100 text-blue-800',
  pin_liked: 'bg-red-100 text-red-800',
  pin_commented: 'bg-green-100 text-green-800',
  group_invite: 'bg-purple-100 text-purple-800',
  group_joined: 'bg-yellow-100 text-yellow-800',
  group_post: 'bg-indigo-100 text-indigo-800',
  system: 'bg-gray-100 text-gray-800'
}

interface NotificationsPanelProps {
  className?: string
}

export default function NotificationsPanel({ className = "" }: NotificationsPanelProps) {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    pin_likes: true,
    pin_comments: true,
    group_invites: true,
    group_posts: true,
    system_updates: true
  })

  const { user, isAuthenticated } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  // Load notifications and preferences
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user) return

      try {
        setLoading(true)

        // Load notifications
        const { notifications: allNotifs } = await notificationService.getNotifications(user.id, {
          limit: 50
        })
        setAllNotifications(allNotifs)

        // Load preferences
        const prefs = await notificationService.getNotificationPreferences(user.id)
        setPreferences(prefs)
      } catch (error) {
        console.error('Error loading notifications:', error)
        toast.error('Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, user])

  // Update local state when real-time notifications come in
  useEffect(() => {
    setAllNotifications(prev => {
      const newNotifications = notifications.filter(n => !prev.find(p => p.id === n.id))
      return [...newNotifications, ...prev]
    })
  }, [notifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
      setAllNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setAllNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      setAllNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleUpdatePreferences = async (key: string, value: boolean) => {
    try {
      const updatedPrefs = { ...preferences, [key]: value }
      setPreferences(updatedPrefs)
      
      if (user) {
        await notificationService.updateNotificationPreferences(user.id, updatedPrefs)
        toast.success('Preferences updated')
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    }
  }

  const unreadNotifications = allNotifications.filter(n => !n.is_read)
  const readNotifications = allNotifications.filter(n => n.is_read)

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const icon = NOTIFICATION_ICONS[notification.type] || '📢'
    const colorClass = NOTIFICATION_COLORS[notification.type] || 'bg-gray-100 text-gray-800'
    
    return (
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        !notification.is_read && "border-l-4 border-l-blue-500 bg-blue-50/30"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm", colorClass)}>
              {icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                    {notification.title}
                  </h4>
                  {notification.message && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="" align="end">
                    {!notification.is_read && (
                      <DropdownMenuItem className="" inset={false} onClick={() => handleMarkAsRead(notification.id)}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark as read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="text-red-600"
                      inset={false}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={cn("p-4", className)}>
        <Card className="">
          <CardContent className="p-6 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Sign in to view notifications</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Notifications Tabs */}
      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger className="" value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger className="" value="all">All ({allNotifications.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="unread" className="space-y-3 mt-4">
          {unreadNotifications.length === 0 ? (
            <Card className="">
              <CardContent className="p-6 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No unread notifications</p>
                <p className="text-sm text-gray-500 mt-1">
                  You're all caught up!
                </p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map(notification => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-3 mt-4">
          {allNotifications.length === 0 ? (
            <Card className="">
              <CardContent className="p-6 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No notifications yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Notifications will appear here when you receive them
                </p>
              </CardContent>
            </Card>
          ) : (
            allNotifications.map(notification => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="">
          <DialogHeader className="">
            <DialogTitle className="">Notification Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="font-medium">Delivery Methods</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email notifications</Label>
                <Switch
                  className=""
                  id="email-notifications"
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked: boolean) => handleUpdatePreferences('email_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push notifications</Label>
                <Switch
                  className=""
                  id="push-notifications"
                  checked={preferences.push_notifications}
                  onCheckedChange={(checked: boolean) => handleUpdatePreferences('push_notifications', checked)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Notification Types</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="pin-likes">Pin likes</Label>
                <Switch
                  className=""
                  id="pin-likes"
                  checked={preferences.pin_likes}
                  onCheckedChange={(checked: boolean) => handleUpdatePreferences('pin_likes', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="pin-comments">Pin comments</Label>
                <Switch
                  className=""
                  id="pin-comments"
                  checked={preferences.pin_comments}
                  onCheckedChange={(checked: boolean) => handleUpdatePreferences('pin_comments', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="group-invites">Group invites</Label>
                <Switch
                  className=""
                  id="group-invites"
                  checked={preferences.group_invites}
                  onCheckedChange={(checked: boolean) => handleUpdatePreferences('group_invites', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="group-posts">Group posts</Label>
                <Switch
                  className=""
                  id="group-posts"
                  checked={preferences.group_posts}
                  onCheckedChange={(checked: boolean) => handleUpdatePreferences('group_posts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="system-updates">System updates</Label>
                <Switch
                  className=""
                  id="system-updates"
                  checked={preferences.system_updates}
                  onCheckedChange={(checked: boolean) => handleUpdatePreferences('system_updates', checked)}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
