/**
 * Safety & Emergency Page
 */

'use client'
import { useState } from 'react'
import UnifiedFloatingNav from '@/components/navigation/UnifiedFloatingNav'
import { SilasCard, SilasEmptyState } from '@/components/ui/silas-components'
import { AlertTriangle, Plus } from 'lucide-react'
import CrimeReportForm from '@/components/safety/CrimeReportForm'
import { Button } from '@/components/ui/button'

export default function SafetyPage() {
  const safetyFeatures = [
    "Real-time incident reporting and tracking",
    "Geo-alert system for nearby emergencies",
    "Community responder coordination tools",
    "Safety heatmap visualization based on reports",
    "CCTV request and evidence sharing platform",
    "Directory of safe places and refuge points"
  ]

  const safetyMetrics = [
    { label: "Incidents Reported", value: "7", change: "This month", color: "red" },
    { label: "Alerts Sent", value: "3", change: "Last 24 hours", color: "yellow" },
    { label: "Responders Active", value: "15", change: "Currently online", color: "green" },
    { label: "Safe Places Listed", value: "20", change: "Community verified", color: "blue" }
  ]

  const mockIncidents = [
    { 
      name: "Vandalism at Park Entrance", 
      status: "Reported", 
      type: "Vandalism", 
      location: "Central Park",
      description: "Graffiti found on the main gate of Central Park."
    },
    { 
      name: "Lost Child Alert", 
      status: "Resolved", 
      type: "Missing Person", 
      location: "Town Square",
      description: "Child found safe and reunited with parents."
    },
    { 
      name: "Suspicious Activity", 
      status: "Investigating", 
      type: "Suspicious Activity", 
      location: "High Street",
      description: "Unusual activity reported near the old bank building."
    }
  ]

  const [showReportFormModal, setShowReportFormModal] = useState(false);

  const handleSubmitReport = async (reportData: any) => {
    try {
      const response = await fetch('/api/crime-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setShowReportFormModal(false);
      alert('Crime report submitted successfully!');
    } catch (error) {
      console.error('Failed to submit crime report:', error);
      alert('Failed to submit crime report.');
    }
  };

  const getColorClasses = (color: string) => {
    switch(color) {
      case 'green': return 'from-green-50 to-emerald-50 border-green-200 text-green-700'
      case 'blue': return 'from-blue-50 to-sky-50 border-blue-200 text-blue-700'
      case 'yellow': return 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700'
      case 'red': return 'from-red-50 to-rose-50 border-red-200 text-red-700'
      default: return 'from-gray-50 to-gray-100 border-gray-200 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedFloatingNav showSearch={false} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Empty State */}
          <SilasCard className="lg:col-span-3">
            <SilasEmptyState
              icon={AlertTriangle}
              title="Safety & Emergency Module Coming Soon"
              description="This module will enable real-time community response to incidents and resilience planning. We are building features like incident reporting, geo-alerts, and responder coordination to enhance community safety."
            />
          </SilasCard>
          
          {/* Safety Metrics */}
          <div className="lg:col-span-2">
            <SilasCard title="Safety Dashboard" description="Key metrics for community safety and response">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {safetyMetrics.map((metric, index) => (
                  <div key={index} className={`p-4 rounded-lg bg-gradient-to-br border ${getColorClasses(metric.color)}`}>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                    <div className="text-xs mt-1 opacity-75">{metric.change}</div>
                  </div>
                ))}
              </div>
              
              {/* Mock Chart Area */}
              <div className="h-32 bg-gradient-to-r from-red-100 to-rose-100 rounded-lg border border-red-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-red-700 font-medium mb-1">🚨 Incident Trends</div>
                  <div className="text-sm text-red-600">Interactive charts will show incident frequency and types over time</div>
                </div>
              </div>
            </SilasCard>
          </div>

          {/* Recent Incidents */}
          <div className="lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
              <Button onClick={() => setShowReportFormModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Report Incident
              </Button>
            </div>
            <SilasCard description="Community reported safety incidents">
              <div className="space-y-4">
                {mockIncidents.map((incident, index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{incident.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        incident.status === 'Reported' ? 'bg-yellow-100 text-yellow-700' : 
                        incident.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{incident.description}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Type: {incident.type}</span>
                      <span className={`font-medium text-gray-600`}>
                        Location: {incident.location}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">
                    🛡️ Stay informed and contribute to a safer community.
                  </p>
                </div>
              </div>
            </SilasCard>
          </div>

          {/* Feature List */}
          <SilasCard title="Planned Features" description="Safety & Emergency tools in development" className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safetyFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border border-red-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </SilasCard>
        </div>
      </main>
    </div>
  )
}
