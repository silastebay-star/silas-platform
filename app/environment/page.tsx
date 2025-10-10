/**
 * Environment & Sustainability Page
 */

'use client'
import UnifiedFloatingNav from '@/components/navigation/UnifiedFloatingNav'
import { SilasCard, SilasEmptyState } from '@/components/ui/silas-components'
import { Leaf } from 'lucide-react'
import SpeciesLogbook from '@/components/environment/SpeciesLogbook'



export default function EnvironmentPage() {
  const environmentalFeatures = [
    "Carbon footprint tracking and reduction goals",
    "Community energy usage monitoring",
    "Green space and biodiversity mapping",
    "Waste reduction and recycling analytics",
    "Renewable energy project coordination",
    "Environmental impact assessments"
  ]

  const sustainabilityMetrics = [
    { label: "CO2 Reduced", value: "45 tonnes", change: "This year", color: "green" },
    { label: "Trees Planted", value: "89", change: "Community effort", color: "green" },
    { label: "Waste Diverted", value: "2.3 tonnes", change: "From landfill", color: "blue" },
    { label: "Energy Saved", value: "12%", change: "vs last year", color: "yellow" }
  ]



  const getColorClasses = (color: string) => {
    switch(color) {
      case 'green': return 'from-green-50 to-emerald-50 border-green-200 text-green-700'
      case 'blue': return 'from-blue-50 to-sky-50 border-blue-200 text-blue-700'
      case 'yellow': return 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700'
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
              icon={Leaf}
              title="Environment Module Coming Soon"
              description="We're building comprehensive environmental tracking and sustainability tools to help our community monitor progress, coordinate green initiatives, and make data-driven decisions for environmental stewardship."
            />
          </SilasCard>
          
          {/* Environmental Metrics */}
          <div className="lg:col-span-2">
            <SilasCard title="Sustainability Dashboard" description="Track our environmental impact and progress">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {sustainabilityMetrics.map((metric, index) => (
                  <div key={index} className={`p-4 rounded-lg bg-gradient-to-br border ${getColorClasses(metric.color)}`}>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                    <div className="text-xs mt-1 opacity-75">{metric.change}</div>
                  </div>
                ))}
              </div>
              
              {/* Mock Chart Area */}
              <div className="h-32 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border border-green-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-green-700 font-medium mb-1">🌱 Carbon Reduction Trend</div>
                  <div className="text-sm text-green-600">Interactive charts will show progress over time</div>
                </div>
              </div>
            </SilasCard>
          </div>

          {/* Species Logbook */}
          <SpeciesLogbook />

          {/* Feature List */}
          <SilasCard title="Planned Features" description="Environmental tools in development" className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {environmentalFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
