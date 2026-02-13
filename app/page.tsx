/**
 * Main Application Page
 * Complete SILAS platform with map-centric interface and moveable panels
 */

'use client'

import MapCentricLayout from '@/components/layout/MapCentricLayout'
import { PanelManager } from '@/components/layout/PanelManager'



import MapInterface from '@/components/map/MapInterface'

export default function HomePage() {
  return (
    <PanelManager maxPanels={6}>
      <MapCentricLayout>
        <MapInterface />
      </MapCentricLayout>
    </PanelManager>
  )
}



