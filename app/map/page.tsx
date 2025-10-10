'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import AppLayout from '@/components/layout/AppLayout'
import { usePinsStore } from '@/store/pins'

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })
const UnifiedFloatingNav = dynamic(() => import('@/components/navigation/UnifiedFloatingNav'), { ssr: false })

export default function MapPage() {
  const { fetchPins } = usePinsStore()

  useEffect(() => {
    fetchPins()
  }, [fetchPins])

  return (
    <div className="min-h-screen">
      <AppLayout>
        {({ filteredPins, showAddPinModal, setShowAddPinModal, searchQuery }) => (
          <>
            <UnifiedFloatingNav
              searchQuery={searchQuery}
              onAddPin={() => setShowAddPinModal(true)}
            />
            <MapView
              filteredPins={filteredPins}
              showAddPinModal={showAddPinModal}
              setShowAddPinModal={setShowAddPinModal}
            />
          </>
        )}
      </AppLayout>
    </div>
  )
}
