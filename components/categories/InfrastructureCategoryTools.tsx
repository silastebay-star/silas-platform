/**
 * Infrastructure Category Tools Component
 * Specialized tools for infrastructure planning, maintenance tracking, and public works coordination
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
  Wrench, 
  Road, 
  Zap, 
  Droplets,
  Wifi,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  BarChart3,
  TrendingUp,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Target,
  Activity,
  FileText,
  Camera,
  Phone
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface InfrastructureAsset {
  id: string
  name: string
  type: 'road' | 'bridge' | 'water' | 'sewer' | 'electrical' | 'telecommunications' | 'building'
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  condition_score: number
  last_inspection: string
  next_maintenance: string
  estimated_cost: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  location: {
    latitude: number
    longitude: number
    address: string
  }
  specifications: {
    age: number
    material: string
    capacity: string
    dimensions: string
  }
  maintenance_history: MaintenanceRecord[]
}

interface MaintenanceRecord {
  id: string
  date: string
  type: 'inspection' | 'repair' | 'replacement' | 'upgrade'
  description: string
  cost: number
  contractor: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  photos: string[]
}

interface InfrastructureProject {
  id: string
  title: string
  description: string
  type: 'new_construction' | 'major_repair' | 'upgrade' | 'replacement'
  status: 'planning' | 'design' | 'permitting' | 'construction' | 'completed'
  budget: number
  spent: number
  start_date: string
  completion_date: string
  contractor: string
  affected_assets: string[]
  milestones: ProjectMilestone[]
}

interface ProjectMilestone {
  id: string
  title: string
  description: string
  target_date: string
  completion_date?: string
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  dependencies: string[]
}

interface InfrastructureCategoryToolsProps {
  pinId?: string
  location?: { latitude: number; longitude: number }
  className?: string
}

export default function InfrastructureCategoryTools({ 
  pinId, 
  location,
  className 
}: InfrastructureCategoryToolsProps) {
  const [activeTab, setActiveTab] = useState('assets')
  const [assets, setAssets] = useState<InfrastructureAsset[]>([])
  const [projects, setProjects] = useState<InfrastructureProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<InfrastructureAsset | null>(null)
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [showReportIssue, setShowReportIssue] = useState(false)

  useEffect(() => {
    fetchInfrastructureData()
  }, [pinId, location])

  const fetchInfrastructureData = async () => {
    try {
      setLoading(true)
      
      const [assetsRes, projectsRes] = await Promise.all([
        fetch(`/api/infrastructure/assets${location ? `?lat=${location.latitude}&lng=${location.longitude}` : ''}`),
        fetch(`/api/infrastructure/projects${pinId ? `?pin_id=${pinId}` : ''}`)
      ])

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json()
        setAssets(assetsData)
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
      }

    } catch (error) {
      console.error('Error fetching infrastructure data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'road': return <Road className="w-5 h-5" />
      case 'bridge': return <Building className="w-5 h-5" />
      case 'water': return <Droplets className="w-5 h-5" />
      case 'sewer': return <Droplets className="w-5 h-5" />
      case 'electrical': return <Zap className="w-5 h-5" />
      case 'telecommunications': return <Wifi className="w-5 h-5" />
      case 'building': return <Building className="w-5 h-5" />
      default: return <Wrench className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200'
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'poor': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
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

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white'
      case 'construction': return 'bg-blue-500 text-white'
      case 'design': return 'bg-purple-500 text-white'
      case 'planning': return 'bg-orange-500 text-white'
      case 'permitting': return 'bg-yellow-500 text-white'
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
                <Wrench className="w-5 h-5 text-silas-green" />
                <span>Infrastructure Management</span>
              </CardTitle>
              <CardDescription>
                Track infrastructure assets, manage maintenance, and coordinate public works projects
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowReportIssue(true)}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
              <Button variant="outline" size="sm" onClick={fetchInfrastructureData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setShowAddAsset(true)}
                className="bg-silas-green hover:bg-silas-green/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Infrastructure Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Assets in Good Condition</p>
                <p className="text-2xl font-bold">
                  {assets.filter(a => ['excellent', 'good'].includes(a.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold">
                  {assets.filter(a => ['poor', 'critical'].includes(a.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => ['construction', 'design'].includes(p.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold">
                  £{projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid gap-4">
            {assets.map(asset => (
              <Card key={asset.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedAsset(asset)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-gray-600">
                        {getAssetIcon(asset.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{asset.name}</h3>
                          <Badge className={cn("text-xs", getStatusColor(asset.status))}>
                            {asset.status}
                          </Badge>
                          <Badge className={getPriorityColor(asset.priority)}>
                            {asset.priority} priority
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Condition Score</label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Progress value={asset.condition_score} className="flex-1" />
                              <span className="text-sm font-medium">{asset.condition_score}%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Age</label>
                            <p className="font-medium">{asset.specifications.age} years</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Estimated Cost</label>
                            <p className="font-medium">£{asset.estimated_cost.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Last Inspection</label>
                            <p className="text-sm">
                              {formatDistanceToNow(new Date(asset.last_inspection), { addSuffix: true })}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Next Maintenance</label>
                            <p className="text-sm">
                              {format(new Date(asset.next_maintenance), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant="outline" className="capitalize">
                        {asset.type.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{asset.location.address}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {assets.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Infrastructure Assets</h3>
                  <p className="text-gray-600 mb-4">
                    Add infrastructure assets to start tracking and managing them
                  </p>
                  <Button
                    onClick={() => setShowAddAsset(true)}
                    className="bg-silas-green hover:bg-silas-green/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Asset
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>
                Upcoming and recent maintenance activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.flatMap(asset => 
                  asset.maintenance_history.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          record.status === 'completed' ? 'bg-green-500' :
                          record.status === 'in_progress' ? 'bg-blue-500' :
                          record.status === 'scheduled' ? 'bg-orange-500' : 'bg-gray-500'
                        )} />
                        <div>
                          <h4 className="font-semibold">{record.description}</h4>
                          <p className="text-sm text-gray-600">
                            {asset.name} • {record.contractor}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">£{record.cost.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {assets.every(asset => asset.maintenance_history.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No maintenance records</p>
                    <p className="text-sm">Maintenance activities will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4">
            {projects.map(project => (
              <Card key={project.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{project.title}</h3>
                        <Badge className={getProjectStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4">{project.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Budget Progress</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Progress value={(project.spent / project.budget) * 100} className="flex-1" />
                            <span className="text-sm font-medium">
                              {Math.round((project.spent / project.budget) * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            £{project.spent.toLocaleString()} / £{project.budget.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Contractor</label>
                          <p className="font-medium">{project.contractor}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Completion Date</label>
                          <p className="font-medium">
                            {format(new Date(project.completion_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Project Milestones</h4>
                        {project.milestones.map(milestone => (
                          <div key={milestone.id} className="flex items-center space-x-2">
                            {milestone.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : milestone.status === 'in_progress' ? (
                              <Clock className="w-4 h-4 text-blue-600" />
                            ) : milestone.status === 'delayed' ? (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                            <span className={cn(
                              "text-sm",
                              milestone.status === 'completed' ? "text-green-700" : "text-gray-600"
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
                    <div className="flex items-center space-x-4">
                      <span>Started: {format(new Date(project.start_date), 'MMM d, yyyy')}</span>
                      <span>Assets: {project.affected_assets.length}</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {project.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {projects.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Infrastructure Projects</h3>
                  <p className="text-gray-600 mb-4">
                    Infrastructure projects will be displayed here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Reports</CardTitle>
              <CardDescription>
                Generate and download infrastructure management reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Download className="w-6 h-6 mb-2" />
                  <span>Asset Condition Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Download className="w-6 h-6 mb-2" />
                  <span>Maintenance Schedule</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Download className="w-6 h-6 mb-2" />
                  <span>Project Status Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Upload className="w-6 h-6 mb-2" />
                  <span>Upload Inspection Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Issue Modal */}
      {showReportIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Report Infrastructure Issue</CardTitle>
              <CardDescription>
                Report a problem with local infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Issue Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pothole">Pothole</SelectItem>
                    <SelectItem value="streetlight">Street Light</SelectItem>
                    <SelectItem value="water_leak">Water Leak</SelectItem>
                    <SelectItem value="sewer_issue">Sewer Issue</SelectItem>
                    <SelectItem value="sidewalk">Sidewalk Damage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Describe the issue..." rows={3} />
              </div>

              <div>
                <Label>Location</Label>
                <Input placeholder="Address or description" />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReportIssue(false)}>
                  Cancel
                </Button>
                <Button className="bg-silas-green hover:bg-silas-green/90">
                  <Camera className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
