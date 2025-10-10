/**
 * Community Dashboard Component
 * Integrated dashboard bringing together all community features
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MapPin, 
  Vote, 
  Users, 
  MessageSquare,
  TrendingUp,
  Calendar,
  Bell,
  Settings,
  Plus,
  Activity,
  Award,
  Target,
  Zap
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Import our feature components
import CommunityFeed from '@/components/social/CommunityFeed'
import VotingNotifications from '@/components/governance/VotingNotifications'
import ProjectAnalyticsDashboard from '@/components/projects/ProjectAnalyticsDashboard'
import SocialEngagementFeatures from '@/components/social/SocialEngagementFeatures'
import DiscussionForums from '@/components/social/DiscussionForums'

interface DashboardStats {
  total_pins: number
  active_proposals: number
  ongoing_projects: number
  community_members: number
  recent_activity: number
  user_engagement_score: number
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  action: string
  color: string
}

interface CommunityDashboardProps {
  userId?: string
  className?: string
}

export default function CommunityDashboard({ userId, className }: CommunityDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'create-pin',
      title: 'Add Pin',
      description: 'Mark a location of interest',
      icon: MapPin,
      action: '/pins/create',
      color: 'bg-blue-500'
    },
    {
      id: 'create-proposal',
      title: 'New Proposal',
      description: 'Propose community changes',
      icon: Vote,
      action: '/proposals/create',
      color: 'bg-purple-500'
    },
    {
      id: 'start-project',
      title: 'Start Project',
      description: 'Launch a community project',
      icon: Target,
      action: '/projects/create',
      color: 'bg-green-500'
    },
    {
      id: 'join-discussion',
      title: 'Join Discussion',
      description: 'Participate in forums',
      icon: MessageSquare,
      action: '/forums',
      color: 'bg-orange-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Welcome Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Welcome to SILAS Community</CardTitle>
              <CardDescription>
                Your local community platform for collaboration and engagement
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Community Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Community Pins</p>
                  <p className="text-2xl font-bold">{stats.total_pins}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Vote className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Proposals</p>
                  <p className="text-2xl font-bold">{stats.active_proposals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Ongoing Projects</p>
                  <p className="text-2xl font-bold">{stats.ongoing_projects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Members</p>
                  <p className="text-2xl font-bold">{stats.community_members}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-bold">{stats.recent_activity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Score</p>
                  <p className="text-2xl font-bold">{stats.user_engagement_score}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-silas-green" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Get started with common community activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map(action => {
              const IconComponent = action.icon
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
                  onClick={() => window.location.href = action.action}
                >
                  <div className={cn("p-3 rounded-full", action.color)}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs text-gray-600">{action.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feed">Community Feed</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Community Activity</CardTitle>
                <CardDescription>
                  Latest updates from your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'proposal', title: 'New bike lane proposal', time: '2 hours ago', status: 'active' },
                    { type: 'project', title: 'Community garden milestone completed', time: '4 hours ago', status: 'completed' },
                    { type: 'pin', title: 'New local business added', time: '6 hours ago', status: 'new' },
                    { type: 'discussion', title: 'Traffic safety discussion started', time: '8 hours ago', status: 'active' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        activity.type === 'proposal' ? 'bg-purple-500' :
                        activity.type === 'project' ? 'bg-green-500' :
                        activity.type === 'pin' ? 'bg-blue-500' : 'bg-orange-500'
                      )} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  Important dates and deadlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'Town Hall Meeting', date: '2024-01-15', type: 'meeting' },
                    { title: 'Proposal Voting Deadline', date: '2024-01-18', type: 'deadline' },
                    { title: 'Community Cleanup Day', date: '2024-01-22', type: 'event' },
                    { title: 'Project Review Session', date: '2024-01-25', type: 'review' }
                  ].map((event, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Calendar className="w-5 h-5 text-silas-green" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(event.date), 'PPP')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feed">
          <CommunityFeed />
        </TabsContent>

        <TabsContent value="governance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VotingNotifications userId={userId} />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Governance Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats?.active_proposals || 0}
                    </div>
                    <div className="text-sm text-purple-700">Active Proposals</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">87%</div>
                    <div className="text-sm text-green-700">Participation Rate</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">23</div>
                    <div className="text-sm text-blue-700">Decisions This Month</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <ProjectAnalyticsDashboard projectId="community-overview" />
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SocialEngagementFeatures currentUserId={userId} />
            </div>
            <div>
              <DiscussionForums />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
