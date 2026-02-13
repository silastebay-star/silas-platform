/**
 * ProposalLifecycle Component
 * Displays the lifecycle stages of a proposal (Draft -> Debate -> Vote -> Archive).
 */

'use client'

import { SilasCard } from '@/components/ui/silas-components'
import { FileText, MessageSquare, CheckSquare, Archive } from 'lucide-react'

interface ProposalStage {
  name: string
  description: string
  icon: React.ElementType
  color: string
}

const proposalStages: ProposalStage[] = [
  {
    name: 'Draft',
    description: 'Initial idea and proposal formulation.',
    icon: FileText,
    color: 'text-gray-500'
  },
  {
    name: 'Debate',
    description: 'Community discussion and feedback on the proposal.',
    icon: MessageSquare,
    color: 'text-blue-500'
  },
  {
    name: 'Vote',
    description: 'Formal voting period for community members.',
    icon: CheckSquare,
    color: 'text-green-500'
  },
  {
    name: 'Archive',
    description: 'Decision recorded and proposal archived.',
    icon: Archive,
    color: 'text-purple-500'
  }
]

export default function ProposalLifecycle() {
  const currentStageIndex = 1; // Example: Debate stage is current

  return (
    <SilasCard title="Proposal Lifecycle" description="Track the journey of community proposals.">
      <div className="space-y-6">
        {proposalStages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index <= currentStageIndex;
          return (
            <div key={stage.name} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {index < proposalStages.length - 1 && (
                  <div className={`w-0.5 h-10 ${isActive ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium text-lg ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{stage.name}</h4>
                <p className="text-sm text-gray-700">{stage.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </SilasCard>
  )
}
