/**
 * Enhanced Milestone Tracker Component
 * Advanced milestone tracking with dependencies, progress visualization, and automated status updates
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2,
  Calendar as CalendarIcon,
  Users,
  Target,
  TrendingUp,
  ArrowRight,
  Zap,
  Flag
} from 'lucide-react'
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface Milestone {
  id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'overdue'
  priority: 'low' | 'normal' | 'high' | 'critical'
  due_date: string
  start_date?: string
  completion_date?: string
  progress_percentage: number
  assigned_to?: string[]
  dependencies: string[] // IDs of milestones that must be completed first
  deliverables: string[]
  resources_required: string[]
  estimated_hours: number
  actual_hours?: number
  budget_allocated?: number
  budget_spent?: number
  notes?: string
  created_at: string
  updated_at: string
}

interface MilestoneTrackerProps {
  projectId: string
  milestones: Milestone[]
  onMilestoneUpdate: (milestone: Milestone) => void
  onMilestoneCreate: (milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>) => void
  onMilestoneDelete: (milestoneId: string) => void
  className?: string
}

export default function EnhancedMilestoneTracker({
  projectId,
  milestones,
  onMilestoneUpdate,
  onMilestoneCreate,
  onMilestoneDelete,
  className
}: MilestoneTrackerProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban' | 'gantt'>('timeline')

  // Calculate overall project progress
  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter(m => m.status === 'completed').length
  const overallProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  // Calculate critical path and dependencies
  const getDependentMilestones = (milestoneId: string): Milestone[] => {
    return milestones.filter(m => m.dependencies.includes(milestoneId))
  }

  const getBlockedMilestones = (): Milestone[] => {
    return milestones.filter(milestone => {
      return milestone.dependencies.some(depId => {
        const dependency = milestones.find(m => m.id === depId)
        return dependency && dependency.status !== 'completed'
      })
    })
  }

  const getOverdueMilestones = (): Milestone[] => {
    const now = new Date()
    return milestones.filter(m => 
      m.status !== 'completed' && 
      isAfter(now, new Date(m.due_date))
    )
  }

  const getUpcomingMilestones = (): Milestone[] => {
    const now = new Date()
    const nextWeek = addDays(now, 7)
    return milestones.filter(m => 
      m.status !== 'completed' && 
      isAfter(new Date(m.due_date), now) &&
      isBefore(new Date(m.due_date), nextWeek)
    )
  }

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white'
      case 'in_progress': return 'bg-blue-500 text-white'
      case 'blocked': return 'bg-red-500 text-white'
      case 'overdue': return 'bg-orange-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'normal': return 'text-blue-600'
      case 'low': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <Flag className="w-4 h-4 text-red-600" />
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case 'normal': return <Target className="w-4 h-4 text-blue-600" />
      case 'low': return <Circle className="w-4 h-4 text-gray-600" />
      default: return <Circle className="w-4 h-4 text-gray-600" />
    }
  }

  const canStartMilestone = (milestone: Milestone): boolean => {
    return milestone.dependencies.every(depId => {
      const dependency = milestones.find(m => m.id === depId)
      return dependency && dependency.status === 'completed'
    })
  }

  const updateMilestoneStatus = async (milestoneId: string, newStatus: Milestone['status']) => {
    const milestone = milestones.find(m => m.id === milestoneId)
    if (!milestone) return

    const updatedMilestone = {
      ...milestone,
      status: newStatus,
      completion_date: newStatus === 'completed' ? new Date().toISOString() : undefined,
      progress_percentage: newStatus === 'completed' ? 100 : milestone.progress_percentage
    }

    onMilestoneUpdate(updatedMilestone)
  }

  const blockedMilestones = getBlockedMilestones()
  const overdueMilestones = getOverdueMilestones()
  const upcomingMilestones = getUpcomingMilestones()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Project Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-silas-green" />
                <span>Project Progress</span>
              </CardTitle>
              <CardDescription>
                {completedMilestones} of {totalMilestones} milestones completed
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-silas-green">
                {overallProgress.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3 mb-4" />
          
          {/* Status Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overdueMilestones.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>{overdueMilestones.length}</strong> milestone{overdueMilestones.length !== 1 ? 's' : ''} overdue
                </AlertDescription>
              </Alert>
            )}

            {blockedMilestones.length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>{blockedMilestones.length}</strong> milestone{blockedMilestones.length !== 1 ? 's' : ''} blocked
                </AlertDescription>
              </Alert>
            )}

            {upcomingMilestones.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>{upcomingMilestones.length}</strong> milestone{upcomingMilestones.length !== 1 ? 's' : ''} due this week
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Mode Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label>View:</Label>
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timeline">Timeline</SelectItem>
              <SelectItem value="kanban">Kanban</SelectItem>
              <SelectItem value="gantt">Gantt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-silas-green hover:bg-silas-green/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle>Milestone Timeline</CardTitle>
            <CardDescription>
              Track progress and dependencies across all project milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .map((milestone, index) => {
                  const isOverdue = milestone.status !== 'completed' && isAfter(new Date(), new Date(milestone.due_date))
                  const canStart = canStartMilestone(milestone)
                  const dependentCount = getDependentMilestones(milestone.id).length

                  return (
                    <div key={milestone.id} className="relative">
                      {/* Timeline connector */}
                      {index < milestones.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Status indicator */}
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border-2",
                          milestone.status === 'completed' ? 'bg-green-500 border-green-500' :
                          milestone.status === 'in_progress' ? 'bg-blue-500 border-blue-500' :
                          milestone.status === 'blocked' ? 'bg-red-500 border-red-500' :
                          isOverdue ? 'bg-orange-500 border-orange-500' :
                          'bg-gray-200 border-gray-300'
                        )}>
                          {milestone.status === 'completed' ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : milestone.status === 'in_progress' ? (
                            <Zap className="w-6 h-6 text-white" />
                          ) : milestone.status === 'blocked' ? (
                            <AlertTriangle className="w-6 h-6 text-white" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-600" />
                          )}
                        </div>

                        {/* Milestone content */}
                        <div className="flex-1 bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold">{milestone.title}</h3>
                                {getPriorityIcon(milestone.priority)}
                                <Badge className={getMilestoneStatusColor(milestone.status)}>
                                  {milestone.status.replace('_', ' ')}
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="destructive">Overdue</Badge>
                                )}
                                {!canStart && milestone.status === 'not_started' && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                                    Waiting for dependencies
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                              
                              {/* Progress bar */}
                              {milestone.status !== 'not_started' && milestone.status !== 'completed' && (
                                <div className="mb-2">
                                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Progress</span>
                                    <span>{milestone.progress_percentage}%</span>
                                  </div>
                                  <Progress value={milestone.progress_percentage} className="h-2" />
                                </div>
                              )}

                              {/* Metadata */}
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>Due {format(new Date(milestone.due_date), 'MMM d, yyyy')}</span>
                                </span>
                                {milestone.assigned_to && milestone.assigned_to.length > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <Users className="w-3 h-3" />
                                    <span>{milestone.assigned_to.length} assigned</span>
                                  </span>
                                )}
                                {dependentCount > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <ArrowRight className="w-3 h-3" />
                                    <span>{dependentCount} dependent</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              {milestone.status !== 'completed' && canStart && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMilestoneStatus(
                                    milestone.id, 
                                    milestone.status === 'not_started' ? 'in_progress' : 'completed'
                                  )}
                                >
                                  {milestone.status === 'not_started' ? 'Start' : 'Complete'}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingMilestone(milestone.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Dependencies */}
                          {milestone.dependencies.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-xs text-gray-500 mb-2">Dependencies:</div>
                              <div className="flex flex-wrap gap-1">
                                {milestone.dependencies.map(depId => {
                                  const dependency = milestones.find(m => m.id === depId)
                                  if (!dependency) return null
                                  
                                  return (
                                    <Badge
                                      key={depId}
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        dependency.status === 'completed' ? 'border-green-300 text-green-700' : 'border-orange-300 text-orange-700'
                                      )}
                                    >
                                      {dependency.title}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['not_started', 'in_progress', 'blocked', 'completed'].map(status => (
            <Card key={status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium capitalize">
                  {status.replace('_', ' ')}
                  <Badge variant="secondary" className="ml-2">
                    {milestones.filter(m => m.status === status).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {milestones
                  .filter(m => m.status === status)
                  .map(milestone => (
                    <div key={milestone.id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{milestone.title}</h4>
                        {getPriorityIcon(milestone.priority)}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{milestone.description}</p>
                      <div className="text-xs text-gray-500">
                        Due {format(new Date(milestone.due_date), 'MMM d')}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Gantt View Placeholder */}
      {viewMode === 'gantt' && (
        <Card>
          <CardHeader>
            <CardTitle>Gantt Chart</CardTitle>
            <CardDescription>
              Visual timeline showing milestone dependencies and critical path
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Gantt chart view coming soon</p>
              <p className="text-sm">This will show a detailed timeline with dependencies and critical path analysis</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
