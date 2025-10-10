/**
 * Panel Manager Component
 * Manages multiple moveable panels and their interactions
 */

'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import MoveablePanel from '@/components/ui/moveable-panel'

interface Panel {
  id: string
  title: string
  content: ReactNode
  defaultPosition?: { x: number; y: number }
  defaultSize?: { width: number; height: number }
  minSize?: { width: number; height: number }
  maxSize?: { width: number; height: number }
  resizable?: boolean
  collapsible?: boolean
  closeable?: boolean
  isVisible?: boolean
}

interface PanelManagerContextType {
  panels: Panel[]
  openPanel: (panel: Omit<Panel, 'isVisible'>) => void
  closePanel: (id: string) => void
  togglePanel: (id: string) => void
  isPanelOpen: (id: string) => boolean
  updatePanel: (id: string, updates: Partial<Panel>) => void
  clearAllPanels: () => void
}

const PanelManagerContext = createContext<PanelManagerContextType | undefined>(undefined)

interface PanelManagerProps {
  children: ReactNode
  maxPanels?: number
}

export function PanelManager({ children, maxPanels = 5 }: PanelManagerProps) {
  const [panels, setPanels] = useState<Panel[]>([])

  const openPanel = useCallback((panel: Omit<Panel, 'isVisible'>) => {
    setPanels(prev => {
      // Check if panel already exists
      const existingIndex = prev.findIndex(p => p.id === panel.id)
      
      if (existingIndex >= 0) {
        // Update existing panel and make it visible
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], ...panel, isVisible: true }
        return updated
      }
      
      // Add new panel
      const newPanels = [...prev, { ...panel, isVisible: true }]
      
      // Enforce max panels limit
      if (newPanels.length > maxPanels) {
        // Close oldest panel
        const visiblePanels = newPanels.filter(p => p.isVisible)
        if (visiblePanels.length > maxPanels) {
          const oldestPanel = visiblePanels[0]
          return newPanels.map(p => 
            p.id === oldestPanel.id ? { ...p, isVisible: false } : p
          )
        }
      }
      
      return newPanels
    })
  }, [maxPanels])

  const closePanel = useCallback((id: string) => {
    setPanels(prev => prev.map(panel => 
      panel.id === id ? { ...panel, isVisible: false } : panel
    ))
  }, [])

  const togglePanel = useCallback((id: string) => {
    setPanels(prev => prev.map(panel => 
      panel.id === id ? { ...panel, isVisible: !panel.isVisible } : panel
    ))
  }, [])

  const isPanelOpen = useCallback((id: string) => {
    return panels.find(p => p.id === id)?.isVisible || false
  }, [panels])

  const updatePanel = useCallback((id: string, updates: Partial<Panel>) => {
    setPanels(prev => prev.map(panel => 
      panel.id === id ? { ...panel, ...updates } : panel
    ))
  }, [])

  const clearAllPanels = useCallback(() => {
    setPanels(prev => prev.map(panel => ({ ...panel, isVisible: false })))
  }, [])

  const value: PanelManagerContextType = {
    panels,
    openPanel,
    closePanel,
    togglePanel,
    isPanelOpen,
    updatePanel,
    clearAllPanels
  }

  return (
    <PanelManagerContext.Provider value={value}>
      {children}
      
      {/* Render visible panels */}
      <div className="fixed inset-0 pointer-events-none z-[9000]">
        <div className="relative w-full h-full pointer-events-auto">
          {panels
            .filter(panel => panel.isVisible)
            .map(panel => (
              <MoveablePanel
                key={panel.id}
                id={panel.id}
                title={panel.title}
                defaultPosition={panel.defaultPosition}
                defaultSize={panel.defaultSize}
                minSize={panel.minSize}
                maxSize={panel.maxSize}
                resizable={panel.resizable}
                collapsible={panel.collapsible}
                closeable={panel.closeable}
                onClose={() => closePanel(panel.id)}
              >
                {panel.content}
              </MoveablePanel>
            ))}
        </div>
      </div>
    </PanelManagerContext.Provider>
  )
}

export function usePanelManager() {
  const context = useContext(PanelManagerContext)
  if (context === undefined) {
    throw new Error('usePanelManager must be used within a PanelManager')
  }
  return context
}

// Predefined panel configurations for common use cases
export const PANEL_CONFIGS = {
  legend: {
    id: 'legend',
    title: 'Map Legend',
    defaultPosition: { x: 20, y: 20 },
    defaultSize: { width: 320, height: 400 },
    minSize: { width: 280, height: 200 },
    resizable: true,
    collapsible: true,
    closeable: false
  },
  pinDetails: {
    id: 'pin-details',
    title: 'Pin Details',
    defaultPosition: { x: 360, y: 20 },
    defaultSize: { width: 400, height: 500 },
    minSize: { width: 320, height: 300 },
    resizable: true,
    collapsible: true,
    closeable: true
  },
  createPin: {
    id: 'create-pin',
    title: 'Create Pin',
    defaultPosition: { x: 780, y: 20 },
    defaultSize: { width: 400, height: 600 },
    minSize: { width: 350, height: 400 },
    resizable: true,
    collapsible: false,
    closeable: true
  },
  groups: {
    id: 'groups',
    title: 'Community Groups',
    defaultPosition: { x: 20, y: 440 },
    defaultSize: { width: 350, height: 400 },
    minSize: { width: 300, height: 250 },
    resizable: true,
    collapsible: true,
    closeable: true
  },
  notifications: {
    id: 'notifications',
    title: 'Notifications',
    defaultPosition: { x: 390, y: 540 },
    defaultSize: { width: 300, height: 350 },
    minSize: { width: 280, height: 200 },
    resizable: true,
    collapsible: true,
    closeable: true
  },
  profile: {
    id: 'profile',
    title: 'User Profile',
    defaultPosition: { x: 710, y: 640 },
    defaultSize: { width: 350, height: 400 },
    minSize: { width: 300, height: 300 },
    resizable: true,
    collapsible: true,
    closeable: true
  },
  fund: {
    id: 'fund',
    title: 'Community Fund',
    defaultPosition: { x: 1080, y: 20 },
    defaultSize: { width: 400, height: 500 },
    minSize: { width: 350, height: 400 },
    resizable: true,
    collapsible: true,
    closeable: true
  },
  dataInsights: {
    id: 'data-insights',
    title: 'Data & Insights',
    defaultPosition: { x: 1080, y: 540 },
    defaultSize: { width: 450, height: 400 },
    minSize: { width: 400, height: 300 },
    resizable: true,
    collapsible: true,
    closeable: true
  }
} as const

export type PanelType = keyof typeof PANEL_CONFIGS
