/**
 * MentorshipNetwork Component
 * Displays a network of mentors and mentees.
 */

'use client'

import { SilasCard } from '@/components/ui/silas-components'
import { User, MessageSquare, Award } from 'lucide-react'

interface Mentor {
  id: string
  name: string
  expertise: string
  status: 'available' | 'busy' | 'offline'
  mentees: number
}

const mockMentors: Mentor[] = [
  {
    id: 'mentor_1',
    name: 'Dr. Emily White',
    expertise: 'Environmental Science',
    status: 'available',
    mentees: 3
  },
  {
    id: 'mentor_2',
    name: 'Mr. David Green',
    expertise: 'Software Development',
    status: 'busy',
    mentees: 5
  },
  {
    id: 'mentor_3',
    name: 'Ms. Sarah Brown',
    expertise: 'Community Organizing',
    status: 'available',
    mentees: 2
  }
]

const getStatusClasses = (status: Mentor['status']) => {
  switch(status) {
    case 'available': return 'bg-green-100 text-green-700'
    case 'busy': return 'bg-yellow-100 text-yellow-700'
    case 'offline': return 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function MentorshipNetwork() {
  return (
    <SilasCard title="Mentorship Network" description="Connect with local experts and learners.">
      <div className="space-y-4">
        {mockMentors.map(mentor => (
          <div key={mentor.id} className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center space-x-3 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900 text-sm">{mentor.name}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusClasses(mentor.status)}`}>
                {mentor.status}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-1">Expertise: {mentor.expertise}</p>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-gray-500">{mentor.mentees} Mentees</span>
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3 h-3 text-gray-500" />
                <span className="text-gray-500">Message</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SilasCard>
  )
}
