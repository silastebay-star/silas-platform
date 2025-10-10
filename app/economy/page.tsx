/**
 * Local Economy Page
 */

'use client'

import { useState } from 'react'
import UnifiedFloatingNav from '@/components/navigation/UnifiedFloatingNav'
import { SilasCard, SilasEmptyState } from '@/components/ui/silas-components'
import { Building2, DollarSign } from 'lucide-react'
import BusinessDirectory from '@/components/economy/BusinessDirectory'
import MicrofundingRequestForm from '@/components/economy/MicrofundingRequestForm'
import { Button } from '@/components/ui/button'



export default function EconomyPage() {
  const [showMicrofundingModal, setShowMicrofundingModal] = useState(false);

  const handleSubmitMicrofunding = async (requestData: any) => {
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setShowMicrofundingModal(false);
      alert('Microfunding request submitted successfully!');
    } catch (error) {
      console.error('Failed to submit microfunding request:', error);
      alert('Failed to submit microfunding request.');
    }
  };

  const economicFeatures = [
    "Local business directory and profiles",
    "Community marketplace for local goods",
    "Economic impact tracking and analytics",
    "Business networking and collaboration tools",
    "Local procurement and supply chain mapping",
    "Community currency and exchange systems"
  ]



  const economicMetrics = [
    { label: "Local Businesses", value: "127", change: "+8% this year" },
    { label: "Community Jobs", value: "342", change: "+12 new positions" },
    { label: "Local Spending", value: "£2.1M", change: "+15% retention" },
    { label: "Circular Economy", value: "68%", change: "Resource reuse rate" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedFloatingNav showSearch={false} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Empty State */}
          <SilasCard className="lg:col-span-2">
            <SilasEmptyState
              icon={Building2}
              title="Local Economy Module Coming Soon"
              description="We're developing a comprehensive system to support local businesses, track economic impact, and strengthen our community's economic resilience through data-driven insights and collaboration tools."
            />
          </SilasCard>
          
          {/* Economic Metrics Preview */}
          <SilasCard title="Economic Dashboard Preview" description="Key metrics we'll track for community prosperity">
            <div className="grid grid-cols-2 gap-4">
              {economicMetrics.map((metric, index) => (
                <div key={index} className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{metric.value}</div>
                  <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                  <div className="text-xs text-green-600 mt-1">{metric.change}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">
                📊 Real-time economic health monitoring for our community
              </p>
            </div>
          </SilasCard>

                    {/* Business Directory */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Local Business Directory</h3>
                      <Button onClick={() => setShowMicrofundingModal(true)} size="sm">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Request Microfunding
                      </Button>
                    </div>
                    <BusinessDirectory />
          
                    {/* Microfunding Request Modal */}
                    {showMicrofundingModal && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                          <MicrofundingRequestForm
                            onClose={() => setShowMicrofundingModal(false)}
                            onSubmit={handleSubmitMicrofunding}
                          />
                        </div>
                      </div>
                    )}
          {/* Feature List */}
          <SilasCard title="Planned Features" description="What's coming to the Economy module" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {economicFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
