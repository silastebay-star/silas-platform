/**
 * Project Collaboration Tools Component
 * Team assignment, task delegation, and project communication features
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  MessageSquare, 
  UserPlus, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Send,
  Plus,
  Edit,
  Trash2,
  Bell,
  Settings,
  Activity,
  Target,
  Zap
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: string
  user_id: string
  full_name: string
  username: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  skills: string[]
  availability: 'available' | 'busy' | 'away'
  joined_at: string
  last_active: string
}

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assigned_to: string[]
  created_by: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  milestone_id?: string
  tags: string[]
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  content: string
  author: {
    id: string
    full_name: string
    avatar_url?: string
  }
  created_at: string
  type: 'message' | 'system' | 'task_update'
  metadata?: any
}

interface ProjectCollaborationProps {
  projectId: string
  currentUserId: string
  className?: string
}

export default function ProjectCollaborationTools({ 
  projectId, 
  currentUserId, 
  className 
}: ProjectCollaborationProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('team')
  const [newMessage, setNewMessage] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showInviteMember, setShowInviteMember] = useState(false)

  useEffect(() => {
    fetchCollaborationData()
  }, [projectId])

  const fetchCollaborationData = async () => {
    try {
      setLoading(true)
      
      const [teamRes, tasksRes, messagesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/team`),
        fetch(`/api/projects/${projectId}/tasks`),
        fetch(`/api/projects/${projectId}/messages`)
      ])

      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamMembers(teamData)
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData)
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json()
        setMessages(messagesData)
      }

    } catch (error) {
      console.error('Error fetching collaboration data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          type: 'message'
        })
      })

      if (response.ok) {
        const message = await response.json()
        setMessages(prev => [...prev, message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-500'
      case 'busy': return 'bg-orange-500'
      case 'away': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500 text-white'
      case 'admin': return 'bg-blue-500 text-white'
      case 'member': return 'bg-green-500 text-white'
      case 'viewer': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white'
      case 'in_progress': return 'bg-blue-500 text-white'
      case 'review': return 'bg-orange-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'normal': return 'text-blue-600'
      case 'low': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Today</p>
                <p className="text-2xl font-bold">
                  {messages.filter(m => 
                    new Date(m.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collaboration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Button
              onClick={() => setShowInviteMember(true)}
              className="bg-silas-green hover:bg-silas-green/90"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>

          <div className="grid gap-4">
            {teamMembers.map(member => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>
                            {member.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                          getAvailabilityColor(member.availability)
                        )} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{member.full_name}</h4>
                          <Badge className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">@{member.username}</p>
                        
                        {member.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {member.skills.slice(0, 3).map(skill => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {member.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{member.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">
                          Last active {formatDistanceToNow(new Date(member.last_active), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Tasks</h3>
            <Button
              onClick={() => setShowAddTask(true)}
              className="bg-silas-green hover:bg-silas-green/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Task Status Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['todo', 'in_progress', 'review', 'completed'].map(status => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium capitalize flex items-center space-x-2">
                    <span>{status.replace('_', ' ')}</span>
                    <Badge variant="secondary">
                      {tasks.filter(t => t.status === status).length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasks
                    .filter(t => t.status === status)
                    .map(task => (
                      <div key={task.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                        
                        {task.assigned_to.length > 0 && (
                          <div className="flex -space-x-1 mb-2">
                            {task.assigned_to.slice(0, 3).map(userId => {
                              const member = teamMembers.find(m => m.user_id === userId)
                              return member ? (
                                <Avatar key={userId} className="w-6 h-6 border-2 border-white">
                                  <AvatarImage src={member.avatar_url} />
                                  <AvatarFallback className="text-xs">
                                    {member.full_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : null
                            })}
                            {task.assigned_to.length > 3 && (
                              <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                                <span className="text-xs">+{task.assigned_to.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {task.due_date && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(task.due_date), 'MMM d')}</span>
                          </div>
                        )}
                        
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Project Chat</span>
              </CardTitle>
              <CardDescription>
                Real-time communication with your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {messages.map(message => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.author.avatar_url} />
                      <AvatarFallback>
                        {message.author.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.author.full_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest project updates and team actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'task', user: 'John Doe', action: 'completed task "Design Review"', time: '2 hours ago' },
                  { type: 'member', user: 'Jane Smith', action: 'joined the project', time: '1 day ago' },
                  { type: 'milestone', user: 'Mike Johnson', action: 'updated milestone "Phase 1"', time: '2 days ago' },
                  { type: 'message', user: 'Sarah Wilson', action: 'posted a message in chat', time: '3 days ago' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      activity.type === 'task' ? 'bg-green-500' :
                      activity.type === 'member' ? 'bg-blue-500' :
                      activity.type === 'milestone' ? 'bg-purple-500' : 'bg-orange-500'
                    )} />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
