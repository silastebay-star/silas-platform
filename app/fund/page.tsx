/**
 * Community Fund Page
 */

import { Metadata } from 'next'
import { FundDashboard } from '@/modules/fund'
import UnifiedFloatingNav from '@/components/navigation/UnifiedFloatingNav'

export const metadata: Metadata = {
  title: 'Community Fund | SILAS',
  description: 'Democratic funding for community projects and initiatives',
}

export default function FundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedFloatingNav showSearch={false} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FundDashboard />
      </main>
    </div>
  )
}
