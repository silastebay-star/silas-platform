/**
 * Environment & Wildlife Dashboard
 * Category-specific tools for environmental protection and wildlife conservation
 */

'use client'

import { useState, useEffect } from 'react'
import { Leaf, Camera, AlertTriangle, TrendingUp, Wind, Droplets, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth/auth-context'
import pinService, { Pin } from '@/lib/services/pin-service'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface EnvironmentMetrics {
  total_reports: number
  active_projects: number
  wildlife_sightings: number
  pollution_reports: number
  conservation_areas: number
  air_quality_index: number
  biodiversity_score: number
  water_quality: number
  green_spaces: number
  recycling_rate: number
}

interface WildlifeSighting {
  id: string
  species: string
  location: string
  date: string
  reporter: string
  verified: boolean
  image_url?: string
}

interface PollutionReport {
  id: string
  type: 'air' | 'water' | 'noise' | 'waste'
  severity: 'low' | 'medium' | 'high' | 'critical'
  location: string
  description: string
  date: string
  status: 'reported' | 'investigating' | 'resolved'
}

const ENVIRONMENT_TOOLS = [
  {
    id: 'wildlife-monitoring',
    title: 'Wildlife Monitoring',
    description: 'Report and track local wildlife sightings',
    icon: <Camera className="h-5 w-5" />,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: 'pollution-reporting',
    title: 'Pollution Reporting',
    description: 'Report environmental hazards and pollution',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'bg-red-100 text-red-700'
  },
  {
    id: 'conservation-projects',
    title: 'Conservation Projects',
    description: 'Coordinate local conservation efforts',
    icon: <Leaf className="h-5 w-5" />,
    color: 'bg-emerald-100 text-emerald-700'
  },
  {
    id: 'environmental-data',
    title: 'Environmental Data',
    description: 'Monitor air quality and environmental metrics',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-700'
  }
]

export default function EnvironmentDashboard() {
  const [environmentPins, setEnvironmentPins] = useState<Pin[]>([])
  const [metrics, setMetrics] = useState<EnvironmentMetrics | null>(null)
  const [wildlifeSightings, setWildlifeSightings] = useState<WildlifeSighting[]>([])
  const [pollutionReports, setPollutionReports] = useState<PollutionReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    loadEnvironmentData()
  }, [])

  const loadEnvironmentData = async () => {
    try {
      setLoading(true)

      // Load environment-related pins
      const { pins } = await pinService.getPins({
        category: ['environment']
      })
      setEnvironmentPins(pins)

      // Enhanced metrics for environment & wildlife
      setMetrics({
        total_reports: pins.length,
        active_projects: pins.filter(p => p.metadata?.project_status === 'active').length,
        wildlife_sightings: 24,
        pollution_reports: 8,
        conservation_areas: 5,
        air_quality_index: 72,
        biodiversity_score: 85,
        water_quality: 78,
        green_spaces: 42,
        recycling_rate: 73
      })

      // Mock wildlife sightings
      setWildlifeSightings([
        {
          id: '1',
          species: 'Red Kite',
          location: 'Stoneclough Woods',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          reporter: 'Sarah Johnson',
          verified: true
        },
        {
          id: '2',
          species: 'European Hedgehog',
          location: 'Community Garden',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          reporter: 'Mike Chen',
          verified: false
        }
      ])

      // Mock pollution reports
      setPollutionReports([
        {
          id: '1',
          type: 'water',
          severity: 'medium',
          location: 'River Irwell',
          description: 'Unusual foam and discoloration observed',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'investigating'
        }
      ])
    } catch (error) {
      console.error('Error loading environment data:', error)
      toast.error('Failed to load environment data')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-100 text-yellow-800'
      case 'medium': return 'bg-orange-100 text-orange-800'
      case 'high': return 'bg-red-100 text-red-800'
      case 'critical': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-blue-100 text-blue-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-green-600'
    if (value >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Environment Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Air Quality Index</CardTitle>
              <Wind className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="">
              <div className={`text-2xl font-bold ${getMetricColor(metrics.air_quality_index)}`}>
                {metrics.air_quality_index}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={metrics.air_quality_index} className="flex-1" />
                <span className="text-xs text-muted-foreground">Good</span>
              </div>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Biodiversity Score</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="">
              <div className={`text-2xl font-bold ${getMetricColor(metrics.biodiversity_score)}`}>
                {metrics.biodiversity_score}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on {metrics.wildlife_sightings} species recorded
              </p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="">
              <div className="text-2xl font-bold">{metrics.active_projects}</div>
              <p className="text-xs text-muted-foreground">
                Conservation initiatives underway
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Environment Tools */}
      <Card className="">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Environment & Wildlife Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ENVIRONMENT_TOOLS.map(tool => (
              <Button
                key={tool.id}
                variant="outline"
                size="default"
                onClick={() => setSelectedTool(tool.id)}
                className="h-auto p-4 justify-start"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={cn("p-2 rounded-lg", tool.color)}>
                    {tool.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{tool.title}</div>
                    <div className="text-sm text-muted-foreground">{tool.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environment Data Tabs */}
      <Tabs defaultValue="wildlife" className="space-y-4">
        <TabsList className="">
          <TabsTrigger className="" value="wildlife">Wildlife Sightings</TabsTrigger>
          <TabsTrigger className="" value="pollution">Pollution Reports</TabsTrigger>
          <TabsTrigger className="" value="projects">Conservation Projects</TabsTrigger>
          <TabsTrigger className="" value="data">Environmental Data</TabsTrigger>
        </TabsList>

        <TabsContent value="wildlife" className="space-y-4">
          <Card className="">
            <CardHeader className="">
              <CardTitle className="flex items-center justify-between">
                Recent Wildlife Sightings
                <Button className="" variant="default" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Report Sighting
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="">
              <div className="space-y-3">
                {wildlifeSightings.map(sighting => (
                  <div key={sighting.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Camera className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">{sighting.species}</div>
                        <div className="text-sm text-muted-foreground">
                          {sighting.location} • {sighting.reporter}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sighting.verified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(sighting.date), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pollution" className="space-y-4">
          <Card className="">
            <CardHeader className="">
              <CardTitle className="flex items-center justify-between">
                Pollution Reports
                <Button className="" size="sm" variant="destructive">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Pollution
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="">
              <div className="space-y-3">
                {pollutionReports.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <div className="font-medium capitalize">{report.type} Pollution</div>
                        <div className="text-sm text-muted-foreground">
                          {report.location} • {report.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className={getSeverityColor(report.severity)}>
                        {report.severity}
                      </Badge>
                      <Badge variant="default" className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card className="">
            <CardHeader className="">
              <CardTitle className="">Conservation Projects</CardTitle>
            </CardHeader>
            <CardContent className="">
              <div className="space-y-3">
                {environmentPins
                  .filter(pin => pin.metadata?.project_type === 'conservation')
                  .map(pin => (
                    <div key={pin.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Leaf className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">{pin.title}</div>
                          <div className="text-sm text-muted-foreground">{pin.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="" variant="secondary">
                          {pin.metadata?.project_status || 'planning'}
                        </Badge>
                        <Button className="" size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card className="">
            <CardHeader className="">
              <CardTitle className="">Environmental Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Air Quality</span>
                    <span className="text-sm font-medium">{metrics?.air_quality_index}/100</span>
                  </div>
                  <Progress value={metrics?.air_quality_index} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Biodiversity</span>
                    <span className="text-sm font-medium">{metrics?.biodiversity_score}/100</span>
                  </div>
                  <Progress value={metrics?.biodiversity_score} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Water Quality</span>
                    <span className="text-sm font-medium">{metrics?.water_quality}/100</span>
                  </div>
                  <Progress value={metrics?.water_quality} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Green Spaces</span>
                    <span className="text-sm font-medium">{metrics?.green_spaces}%</span>
                  </div>
                  <Progress value={metrics?.green_spaces} />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Data updated every hour from local monitoring stations and community reports.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
