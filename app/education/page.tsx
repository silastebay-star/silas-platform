/**
 * Education & Skills Page
 */

'use client'
import UnifiedFloatingNav from '@/components/navigation/UnifiedFloatingNav'
import { SilasCard, SilasEmptyState } from '@/components/ui/silas-components'
import { GraduationCap } from 'lucide-react'
import LearningHub from '@/components/education/LearningHub'
import MentorshipNetwork from '@/components/education/MentorshipNetwork'
import BadgeSystem from '@/components/education/BadgeSystem'

export default function EducationPage() {






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
              icon={GraduationCap}
              title="Education & Skills Module Coming Soon"
              description="We are building a collaborative space for community learning. This module will feature a Learning Hub, a mentorship network, and a skill badge system to foster knowledge sharing and personal development for everyone in our community."
            />
          </SilasCard>
          
          {/* Mentorship Network */}
          <div className="lg:col-span-2">
            <MentorshipNetwork />
          </div>

          {/* Learning Hub */}
          <LearningHub />

          {/* Badge System */}
          <div className="lg:col-span-3">
            <BadgeSystem />
          </div>
        </div>
      </main>
    </div>
  )
}