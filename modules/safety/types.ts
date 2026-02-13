/**
 * Safety & Response Module Types
 */

export interface SafetyMetrics {
  active_incidents: number
  resolved_incidents: number
  response_time_avg: number
  emergency_contacts: number
  safety_score: number
  recent_alerts: number
}

export interface EmergencyIncident {
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

export interface EmergencyContact {
  id: string
  name: string
  role: string
  phone: string
  availability: 'available' | 'busy' | 'offline'
  specialties: string[]
}

export interface SafetyInfrastructure {
  id: string
  type: 'camera' | 'lighting' | 'alarm' | 'barrier' | 'signage'
  location: string
  status: 'operational' | 'maintenance' | 'offline'
  last_checked: string
  next_maintenance: string
}
