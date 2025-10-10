/**
 * Environment Category Tools Component
 * Specialized tools for environmental monitoring, sustainability tracking, and green initiatives
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
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Leaf, 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun,
  TreePine,
  Recycle,
  Zap,
  Car,
  Factory,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  MapPin,
  BarChart3,
  Plus,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface EnvironmentalMetric {
  id: string
  name: string
  value: number
  unit: string
  target?: number
  trend: 'improving' | 'declining' | 'stable'
  last_updated: string
  source: string
  category: 'air' | 'water' | 'energy' | 'waste' | 'biodiversity' | 'carbon'
}

interface GreenInitiative {
  id: string
  title: string
  description: string
  category: 'renewable_energy' | 'waste_reduction' | 'conservation' | 'transportation' | 'education'
  status: 'planning' | 'active' | 'completed' | 'paused'
  progress: number
  target_date: string
  budget: number
  participants: number
  impact_metrics: {
    co2_reduction: number
    energy_saved: number
    waste_diverted: number
  }
  location: {
    latitude: number
    longitude: number
    address: string
  }
  created_at: string
  updated_at: string
}

interface SustainabilityGoal {
  id: string
  title: string
  description: string
  target_value: number
  current_value: number
  unit: string
  deadline: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  milestones: {
    id: string
    title: string
    target_date: string
    completed: boolean
  }[]
}

interface EnvironmentCategoryToolsProps {
  pinId?: string
  location?: { latitude: number; longitude: number }
  className?: string
}

export default function EnvironmentCategoryTools({ 
  pinId, 
  location,
  className 
}: EnvironmentCategoryToolsProps) {
  const [activeTab, setActiveTab] = useState('monitoring')
  const [metrics, setMetrics] = useState<EnvironmentalMetric[]>([])
  const [initiatives, setInitiatives] = useState<GreenInitiative[]>([])
  const [goals, setGoals] = useState<SustainabilityGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddInitiative, setShowAddInitiative] = useState(false)
  const [newInitiative, setNewInitiative] = useState({
    title: '',
    description: '',
    category: 'renewable_energy',
    target_date: '',
    budget: 0
  })

  useEffect(() => {
    fetchEnvironmentalData()
  }, [pinId, location])

  const fetchEnvironmentalData = async () => {
    try {
      setLoading(true)
      
      const [metricsRes, initiativesRes, goalsRes] = await Promise.all([
        fetch(`/api/environment/metrics${location ? `?lat=${location.latitude}&lng=${location.longitude}` : ''}`),
        fetch(`/api/environment/initiatives${pinId ? `?pin_id=${pinId}` : ''}`),
        fetch('/api/environment/goals')
      ])

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      if (initiativesRes.ok) {
        const initiativesData = await initiativesRes.json()
        setInitiatives(initiativesData)
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json()
        setGoals(goalsData)
      }

    } catch (error) {
      console.error('Error fetching environmental data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInitiative = async () => {
    if (!newInitiative.title.trim()) return

    try {
      const response = await fetch('/api/environment/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInitiative,
          pin_id: pinId,
          location
        })
      })

      if (response.ok) {
        const initiative = await response.json()
        setInitiatives(prev => [initiative, ...prev])
        setNewInitiative({
          title: '',
          description: '',
          category: 'renewable_energy',
          target_date: '',
          budget: 0
        })
        setShowAddInitiative(false)
      }
    } catch (error) {
      console.error('Error creating initiative:', error)
    }
  }

  const getMetricIcon = (category: string) => {
    switch (category) {
      case 'air': return <Wind className="w-5 h-5" />
      case 'water': return <Droplets className="w-5 h-5" />
      case 'energy': return <Zap className="w-5 h-5" />
      case 'waste': return <Recycle className="w-5 h-5" />
      case 'biodiversity': return <TreePine className="w-5 h-5" />
      case 'carbon': return <Factory className="w-5 h-5" />
      default: return <Leaf className="w-5 h-5" />
    }
  }

  const getMetricColor = (category: string) => {
    switch (category) {
      case 'air': return 'text-blue-600'
      case 'water': return 'text-cyan-600'
      case 'energy': return 'text-yellow-600'
      case 'waste': return 'text-green-600'
      case 'biodiversity': return 'text-emerald-600'
      case 'carbon': return 'text-gray-600'
      default: return 'text-green-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />
    }
  }

  const getInitiativeStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white'
      case 'active': return 'bg-blue-500 text-white'
      case 'planning': return 'bg-orange-500 text-white'
      case 'paused': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-silas-green" />
                <span>Environmental Tools</span>
              </CardTitle>
              <CardDescription>
                Monitor environmental metrics, track green initiatives, and manage sustainability goals
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={fetchEnvironmentalData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setShowAddInitiative(true)}
                className="bg-silas-green hover:bg-silas-green/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Initiative
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Environmental Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Air Quality Index</p>
                <p className="text-2xl font-bold">42</p>
                <p className="text-xs text-green-600">Good</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Renewable Energy</p>
                <p className="text-2xl font-bold">67%</p>
                <p className="text-xs text-green-600">+5% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Recycle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Waste Diverted</p>
                <p className="text-2xl font-bold">89%</p>
                <p className="text-xs text-green-600">Above target</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TreePine className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Carbon Offset</p>
                <p className="text-2xl font-bold">2.3t</p>
                <p className="text-xs text-green-600">This year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environmental Metrics</CardTitle>
              <CardDescription>
                Real-time monitoring of environmental indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {metrics.map(metric => (
                  <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={getMetricColor(metric.category)}>
                        {getMetricIcon(metric.category)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{metric.name}</h4>
                        <p className="text-sm text-gray-600">
                          Updated {formatDistanceToNow(new Date(metric.last_updated), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">
                          {metric.value} {metric.unit}
                        </span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      {metric.target && (
                        <p className="text-sm text-gray-500">
                          Target: {metric.target} {metric.unit}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {metrics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Thermometer className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No environmental metrics available</p>
                    <p className="text-sm">Connect monitoring devices to start tracking</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-4">
          <div className="grid gap-4">
            {initiatives.map(initiative => (
              <Card key={initiative.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{initiative.title}</h3>
                        <Badge className={getInitiativeStatusColor(initiative.status)}>
                          {initiative.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{initiative.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Progress</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Progress value={initiative.progress} className="flex-1" />
                            <span className="text-sm font-medium">{initiative.progress}%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Participants</label>
                          <div className="flex items-center space-x-1 mt-1">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{initiative.participants}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Budget</label>
                          <p className="font-medium mt-1">£{initiative.budget.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-700">CO₂ Reduction</p>
                          <p className="font-bold text-green-800">
                            {initiative.impact_metrics.co2_reduction}t
                          </p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">Energy Saved</p>
                          <p className="font-bold text-blue-800">
                            {initiative.impact_metrics.energy_saved}kWh
                          </p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-700">Waste Diverted</p>
                          <p className="font-bold text-purple-800">
                            {initiative.impact_metrics.waste_diverted}kg
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {format(new Date(initiative.target_date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{initiative.location.address}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {initiative.category.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {initiatives.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Leaf className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Green Initiatives</h3>
                  <p className="text-gray-600 mb-4">
                    Start your first environmental initiative to make a positive impact
                  </p>
                  <Button
                    onClick={() => setShowAddInitiative(true)}
                    className="bg-silas-green hover:bg-silas-green/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Initiative
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {goals.map(goal => (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority} priority
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4">{goal.description}</p>
                      
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-gray-600">
                            {goal.current_value} / {goal.target_value} {goal.unit}
                          </span>
                        </div>
                        <Progress 
                          value={(goal.current_value / goal.target_value) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Milestones</h4>
                        {goal.milestones.map(milestone => (
                          <div key={milestone.id} className="flex items-center space-x-2">
                            {milestone.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                            <span className={cn(
                              "text-sm",
                              milestone.completed ? "text-green-700" : "text-gray-600"
                            )}>
                              {milestone.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(milestone.target_date), 'MMM d')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline: {format(new Date(goal.deadline), 'MMM d, yyyy')}</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {goal.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environmental Reports</CardTitle>
              <CardDescription>
                Generate and download environmental impact reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Download className="w-6 h-6 mb-2" />
                  <span>Carbon Footprint Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Download className="w-6 h-6 mb-2" />
                  <span>Sustainability Metrics</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Download className="w-6 h-6 mb-2" />
                  <span>Initiative Impact Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Upload className="w-6 h-6 mb-2" />
                  <span>Upload Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Initiative Modal */}
      {showAddInitiative && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Create Green Initiative</CardTitle>
              <CardDescription>
                Start a new environmental initiative in your community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  placeholder="Initiative name..."
                  value={newInitiative.title}
                  onChange={(e) => setNewInitiative(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the initiative..."
                  value={newInitiative.description}
                  onChange={(e) => setNewInitiative(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={newInitiative.category} 
                    onValueChange={(value) => setNewInitiative(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="renewable_energy">Renewable Energy</SelectItem>
                      <SelectItem value="waste_reduction">Waste Reduction</SelectItem>
                      <SelectItem value="conservation">Conservation</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={newInitiative.target_date}
                    onChange={(e) => setNewInitiative(prev => ({ ...prev, target_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Budget (£)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newInitiative.budget || ''}
                  onChange={(e) => setNewInitiative(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddInitiative(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createInitiative}
                  disabled={!newInitiative.title.trim()}
                  className="bg-silas-green hover:bg-silas-green/90"
                >
                  Create Initiative
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
