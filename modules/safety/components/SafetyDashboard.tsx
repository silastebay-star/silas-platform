/**
 * Safety & Response Dashboard
 * Emergency response and community safety coordination
 */

'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Shield, Phone, MapPin, Clock, Users, Siren, CheckCircle, Cloud } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth/auth-context'
import pinService, { Pin } from '@/lib/services/pin-service'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface SafetyMetrics {
  active_incidents: number
  resolved_incidents: number
  response_time_avg: number
  emergency_contacts: number
  safety_score: number
  recent_alerts: number
}

interface EmergencyIncident {
  id: string
  type: 'fire' | 'medical' | 'crime' | 'accident' | 'weather' | 'infrastructure'
  severity: 'low' | 'medium' | 'high' | 'critical'
  location: string
  description: string
  status: 'reported' | 'responding' | 'resolved'
  reported_at: string
  resolved_at?: string
  reporter: string
  responders?: string[]
}

interface EmergencyContact {
  id: string
  name: string
  role: string
  phone: string
  availability: 'available' | 'busy' | 'offline'
  specialties: string[]
}

const SAFETY_TOOLS = [
  {
    id: 'emergency-report',
    title: 'Emergency Report',
    description: 'Report urgent safety incidents',
    icon: <Siren className="h-5 w-5" />,
    color: 'bg-red-100 text-red-700',
    urgent: true
  },
  {
    id: 'safety-infrastructure',
    title: 'Safety Infrastructure',
    description: 'Monitor safety equipment and infrastructure',
    icon: <Shield className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'emergency-contacts',
    title: 'Emergency Contacts',
    description: 'Access emergency services and contacts',
    icon: <Phone className="h-5 w-5" />,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment',
    description: 'Community risk analysis and prevention',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'bg-orange-100 text-orange-700'
  }
]

const EMERGENCY_NUMBERS = [
  { service: 'Police', number: '999', description: 'Emergency police response' },
  { service: 'Fire Brigade', number: '999', description: 'Fire and rescue services' },
  { service: 'Ambulance', number: '999', description: 'Medical emergencies' },
  { service: 'Non-Emergency Police', number: '101', description: 'Non-urgent police matters' },
  { service: 'NHS 111', number: '111', description: 'Non-emergency medical advice' }
]

export default function SafetyDashboard() {
  const [safetyPins, setSafetyPins] = useState<Pin[]>([])
  const [metrics, setMetrics] = useState<SafetyMetrics | null>(null)
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    loadSafetyData()
  }, [])

  const loadSafetyData = async () => {
    try {
      setLoading(true)
      
      // Load safety-related pins
      const { pins } = await pinService.getPins({
        category: ['safety']
      })
      setSafetyPins(pins)

      // Mock safety metrics
      setMetrics({
        active_incidents: 3,
        resolved_incidents: 47,
        response_time_avg: 8.5,
        emergency_contacts: 12,
        safety_score: 87,
        recent_alerts: 2
      })

      // Mock recent incidents
      setIncidents([
        {
          id: '1',
          type: 'infrastructure',
          severity: 'medium',
          location: 'Manchester Road',
          description: 'Streetlight outage creating safety hazard',
          status: 'responding',
          reported_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          reporter: 'Local Resident',
          responders: ['Council Maintenance']
        },
        {
          id: '2',
          type: 'weather',
          severity: 'low',
          location: 'Community Center',
          description: 'Flooding in car park after heavy rain',
          status: 'resolved',
          reported_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          resolved_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          reporter: 'Center Staff'
        },
        {
          id: '3',
          type: 'crime',
          severity: 'high',
          location: 'Park Area',
          description: 'Suspicious activity reported near playground',
          status: 'reported',
          reported_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          reporter: 'Anonymous'
        }
      ])

      // Mock emergency contacts
      setEmergencyContacts([
        {
          id: '1',
          name: 'Dr. Sarah Mitchell',
          role: 'Community First Aid Coordinator',
          phone: '+44 7700 900123',
          availability: 'available',
          specialties: ['First Aid', 'Medical Emergency']
        },
        {
          id: '2',
          name: 'Mike Thompson',
          role: 'Fire Safety Warden',
          phone: '+44 7700 900456',
          availability: 'available',
          specialties: ['Fire Safety', 'Evacuation']
        },
        {
          id: '3',
          name: 'Emma Wilson',
          role: 'Community Safety Officer',
          phone: '+44 7700 900789',
          availability: 'busy',
          specialties: ['Crime Prevention', 'Safety Planning']
        }
      ])
    } catch (error) {
      console.error('Error loading safety data:', error)
      toast.error('Failed to load safety data')
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
      case 'responding': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-yellow-100 text-yellow-800'
      case 'offline': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'fire': return <Siren className="h-4 w-4 text-red-600" />
      case 'medical': return <Phone className="h-4 w-4 text-blue-600" />
      case 'crime': return <Shield className="h-4 w-4 text-purple-600" />
      case 'accident': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'weather': return <Cloud className="h-4 w-4 text-gray-600" />
      case 'infrastructure': return <MapPin className="h-4 w-4 text-brown-600" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
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
      {/* Active Alerts */}
      {metrics && metrics.recent_alerts > 0 && (
        <Alert variant="default" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{metrics.recent_alerts} active safety alerts</strong> in your area. 
            Check the incidents tab for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Safety Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="">
              <div className="text-2xl font-bold text-green-600">{metrics.safety_score}</div>
              <p className="text-xs text-muted-foreground">
                Community safety rating
              </p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="">
              <div className="text-2xl font-bold text-orange-600">{metrics.active_incidents}</div>
              <p className="text-xs text-muted-foreground">
                Requiring attention
              </p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="">
              <div className="text-2xl font-bold">{metrics.response_time_avg}min</div>
              <p className="text-xs text-muted-foreground">
                Emergency response average
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Safety Tools */}
      <Card className="">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Safety & Emergency Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAFETY_TOOLS.map(tool => (
              <Button
                key={tool.id}
                size="default"
                variant={tool.urgent ? "destructive" : "outline"}
                onClick={() => setSelectedTool(tool.id)}
                className={cn(
                  "h-auto p-4 justify-start",
                  tool.urgent && "animate-pulse"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={cn("p-2 rounded-lg", !tool.urgent && tool.color)}>
                    {tool.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{tool.title}</div>
                    <div className={cn(
                      "text-sm",
                      tool.urgent ? "text-red-100" : "text-muted-foreground"
                    )}>
                      {tool.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Numbers */}
      <Card className="">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Emergency Numbers
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EMERGENCY_NUMBERS.map(contact => (
              <div key={contact.service} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{contact.service}</div>
                  <div className="text-sm text-muted-foreground">{contact.description}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${contact.number}`)}
                  className="font-mono"
                >
                  {contact.number}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
