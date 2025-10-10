/**
 * Project Analytics Dashboard Component
 * Comprehensive analytics with charts, progress reports, and performance metrics
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  LineChart,
  Calendar,
  Clock,
  Target,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Award,
  Download
} from 'lucide-react'
import { format, subDays, subWeeks, subMonths, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface ProjectMetrics {
  overall_progress: number
  milestones_completed: number
  milestones_total: number
  budget_utilization: number
  schedule_variance: number // positive = ahead, negative = behind
  cost_variance: number // positive = under budget, negative = over budget
  team_productivity: number
  risk_score: number
  quality_score: number
  stakeholder_satisfaction: number
}

interface TimeSeriesData {
  date: string
  progress: number
  budget_spent: number
  team_hours: number
  milestones_completed: number
}

interface PerformanceIndicator {
  name: string
  current_value: number
  target_value: number
  trend: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'critical'
  unit: string
}

interface ProjectAnalyticsProps {
  projectId: string
  className?: string
}

export default function ProjectAnalyticsDashboard({ projectId, className }: ProjectAnalyticsProps) {
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [kpis, setKpis] = useState<PerformanceIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalyticsData()
  }, [projectId, timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      const [metricsRes, timeSeriesRes, kpisRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/analytics/metrics`),
        fetch(`/api/projects/${projectId}/analytics/timeseries?range=${timeRange}`),
        fetch(`/api/projects/${projectId}/analytics/kpis`)
      ])

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      if (timeSeriesRes.ok) {
        const timeSeriesData = await timeSeriesRes.json()
        setTimeSeriesData(timeSeriesData)
      }

      if (kpisRes.ok) {
        const kpisData = await kpisRes.json()
        setKpis(kpisData)
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getHealthScore = () => {
    if (!metrics) return 0
    
    const scores = [
      metrics.overall_progress,
      100 - Math.abs(metrics.schedule_variance),
      100 - Math.abs(metrics.cost_variance),
      metrics.team_productivity,
      100 - metrics.risk_score,
      metrics.quality_score
    ]
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green" />
      </div>
    )
  }

  const healthScore = getHealthScore()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Analytics</h2>
          <p className="text-gray-600">Performance insights and key metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Project Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-silas-green" />
            <span>Project Health Score</span>
          </CardTitle>
          <CardDescription>
            Overall project performance based on key indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthScore / 100)}`}
                  className={cn(
                    healthScore >= 80 ? "text-green-500" :
                    healthScore >= 60 ? "text-yellow-500" : "text-red-500"
                  )}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{healthScore.toFixed(0)}</span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics?.overall_progress.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold",
                    Math.abs(metrics?.schedule_variance || 0) <= 5 ? "text-green-600" : "text-orange-600"
                  )}>
                    {metrics?.schedule_variance > 0 ? '+' : ''}{metrics?.schedule_variance.toFixed(1)}d
                  </div>
                  <div className="text-sm text-gray-600">Schedule</div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold",
                    (metrics?.cost_variance || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {metrics?.cost_variance > 0 ? '+' : ''}£{metrics?.cost_variance.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Budget</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{kpi.name}</span>
                {getTrendIcon(kpi.trend)}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className={cn("text-2xl font-bold", getStatusColor(kpi.status))}>
                  {kpi.current_value}
                </span>
                <span className="text-sm text-gray-500">{kpi.unit}</span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Target: {kpi.target_value}{kpi.unit}</span>
                  <span>{((kpi.current_value / kpi.target_value) * 100).toFixed(0)}%</span>
                </div>
                <Progress 
                  value={(kpi.current_value / kpi.target_value) * 100} 
                  className="h-1"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="w-5 h-5" />
                  <span>Progress Trend</span>
                </CardTitle>
                <CardDescription>Project completion over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Progress chart visualization</p>
                    <p className="text-sm">Interactive chart showing progress over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Budget Breakdown</span>
                </CardTitle>
                <CardDescription>Spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Budget pie chart</p>
                    <p className="text-sm">Visual breakdown of budget allocation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest project updates and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'milestone', title: 'Design Phase Completed', time: '2 hours ago', status: 'completed' },
                  { type: 'budget', title: 'Budget allocation updated', time: '1 day ago', status: 'info' },
                  { type: 'team', title: 'New team member added', time: '2 days ago', status: 'info' },
                  { type: 'risk', title: 'Risk assessment updated', time: '3 days ago', status: 'warning' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activity.status === 'completed' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                    )} />
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.time}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Milestone Progress</CardTitle>
              <CardDescription>Detailed breakdown of milestone completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-2xl font-bold text-silas-green">
                    {metrics?.overall_progress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics?.overall_progress} className="h-3" />
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics?.milestones_completed}
                    </div>
                    <div className="text-sm text-green-700">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {(metrics?.milestones_total || 0) - (metrics?.milestones_completed || 0)}
                    </div>
                    <div className="text-sm text-blue-700">Remaining</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>Team productivity and resource allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics?.team_productivity.toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-700">Team Productivity</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    {metrics?.budget_utilization.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Budget Used</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">
                    {metrics?.quality_score.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-700">Quality Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>Current project risks and mitigation status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <div>
                      <div className="font-medium">Overall Risk Score</div>
                      <div className="text-sm text-gray-600">Based on schedule, budget, and quality factors</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {metrics?.risk_score.toFixed(1)}%
                  </div>
                </div>

                {metrics && metrics.risk_score > 30 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Risk level is elevated. Consider reviewing project timeline and resource allocation.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
