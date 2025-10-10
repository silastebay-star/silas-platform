/**
 * Panel Management System
 * Centralized state management for floating overlay panels
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PanelType = 'community' | 'fund' | 'events' | 'economy' | 'environment' | 'ai' | 'settings' | 'profile' | 'notifications' | 'search' | 'chat'

export type PanelState = 'open' | 'minimized' | 'maximized' | 'closed'

export interface PanelPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface PanelConfig {
  id: string
  type: PanelType
  title: string
  icon: string
  state: PanelState
  position: PanelPosition
  zIndex: number
  isResizable: boolean
  isMovable: boolean
  isMinimizable: boolean
  isMaximizable: boolean
  minWidth: number
  minHeight: number
  maxWidth?: number
  maxHeight?: number
  defaultPosition: PanelPosition
  lastActiveTime: number
  isModal: boolean // Whether panel should block interaction with map
  allowMultiple: boolean // Whether multiple instances can be open
}

interface PanelStore {
  panels: Record<string, PanelConfig>
  activePanel: string | null
  maxZIndex: number
  
  // Panel lifecycle
  openPanel: (type: PanelType, config?: Partial<PanelConfig>) => string
  closePanel: (id: string) => void
  minimizePanel: (id: string) => void
  maximizePanel: (id: string) => void
  restorePanel: (id: string) => void
  
  // Panel management
  bringToFront: (id: string) => void
  setActivePanel: (id: string | null) => void
  updatePanelPosition: (id: string, position: Partial<PanelPosition>) => void
  updatePanelState: (id: string, updates: Partial<PanelConfig>) => void
  
  // Bulk operations
  closeAllPanels: () => void
  minimizeAllPanels: () => void
  getOpenPanels: () => PanelConfig[]
  getMinimizedPanels: () => PanelConfig[]
  
  // Positioning helpers
  getNextPosition: (type: PanelType) => PanelPosition
  checkCollision: (position: PanelPosition, excludeId?: string) => boolean
  arrangeWindows: () => void
  
  // Utilities
  getPanelById: (id: string) => PanelConfig | undefined
  getPanelsByType: (type: PanelType) => PanelConfig[]
  getHighestZIndex: () => number
}

// Default panel configurations
const defaultPanelConfigs: Record<PanelType, Omit<PanelConfig, 'id' | 'zIndex' | 'lastActiveTime'>> = {
  community: {
    type: 'community',
    title: 'Community',
    icon: 'Users',
    state: 'closed',
    position: { x: 100, y: 100, width: 800, height: 600 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: true,
    minWidth: 400,
    minHeight: 300,
    maxWidth: 1200,
    maxHeight: 800,
    defaultPosition: { x: 100, y: 100, width: 800, height: 600 },
    isModal: false,
    allowMultiple: false
  },
  fund: {
    type: 'fund',
    title: 'Community Fund',
    icon: 'DollarSign',
    state: 'closed',
    position: { x: 150, y: 150, width: 900, height: 700 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: true,
    minWidth: 500,
    minHeight: 400,
    maxWidth: 1400,
    maxHeight: 900,
    defaultPosition: { x: 150, y: 150, width: 900, height: 700 },
    isModal: false,
    allowMultiple: false
  },
  events: {
    type: 'events',
    title: 'Events',
    icon: 'Calendar',
    state: 'closed',
    position: { x: 200, y: 200, width: 700, height: 500 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: true,
    minWidth: 400,
    minHeight: 300,
    maxWidth: 1000,
    maxHeight: 700,
    defaultPosition: { x: 200, y: 200, width: 700, height: 500 },
    isModal: false,
    allowMultiple: false
  },
  economy: {
    type: 'economy',
    title: 'Local Economy',
    icon: 'Building2',
    state: 'closed',
    position: { x: 250, y: 250, width: 800, height: 600 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: true,
    minWidth: 400,
    minHeight: 300,
    defaultPosition: { x: 250, y: 250, width: 800, height: 600 },
    isModal: false,
    allowMultiple: false
  },
  environment: {
    type: 'environment',
    title: 'Environment',
    icon: 'Leaf',
    state: 'closed',
    position: { x: 300, y: 300, width: 750, height: 550 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: true,
    minWidth: 400,
    minHeight: 300,
    defaultPosition: { x: 300, y: 300, width: 750, height: 550 },
    isModal: false,
    allowMultiple: false
  },
  ai: {
    type: 'ai',
    title: 'AI Copilot',
    icon: 'Bot',
    state: 'closed',
    position: { x: 350, y: 350, width: 600, height: 500 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: true,
    minWidth: 400,
    minHeight: 300,
    defaultPosition: { x: 350, y: 350, width: 600, height: 500 },
    isModal: false,
    allowMultiple: false
  },
  settings: {
    type: 'settings',
    title: 'Settings',
    icon: 'Settings',
    state: 'closed',
    position: { x: 400, y: 200, width: 500, height: 600 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: false,
    minWidth: 400,
    minHeight: 500,
    maxWidth: 600,
    maxHeight: 700,
    defaultPosition: { x: 400, y: 200, width: 500, height: 600 },
    isModal: true,
    allowMultiple: false
  },
  profile: {
    type: 'profile',
    title: 'Profile',
    icon: 'User',
    state: 'closed',
    position: { x: 450, y: 250, width: 400, height: 500 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: false,
    minWidth: 350,
    minHeight: 400,
    maxWidth: 500,
    maxHeight: 600,
    defaultPosition: { x: 450, y: 250, width: 400, height: 500 },
    isModal: false,
    allowMultiple: false
  },
  notifications: {
    type: 'notifications',
    title: 'Notifications',
    icon: 'Bell',
    state: 'closed',
    position: { x: 500, y: 100, width: 350, height: 400 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: false,
    minWidth: 300,
    minHeight: 300,
    maxWidth: 400,
    maxHeight: 500,
    defaultPosition: { x: 500, y: 100, width: 350, height: 400 },
    isModal: false,
    allowMultiple: false
  },
  search: {
    type: 'search',
    title: 'Search',
    icon: 'Search',
    state: 'closed',
    position: { x: 300, y: 150, width: 600, height: 400 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: false,
    minWidth: 400,
    minHeight: 300,
    maxWidth: 800,
    maxHeight: 500,
    defaultPosition: { x: 300, y: 150, width: 600, height: 400 },
    isModal: false,
    allowMultiple: false
  },
  chat: {
    type: 'chat',
    title: 'Community Chat',
    icon: 'MessageSquare',
    state: 'closed',
    position: { x: 600, y: 300, width: 400, height: 500 },
    isResizable: true,
    isMovable: true,
    isMinimizable: true,
    isMaximizable: true,
    minWidth: 300,
    minHeight: 400,
    maxWidth: 600,
    maxHeight: 700,
    defaultPosition: { x: 600, y: 300, width: 400, height: 500 },
    isModal: false,
    allowMultiple: true
  }
}

export const usePanelStore = create<PanelStore>()(
  persist(
    (set, get) => ({
      panels: {},
      activePanel: null,
      maxZIndex: 1000,
      
      openPanel: (type, config = {}) => {
        const state = get()
        const defaultConfig = defaultPanelConfigs[type]
        
        // Check if panel type allows multiple instances
        if (!defaultConfig.allowMultiple) {
          const existingPanel = Object.values(state.panels).find(p => p.type === type)
          if (existingPanel) {
            // Bring existing panel to front and restore if minimized
            if (existingPanel.state === 'minimized') {
              get().restorePanel(existingPanel.id)
            }
            get().bringToFront(existingPanel.id)
            return existingPanel.id
          }
        }
        
        const id = `${type}-${Date.now()}`
        const newZIndex = state.maxZIndex + 1
        
        const newPanel: PanelConfig = {
          ...defaultConfig,
          ...config,
          id,
          state: 'open',
          zIndex: newZIndex,
          lastActiveTime: Date.now(),
          position: config.position || get().getNextPosition(type)
        }
        
        set({
          panels: { ...state.panels, [id]: newPanel },
          activePanel: id,
          maxZIndex: newZIndex
        })
        
        return id
      },
      
      closePanel: (id) => {
        const state = get()
        const { [id]: removed, ...remainingPanels } = state.panels
        
        set({
          panels: remainingPanels,
          activePanel: state.activePanel === id ? null : state.activePanel
        })
      },
      
      minimizePanel: (id) => {
        get().updatePanelState(id, { state: 'minimized' })
      },
      
      maximizePanel: (id) => {
        const state = get()
        const panel = state.panels[id]
        if (!panel || !panel.isMaximizable) return
        
        get().updatePanelState(id, { 
          state: 'maximized',
          position: {
            x: 0,
            y: 80, // Account for floating header
            width: window.innerWidth,
            height: window.innerHeight - 80
          }
        })
        get().bringToFront(id)
      },
      
      restorePanel: (id) => {
        const state = get()
        const panel = state.panels[id]
        if (!panel) return
        
        get().updatePanelState(id, { 
          state: 'open',
          position: panel.defaultPosition
        })
      },
      
      bringToFront: (id) => {
        const state = get()
        const newZIndex = state.maxZIndex + 1
        
        get().updatePanelState(id, { 
          zIndex: newZIndex,
          lastActiveTime: Date.now()
        })
        
        set({
          activePanel: id,
          maxZIndex: newZIndex
        })
      },
      
      setActivePanel: (id) => {
        set({ activePanel: id })
        if (id) {
          get().updatePanelState(id, { lastActiveTime: Date.now() })
        }
      },
      
      updatePanelPosition: (id, position) => {
        const state = get()
        const panel = state.panels[id]
        if (!panel) return
        
        set({
          panels: {
            ...state.panels,
            [id]: {
              ...panel,
              position: { ...panel.position, ...position }
            }
          }
        })
      },
      
      updatePanelState: (id, updates) => {
        const state = get()
        const panel = state.panels[id]
        if (!panel) return
        
        set({
          panels: {
            ...state.panels,
            [id]: { ...panel, ...updates }
          }
        })
      },
      
      closeAllPanels: () => {
        set({ panels: {}, activePanel: null })
      },
      
      minimizeAllPanels: () => {
        const state = get()
        const updatedPanels = Object.fromEntries(
          Object.entries(state.panels).map(([id, panel]) => [
            id,
            { ...panel, state: 'minimized' as PanelState }
          ])
        )
        set({ panels: updatedPanels, activePanel: null })
      },
      
      getOpenPanels: () => {
        return Object.values(get().panels).filter(p => p.state === 'open' || p.state === 'maximized')
      },
      
      getMinimizedPanels: () => {
        return Object.values(get().panels).filter(p => p.state === 'minimized')
      },
      
      getNextPosition: (type) => {
        const state = get()
        const defaultPos = defaultPanelConfigs[type].defaultPosition
        const openPanels = get().getOpenPanels()
        
        // If no panels open, use default position
        if (openPanels.length === 0) {
          return defaultPos
        }
        
        // Offset from other panels to avoid overlap
        const offset = openPanels.length * 30
        return {
          x: defaultPos.x + offset,
          y: defaultPos.y + offset,
          width: defaultPos.width,
          height: defaultPos.height
        }
      },
      
      checkCollision: (position, excludeId) => {
        const state = get()
        const panels = Object.values(state.panels).filter(p => 
          p.id !== excludeId && (p.state === 'open' || p.state === 'maximized')
        )
        
        return panels.some(panel => {
          const p = panel.position
          return !(
            position.x + position.width < p.x ||
            position.x > p.x + p.width ||
            position.y + position.height < p.y ||
            position.y > p.y + p.height
          )
        })
      },
      
      arrangeWindows: () => {
        const state = get()
        const openPanels = get().getOpenPanels()
        
        if (openPanels.length === 0) return
        
        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight - 80 // Account for header
        
        // Simple tiling arrangement
        const cols = Math.ceil(Math.sqrt(openPanels.length))
        const rows = Math.ceil(openPanels.length / cols)
        const panelWidth = screenWidth / cols
        const panelHeight = screenHeight / rows
        
        openPanels.forEach((panel, index) => {
          const col = index % cols
          const row = Math.floor(index / cols)
          
          get().updatePanelPosition(panel.id, {
            x: col * panelWidth,
            y: 80 + row * panelHeight,
            width: panelWidth - 10,
            height: panelHeight - 10
          })
        })
      },
      
      getPanelById: (id) => {
        return get().panels[id]
      },
      
      getPanelsByType: (type) => {
        return Object.values(get().panels).filter(p => p.type === type)
      },
      
      getHighestZIndex: () => {
        const panels = Object.values(get().panels)
        return panels.length > 0 ? Math.max(...panels.map(p => p.zIndex)) : 1000
      }
    }),
    {
      name: 'silas-panel-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        panels: Object.fromEntries(
          Object.entries(state.panels).map(([id, panel]) => [
            id,
            {
              ...panel,
              state: 'closed' // Reset all panels to closed on reload
            }
          ])
        )
      })
    }
  )
)

// Convenience hooks
export const usePanel = (id: string) => {
  return usePanelStore(state => state.panels[id])
}

export const usePanelActions = () => {
  return usePanelStore(state => ({
    openPanel: state.openPanel,
    closePanel: state.closePanel,
    minimizePanel: state.minimizePanel,
    maximizePanel: state.maximizePanel,
    restorePanel: state.restorePanel,
    bringToFront: state.bringToFront,
    updatePanelPosition: state.updatePanelPosition
  }))
}
