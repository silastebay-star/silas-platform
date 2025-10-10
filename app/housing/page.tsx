/**
 * Housing & Community Life Page
 */

'use client'
import UnifiedFloatingNav from '@/components/navigation/UnifiedFloatingNav'
import { SilasCard, SilasEmptyState } from '@/components/ui/silas-components'
import { Home } from 'lucide-react'
import ResidentRegistry from '@/components/housing/ResidentRegistry'
import NeighborhoodFeed from '@/components/housing/NeighborhoodFeed'

export default function HousingPage() {
  const housingFeatures = [
    "Optional resident registry to connect with neighbors",
    "Neighborhood-specific feeds for posts and updates",
    "Geo-notified security alerts for your area",
    "A shared community calendar for local events",
    "Tools for proposing and voting on local issues",
    "Directory of local services like food banks and shelters"
  ]





  const getColorClasses = (color: string) => {
    switch(color) {
      case 'green': return 'from-green-50 to-emerald-50 border-green-200 text-green-700'
      case 'blue': return 'from-blue-50 to-sky-50 border-blue-200 text-blue-700'
      case 'yellow': return 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700'
      case 'orange': return 'from-orange-50 to-red-50 border-orange-200 text-orange-700'
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
              icon={Home}
              title="Housing & Community Life Module Coming Soon"
              description="This module will be the heart of our neighborhoods, providing tools to connect with neighbors, stay informed about local safety, and participate in community life. We are building features like a resident registry, neighborhood feeds, and security alerts."
            />
          </SilasCard>
          
          {/* Neighborhood Feed */}
          <div className="lg:col-span-2">
            <NeighborhoodFeed />
          </div>

          {/* Resident Registry */}
          <ResidentRegistry />

          {/* Feature List */}
          <SilasCard title="Planned Features" description="Housing & Community Life tools in development" className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {housingFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
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
