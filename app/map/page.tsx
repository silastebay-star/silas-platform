'use client'

import { useEffect } from 'react'
import MapView from '@/components/map/MapView'
import AppLayout from '@/components/layout/AppLayout'
import { usePinsStore } from '@/store/pins'

export default function MapPage() {
  const { fetchPins } = usePinsStore()

  useEffect(() => {
    fetchPins()
  }, [fetchPins])

  return (
    <AppLayout>
      {({ filteredPins, showAddPinModal, setShowAddPinModal }) => (
        <MapView
          filteredPins={filteredPins}
          showAddPinModal={showAddPinModal}
          setShowAddPinModal={setShowAddPinModal}
        />
      )}
    </AppLayout>
  )
}
