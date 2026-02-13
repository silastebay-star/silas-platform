/**
 * TransparencyLedger Component
 * Displays an immutable record of community decisions.
 */

'use client'

import { SilasCard } from '@/components/ui/silas-components'
import { Book, CheckCircle, Users } from 'lucide-react'

interface DecisionRecord {
  id: string
  decision: string
  proposer: string
  date: string
  status: 'ratified' | 'vetoed'
}

const mockDecisions: DecisionRecord[] = [
  {
    id: 'dec_1',
    decision: 'Approval of new community park design',
    proposer: 'Infrastructure Committee',
    date: '2025-10-01',
    status: 'ratified'
  },
  {
    id: 'dec_2',
    decision: 'Allocation of £5,000 for local business grants',
    proposer: 'Economy & Commerce Group',
    date: '2025-09-25',
    status: 'ratified'
  },
  {
    id: 'dec_3',
    decision: 'Proposal to ban single-use plastics in town center',
    proposer: 'Environmental Action Group',
    date: '2025-09-15',
    status: 'vetoed'
  }
]

const getStatusClasses = (status: DecisionRecord['status']) => {
  switch(status) {
    case 'ratified': return 'bg-green-100 text-green-700'
    case 'vetoed': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function TransparencyLedger() {
  return (
    <SilasCard title="Transparency Ledger" description="Immutable record of all community decisions.">
      <div className="space-y-4">
        {mockDecisions.map(record => (
          <div key={record.id} className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <Book className="w-5 h-5 text-indigo-600" />
              <h4 className="font-medium text-gray-900 text-sm">{record.decision}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusClasses(record.status)}`}>
                {record.status}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-1">Proposed by: {record.proposer}</p>
            <p className="text-xs text-gray-600">Date: {record.date}</p>
          </div>
        ))}
      </div>
    </SilasCard>
  )
}
