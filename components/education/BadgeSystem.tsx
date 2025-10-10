/**
 * BadgeSystem Component
 * Displays earned badges and achievements.
 */

'use client'

import { SilasCard } from '@/components/ui/silas-components'
import { Award, Star } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedDate: string
}

const mockBadges: Badge[] = [
  {
    id: 'badge_1',
    name: 'Community Builder',
    description: 'Awarded for initiating and successfully completing a community project.',
    icon: '🏆',
    earnedDate: '2025-03-10'
  },
  {
    id: 'badge_2',
    name: 'Eco Warrior',
    description: 'Awarded for significant contributions to environmental sustainability.',
    icon: '🌿',
    earnedDate: '2025-05-22'
  },
  {
    id: 'badge_3',
    name: 'Knowledge Sharer',
    description: 'Awarded for consistently contributing valuable resources to the Learning Hub.',
    icon: '💡',
    earnedDate: '2025-07-01'
  }
]

export default function BadgeSystem() {
  return (
    <SilasCard title="Earned Badges" description="Recognizing your contributions and achievements.">
      <div className="space-y-4">
        {mockBadges.map(badge => (
          <div key={badge.id} className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{badge.icon}</span>
              <h4 className="font-medium text-gray-900 text-sm">{badge.name}</h4>
            </div>
            <p className="text-xs text-gray-600 mb-1">{badge.description}</p>
            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
              <Star className="w-3 h-3" />
              <span>Earned: {badge.earnedDate}</span>
            </div>
          </div>
        ))}
      </div>
    </SilasCard>
  )
}
