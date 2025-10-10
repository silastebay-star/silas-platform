/**
 * Arts & Culture Page
 */

'use client'
import UnifiedFloatingNav from '@/components/navigation/UnifiedFloatingNav'
import { SilasCard, SilasEmptyState } from '@/components/ui/silas-components'
import { Palette } from 'lucide-react'
import EventCalendar from '@/components/culture/EventCalendar'
import StoryMap from '@/components/culture/StoryMap'

export default function CulturePage() {
  const cultureFeatures = [
    "A community event calendar with RSVP and reminders",
    "Interactive Story Maps for historical overlays and timelines",
    "A platform for proposing and voting on cultural projects",
    "A network to connect with and support local artists",
    "A publicly viewable media archive for community stories",
    "Tools for managing performance venues and exhibitions"
  ]





  const getColorClasses = (color: string) => {
    switch(color) {
      case 'green': return 'from-green-50 to-emerald-50 border-green-200 text-green-700'
      case 'blue': return 'from-blue-50 to-sky-50 border-blue-200 text-blue-700'
      case 'yellow': return 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700'
      case 'purple': return 'from-purple-50 to-violet-50 border-purple-200 text-purple-700'
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
              icon={Palette}
              title="Arts & Culture Module Coming Soon"
              description="This module will be a space to preserve and amplify our community's cultural identity. We are building tools like an event calendar, historical story maps, an artist network, and a public media archive to celebrate our creative expression."
            />
          </SilasCard>
          
          {/* Historical Story Map */}
          <div className="lg:col-span-2">
            <StoryMap />
          </div>

          {/* Cultural Event Calendar */}
          <EventCalendar />

          {/* Feature List */}
          <SilasCard title="Planned Features" description="Arts & Culture tools in development" className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cultureFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
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
