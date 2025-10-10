/**
 * Infrastructure & Planning Page
 */

'use client'

import { useState } from 'react'
import UnifiedFloatingNav from '@/components/navigation/UnifiedFloatingNav'
import { SilasCard, SilasEmptyState } from '@/components/ui/silas-components'
import { Wrench, Plus } from 'lucide-react'
import ProposalList from '@/components/proposals/ProposalList'
import CreateProposalForm from '@/components/proposals/CreateProposalForm'
import { Button } from '@/components/ui/button'

export default function InfrastructurePage() {
  const [showCreateProposalModal, setShowCreateProposalModal] = useState(false);

  const handleCreateProposal = async (proposalData: any) => {
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Optionally, re-fetch proposals to update the list
      // This would require a mechanism to trigger re-fetch in ProposalList
      // For now, just close the modal
      setShowCreateProposalModal(false);
      alert('Proposal submitted successfully!');
    } catch (error) {
      console.error('Failed to create proposal:', error);
      alert('Failed to submit proposal.');
    }
  };

  const infrastructureFeatures = [
    "Proposal voting for new developments",
    "Community-led funding requests for repairs",
    "Project progress tracking (Proposed → Approved → In Progress → Completed)",
    "Public comment threads on all proposals",
    "Census data integration to identify areas in need",
    "Maintenance request submission and tracking"
  ]

  const infrastructureMetrics = [
    { label: "Proposals Approved", value: "12", change: "This quarter", color: "blue" },
    { label: "Budget Allocated", value: "£15,700", change: "Community fund", color: "green" },
    { label: "Projects Completed", value: "7", change: "This year", color: "green" },
    { label: "Open Maintenance Requests", value: "28", change: "High priority", color: "yellow" }
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
              icon={Wrench}
              title="Infrastructure & Planning Module Coming Soon"
              description="We're developing tools to empower our community to track, propose, and discuss local infrastructure improvements. This module will feature proposal voting, funding requests, and progress tracking to ensure transparent and democratic development."
            />
          </SilasCard>
          
          {/* Infrastructure Metrics */}
          <div className="lg:col-span-2">
            <SilasCard title="Infrastructure Dashboard" description="Key metrics for local projects and proposals">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {infrastructureMetrics.map((metric, index) => (
                  <div key={index} className={`p-4 rounded-lg bg-gradient-to-br border ${getColorClasses(metric.color)}`}>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                    <div className="text-xs mt-1 opacity-75">{metric.change}</div>
                  </div>
                ))}
              </div>
              
              {/* Mock Chart Area */}
              <div className="h-32 bg-gradient-to-r from-slate-100 to-gray-100 rounded-lg border border-slate-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-slate-700 font-medium mb-1">🏗️ Project Completion Rate</div>
                  <div className="text-sm text-slate-600">Interactive charts will show project timelines and outcomes</div>
                </div>
              </div>
            </SilasCard>
          </div>

          {/* Community Proposals */}
          <div className="lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Community Proposals</h3>
              <Button onClick={() => setShowCreateProposalModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Proposal
              </Button>
            </div>
            <ProposalList />
          </div>

          {/* Create Proposal Modal */}
          {showCreateProposalModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <CreateProposalForm
                  onClose={() => setShowCreateProposalModal(false)}
                  onSubmit={handleCreateProposal}
                />
              </div>
            </div>
          )}

          {/* Feature List */}
          <SilasCard title="Planned Features" description="Infrastructure tools in development" className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {infrastructureFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200">
                  <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
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
