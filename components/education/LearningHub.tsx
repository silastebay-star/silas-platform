/**
 * LearningHub Component
 * Displays educational resources and guides.
 */

'use client'

import { SilasCard } from '@/components/ui/silas-components'
import { BookOpen, GraduationCap, Lightbulb } from 'lucide-react'

interface Resource {
  id: string
  title: string
  type: 'guide' | 'tutorial' | 'data_set' | 'project_result'
  author: string
  description: string
}

const mockResources: Resource[] = [
  {
    id: 'res_1',
    title: 'Beginner\'s Guide to Composting',
    type: 'guide',
    author: 'Environmental Group',
    description: 'Learn how to start your own compost bin at home.'
  },
  {
    id: 'res_2',
    title: 'Local History Project: The Mill',
    type: 'project_result',
    author: 'History Society',
    description: 'Research findings on the historical significance of the old mill.'
  },
  {
    id: 'res_3',
    title: 'DIY Rainwater Harvesting Tutorial',
    type: 'tutorial',
    author: 'Sustainable Living Collective',
    description: 'Step-by-step instructions for building a rainwater collection system.'
  }
]

const getIcon = (type: Resource['type']) => {
  switch (type) {
    case 'guide': return <BookOpen className="w-5 h-5 text-blue-600" />
    case 'tutorial': return <Lightbulb className="w-5 h-5 text-yellow-600" />
    case 'data_set': return <GraduationCap className="w-5 h-5 text-purple-600" />
    case 'project_result': return <GraduationCap className="w-5 h-5 text-green-600" />
    default: return <BookOpen className="w-5 h-5 text-gray-500" />
  }
}

export default function LearningHub() {
  return (
    <SilasCard title="Learning Hub" description="Educational resources and community-sourced knowledge.">
      <div className="space-y-4">
        {mockResources.map(resource => (
          <div key={resource.id} className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center space-x-3 mb-2">
              {getIcon(resource.type)}
              <h4 className="font-medium text-gray-900 text-sm">{resource.title}</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                {resource.type.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-1">Author: {resource.author}</p>
            <p className="text-sm text-gray-700">{resource.description}</p>
          </div>
        ))}
      </div>
    </SilasCard>
  )
}
