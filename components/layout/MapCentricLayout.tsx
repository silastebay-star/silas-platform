/**
 * Map-Centric Layout
 * Primary layout that uses the map as the main interface with floating overlays
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { usePanelStore } from '@/store/panels'
import { useNavigationStore } from '@/store/navigation'

// Components
import FloatingHeader from '../navigation/FloatingHeader'
import PanelManager, { PanelDebugger } from '../panels/PanelManager'
import { FloatingWidgets } from '../ui/FloatingWidgets'

// Map component (placeholder - would be replaced with actual map)
import MapRoot from '../map/MapRoot'

interface MapCentricLayoutProps {
  children?: React.ReactNode
  showFloatingHeader?: boolean
  showFloatingWidgets?: boolean
  showPanelDebugger?: boolean
  onAddPin?: () => void
  className?: string
}

function MapCentricLayoutContent({
  children,
  showFloatingHeader = true,
  showFloatingWidgets = true,
  showPanelDebugger = false,
  onAddPin,
  className = ""
}: MapCentricLayoutProps) {
  const pathname = usePathname()
  const { preferences } = useNavigationStore()
  const { openPanel } = usePanelStore()
  const [isMapInteractive, setIsMapInteractive] = useState(true)
  
  // Handle route-based panel opening
  useEffect(() => {
    // Open panels based on route
    if (pathname.startsWith('/community')) {
      openPanel('community')
    } else if (pathname.startsWith('/fund')) {
      openPanel('fund')
    } else if (pathname.startsWith('/events')) {
      openPanel('events')
    } else if (pathname.startsWith('/economy')) {
      openPanel('economy')
    } else if (pathname.startsWith('/environment')) {
      openPanel('environment')
    } else if (pathname.startsWith('/ai')) {
      openPanel('ai')
    }
  }, [pathname, openPanel])
  
  // Monitor panel states to determine map interactivity
  const panels = usePanelStore(state => state.panels)
  const openPanels = Object.values(panels).filter(p => p.state === 'open' || p.state === 'maximized')
  const hasModalPanels = openPanels.some(panel => panel.isModal)
  
  useEffect(() => {
    setIsMapInteractive(!hasModalPanels)
  }, [hasModalPanels])
  
  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }
      
      // Quick panel access shortcuts
      if (e.altKey) {
        switch (e.key) {
          case 'c':
            e.preventDefault()
            openPanel('community')
            break
          case 'f':
            e.preventDefault()
            openPanel('fund')
            break
          case 'e':
            e.preventDefault()
            openPanel('events')
            break
          case 't':
            e.preventDefault()
            openPanel('chat')
            break
          case 's':
            e.preventDefault()
            openPanel('search')
            break
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openPanel])
  
  const handleAddPin = () => {
    if (onAddPin) {
      onAddPin()
    } else {
      // Default add pin behavior - could open a panel or modal
      console.log('Add pin clicked')
    }
  }
  
  const handleOpenChat = () => {
    openPanel('chat')
  }
  
  return (
    <div className={cn("h-screen overflow-hidden bg-gray-100 relative", className)}>
      {/* Map Background - Always Visible */}
      <div className={cn(
        "absolute inset-0 transition-all duration-300",
        !isMapInteractive && "pointer-events-none opacity-75"
      )}>
        {children || (
          <MapRoot
            className="w-full h-full"
            onPinSelect={() => {}}
            // Map props would go here
          />
        )}
        
        {/* Map interaction overlay when panels are modal */}
        {!isMapInteractive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-10"
          />
        )}
      </div>
      
      {/* Floating Header Navigation */}
      {showFloatingHeader && (
        <FloatingHeader onAddPin={handleAddPin} />
      )}
      
      {/* Panel Manager - Handles all floating panels */}
      <PanelManager />
      
      {/* Floating Widgets */}
      {showFloatingWidgets && preferences.floatingWidgetsEnabled && (
        <FloatingWidgets
          onAddPin={handleAddPin}
          onOpenChat={handleOpenChat}
          className="z-[8000]"
        />
      )}
      
      {/* Map Controls Overlay */}
      <div className="absolute bottom-6 left-6 z-[8000]">
        <div className="bg-white/90 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-lg p-3">
          <div className="flex flex-col gap-2">
            <button className="w-8 h-8 bg-white rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <span className="text-lg font-bold">+</span>
            </button>
            <button className="w-8 h-8 bg-white rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <span className="text-lg font-bold">−</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Map Legend */}
      <div className="absolute bottom-6 right-6 z-[8000]">
        <div className="bg-white/90 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-lg p-3 max-w-xs">
          <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-silas-green rounded-full"></div>
              <span>Community Pins</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Businesses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Projects</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading Indicator */}
      <AnimatePresence>
        {useNavigationStore(state => state.isNavigating) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-silas-green to-green-600 z-[9999]"
          >
            <motion.div
              className="h-full bg-white/30"
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Panel Debug Info (Development Only) */}
      {showPanelDebugger && <PanelDebugger />}
      
      {/* Accessibility Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {openPanels.length > 0 && (
          <span>
            {openPanels.length} panel{openPanels.length !== 1 ? 's' : ''} open. 
            Press Escape to close panels or use keyboard shortcuts to navigate.
          </span>
        )}
      </div>
      
      {/* Keyboard Shortcuts Help */}
      <div className="absolute top-20 right-4 z-[8000]">
        <details className="bg-white/90 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-lg">
          <summary className="p-3 cursor-pointer text-sm font-medium hover:bg-gray-50/80 rounded-lg">
            Keyboard Shortcuts
          </summary>
          <div className="p-3 pt-0 text-xs space-y-1 max-w-xs">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-mono">Alt + C</span>
              <span>Community</span>
              <span className="font-mono">Alt + F</span>
              <span>Fund</span>
              <span className="font-mono">Alt + E</span>
              <span>Events</span>
              <span className="font-mono">Alt + T</span>
              <span>Chat</span>
              <span className="font-mono">Alt + S</span>
              <span>Search</span>
              <span className="font-mono">Ctrl + M</span>
              <span>Minimize All</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

export default function MapCentricLayout(props: MapCentricLayoutProps) {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-silas-green rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="text-sm text-gray-600">Loading SILAS Map...</div>
        </div>
      </div>
    }>
      <MapCentricLayoutContent {...props} />
    </Suspense>
  )
}

// Convenience wrapper for different map-centric views
export function CommunityMapLayout({ children, ...props }: MapCentricLayoutProps) {
  return (
    <MapCentricLayout
      {...props}
      showFloatingHeader={true}
      showFloatingWidgets={true}
    >
      {children}
    </MapCentricLayout>
  )
}

export function FullscreenMapLayout({ children, ...props }: MapCentricLayoutProps) {
  return (
    <MapCentricLayout
      {...props}
      showFloatingHeader={false}
      showFloatingWidgets={false}
    >
      {children}
    </MapCentricLayout>
  )
}

export function DevelopmentMapLayout({ children, ...props }: MapCentricLayoutProps) {
  return (
    <MapCentricLayout
      {...props}
      showPanelDebugger={true}
    >
      {children}
    </MapCentricLayout>
  )
}
