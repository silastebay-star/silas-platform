/**
 * Panel Manager
 * Manages all floating panels and their interactions
 */

'use client'

import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import FloatingPanel from './FloatingPanel'
import { 
  CommunityPanelContent,
  FundPanelContent,
  ChatPanelContent,
  SettingsPanelContent,
  SearchPanelContent
} from './PanelContent'
import { usePanelStore, PanelType } from '@/store/panels'

// Generic panel content for panels that don't have specific content yet
function GenericPanelContent({ type, title }: { type: PanelType, title: string }) {
  const getIcon = () => {
    switch (type) {
      case 'events': return '📅'
      case 'economy': return '🏢'
      case 'environment': return '🌱'
      case 'ai': return '🤖'
      case 'profile': return '👤'
      case 'notifications': return '🔔'
      default: return '📋'
    }
  }
  
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">{getIcon()}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 mb-4">This panel is coming soon!</p>
        <p className="text-sm text-gray-400">
          Content for {title.toLowerCase()} will be available in a future update.
        </p>
      </div>
    </div>
  )
}

// Panel content renderer
function PanelContentRenderer({ type, title }: { type: PanelType, title: string }) {
  switch (type) {
    case 'community':
      return <CommunityPanelContent />
    case 'fund':
      return <FundPanelContent />
    case 'chat':
      return <ChatPanelContent />
    case 'settings':
      return <SettingsPanelContent />
    case 'search':
      return <SearchPanelContent />
    default:
      return <GenericPanelContent type={type} title={title} />
  }
}

interface PanelManagerProps {
  className?: string
}

export default function PanelManager({ className = "" }: PanelManagerProps) {
  const panels = usePanelStore(state => state.panels)
  const openPanels = Object.values(panels).filter(panel => 
    panel.state === 'open' || panel.state === 'maximized'
  )
  
  // Handle keyboard shortcuts for panel management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }
      
      const { 
        closeAllPanels, 
        minimizeAllPanels, 
        arrangeWindows,
        openPanel 
      } = usePanelStore.getState()
      
      // Escape to close all panels
      if (e.key === 'Escape' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        closeAllPanels()
      }
      
      // Cmd/Ctrl + M to minimize all panels
      if (e.key === 'm' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        minimizeAllPanels()
      }
      
      // Cmd/Ctrl + Shift + A to arrange windows
      if (e.key === 'A' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        arrangeWindows()
      }
      
      // Quick panel shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            openPanel('community')
            break
          case '2':
            e.preventDefault()
            openPanel('fund')
            break
          case '3':
            e.preventDefault()
            openPanel('events')
            break
          case '4':
            e.preventDefault()
            openPanel('chat')
            break
          case ',':
            e.preventDefault()
            openPanel('settings')
            break
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Handle window resize to adjust panel positions
  useEffect(() => {
    const handleResize = () => {
      const { panels, updatePanelPosition } = usePanelStore.getState()
      
      Object.values(panels).forEach(panel => {
        if (panel.state === 'maximized') {
          updatePanelPosition(panel.id, {
            x: 0,
            y: 80,
            width: window.innerWidth,
            height: window.innerHeight - 80
          })
        } else if (panel.state === 'open') {
          // Ensure panels stay within viewport
          const maxX = window.innerWidth - panel.position.width
          const maxY = window.innerHeight - panel.position.height
          
          if (panel.position.x > maxX || panel.position.y > maxY) {
            updatePanelPosition(panel.id, {
              x: Math.max(0, Math.min(panel.position.x, maxX)),
              y: Math.max(80, Math.min(panel.position.y, maxY))
            })
          }
        }
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Prevent map interaction when modal panels are open
  const hasModalPanels = openPanels.some(panel => panel.isModal)
  
  useEffect(() => {
    if (hasModalPanels) {
      document.body.style.pointerEvents = 'none'
      // Re-enable pointer events for panel elements
      const panelElements = document.querySelectorAll('[data-panel]')
      panelElements.forEach(el => {
        (el as HTMLElement).style.pointerEvents = 'auto'
      })
    } else {
      document.body.style.pointerEvents = 'auto'
    }
    
    return () => {
      document.body.style.pointerEvents = 'auto'
    }
  }, [hasModalPanels])
  
  return (
    <div className={className}>
      {/* Modal backdrop for modal panels */}
      {hasModalPanels && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9000]" />
      )}
      
      {/* Render all open panels */}
      <AnimatePresence>
        {openPanels.map(panel => (
          <div key={panel.id} data-panel>
            <FloatingPanel id={panel.id}>
              <PanelContentRenderer type={panel.type} title={panel.title} />
            </FloatingPanel>
          </div>
        ))}
      </AnimatePresence>
      
      {/* Panel collision detection overlay (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-[10000] bg-black/80 text-white p-2 rounded text-xs">
          <div>Open Panels: {openPanels.length}</div>
          <div>Modal Panels: {openPanels.filter(p => p.isModal).length}</div>
          <div>Highest Z-Index: {Math.max(...openPanels.map(p => p.zIndex), 0)}</div>
        </div>
      )}
    </div>
  )
}

// Hook for panel keyboard shortcuts info
export function usePanelShortcuts() {
  return {
    shortcuts: [
      { key: 'Cmd/Ctrl + 1', description: 'Open Community panel' },
      { key: 'Cmd/Ctrl + 2', description: 'Open Fund panel' },
      { key: 'Cmd/Ctrl + 3', description: 'Open Events panel' },
      { key: 'Cmd/Ctrl + 4', description: 'Open Chat panel' },
      { key: 'Cmd/Ctrl + ,', description: 'Open Settings panel' },
      { key: 'Cmd/Ctrl + M', description: 'Minimize all panels' },
      { key: 'Cmd/Ctrl + Shift + A', description: 'Arrange all panels' },
      { key: 'Cmd/Ctrl + Escape', description: 'Close all panels' }
    ]
  }
}

// Panel state debugging component (development only)
export function PanelDebugger() {
  const panels = usePanelStore(state => state.panels)
  const activePanel = usePanelStore(state => state.activePanel)
  
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <div className="fixed bottom-4 left-4 z-[10000] bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm">
      <h4 className="font-bold mb-2">Panel Debug Info</h4>
      <div className="space-y-1">
        <div>Active Panel: {activePanel || 'None'}</div>
        <div>Total Panels: {Object.keys(panels).length}</div>
        <div>Open Panels: {Object.values(panels).filter(p => p.state === 'open').length}</div>
        <div>Minimized: {Object.values(panels).filter(p => p.state === 'minimized').length}</div>
        <div>Maximized: {Object.values(panels).filter(p => p.state === 'maximized').length}</div>
      </div>
      
      {Object.values(panels).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <h5 className="font-semibold mb-1">Panel List:</h5>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {Object.values(panels).map(panel => (
              <div key={panel.id} className="text-xs">
                <span className={panel.id === activePanel ? 'text-yellow-400' : ''}>
                  {panel.title} ({panel.state})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
