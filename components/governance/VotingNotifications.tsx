/**
 * Voting Notifications Component
 * Handles notifications for new proposals, voting deadlines, and results
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Vote, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Calendar,
  ArrowRight,
  Settings
} from 'lucide-react'
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'new_proposal' | 'voting_deadline' | 'voting_result' | 'proposal_comment'
  title: string
  message: string
  data: {
    proposal_id?: string
    proposal_title?: string
    voting_deadline?: string
    result?: 'approved' | 'rejected'
    comment_id?: string
  }
  read: boolean
  created_at: string
}

interface Proposal {
  id: string
  title: string
  status: string
  voting_deadline: string
  votes_for: number
  votes_against: number
  votes_abstain: number
  total_votes: number
}

interface VotingNotificationsProps {
  userId?: string
  className?: string
}

export default function VotingNotifications({ userId, className }: VotingNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeProposals, setActiveProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
    fetchActiveProposals()
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?type=voting')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchActiveProposals = async () => {
    try {
      const response = await fetch('/api/proposals?status=active&limit=10')
      if (response.ok) {
        const data = await response.json()
        setActiveProposals(data)
      }
    } catch (error) {
      console.error('Error fetching active proposals:', error)
      setError('Failed to load active proposals')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getUrgentProposals = () => {
    const now = new Date()
    const tomorrow = addDays(now, 1)
    
    return activeProposals.filter(proposal => {
      const deadline = new Date(proposal.voting_deadline)
      return isAfter(deadline, now) && isBefore(deadline, tomorrow)
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_proposal': return <Vote className="w-4 h-4 text-blue-500" />
      case 'voting_deadline': return <Clock className="w-4 h-4 text-orange-500" />
      case 'voting_result': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'proposal_comment': return <Users className="w-4 h-4 text-purple-500" />
      default: return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_proposal': return 'border-l-blue-500'
      case 'voting_deadline': return 'border-l-orange-500'
      case 'voting_result': return 'border-l-green-500'
      case 'proposal_comment': return 'border-l-purple-500'
      default: return 'border-l-gray-500'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const urgentProposals = getUrgentProposals()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-silas-green" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Urgent Voting Deadlines */}
      {urgentProposals.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-orange-800">
                {urgentProposals.length} proposal{urgentProposals.length !== 1 ? 's' : ''} ending soon!
              </p>
              {urgentProposals.map(proposal => (
                <div key={proposal.id} className="flex items-center justify-between">
                  <span className="text-sm text-orange-700">{proposal.title}</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    {formatDistanceToNow(new Date(proposal.voting_deadline), { addSuffix: true })}
                  </Badge>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-silas-green" />
              <CardTitle>Voting Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Stay updated on community proposals and voting activities
          </CardDescription>
        </CardHeader>

        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
              <p className="text-sm">You'll be notified about new proposals and voting deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4 transition-colors",
                    getNotificationColor(notification.type),
                    notification.read ? "bg-gray-50" : "bg-white shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={cn(
                            "text-sm font-medium",
                            notification.read ? "text-gray-600" : "text-gray-900"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className={cn(
                          "text-sm",
                          notification.read ? "text-gray-500" : "text-gray-700"
                        )}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          {notification.data.proposal_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={() => {
                                markAsRead(notification.id)
                                // Navigate to proposal
                                window.location.href = `/proposals/${notification.data.proposal_id}`
                              }}
                            >
                              View <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Proposals Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Vote className="w-5 h-5 text-silas-green" />
            <span>Active Proposals</span>
          </CardTitle>
          <CardDescription>
            Current proposals awaiting community votes
          </CardDescription>
        </CardHeader>

        <CardContent>
          {activeProposals.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              No active proposals at the moment
            </p>
          ) : (
            <div className="space-y-3">
              {activeProposals.slice(0, 5).map((proposal) => {
                const deadline = new Date(proposal.voting_deadline)
                const isUrgent = isBefore(deadline, addDays(new Date(), 1))
                
                return (
                  <div key={proposal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{proposal.title}</h4>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{proposal.total_votes} votes</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span className={isUrgent ? 'text-orange-600 font-medium' : ''}>
                            {formatDistanceToNow(deadline, { addSuffix: true })}
                          </span>
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/proposals/${proposal.id}`}
                    >
                      Vote
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
