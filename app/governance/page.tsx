/**
 * Governance & Democracy Page
 */

'use client'
import UnifiedFloatingNav from '@/components/navigation/UnifiedFloatingNav'
import { SilasCard, SilasEmptyState } from '@/components/ui/silas-components'
import { Scale } from 'lucide-react'
import VotingEngine from '@/components/governance/VotingEngine'
import ProposalLifecycle from '@/components/governance/ProposalLifecycle'
import TransparencyLedger from '@/components/governance/TransparencyLedger'

export default function GovernancePage() {






  const getColorClasses = (color: string) => {
    switch(color) {
      case 'green': return 'from-green-50 to-emerald-50 border-green-200 text-green-700'
      case 'blue': return 'from-blue-50 to-sky-50 border-blue-200 text-blue-700'
      case 'yellow': return 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700'
      case 'indigo': return 'from-indigo-50 to-violet-50 border-indigo-200 text-indigo-700'
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
              icon={Scale}
              title="Governance & Democracy Module Coming Soon"
              description="This module will provide the tools for transparent, decentralized decision-making. It will feature a robust voting engine, a clear proposal lifecycle, and a public record of all community decisions to empower every member."
            />
          </SilasCard>
          
          {/* Proposal Lifecycle */}
          <div className="lg:col-span-2">
            <ProposalLifecycle />
          </div>

          {/* Voting Engine */}
          <VotingEngine />

          {/* Transparency Ledger */}
          <div className="lg:col-span-3">
            <TransparencyLedger />
          </div>
        </div>
      </main>
    </div>
  )
}
