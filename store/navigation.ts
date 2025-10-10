/**
 * Navigation State Management Store
 * Centralized state for navigation, sidebar, search, and UI preferences
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CategoryKey } from '@/types/silas'

export type ViewType = 'map' | 'social' | 'data' | 'fund' | 'events' | 'economy' | 'environment' | 'ai'
export type SidebarState = 'expanded' | 'collapsed' | 'hidden'
export type LayoutMode = 'floating' | 'sidebar' | 'minimal'

interface NavigationHistory {
  path: string
  timestamp: number
  title?: string
}

interface UIPreferences {
  theme: 'light' | 'dark' | 'system'
  reducedMotion: boolean
  compactMode: boolean
  showTooltips: boolean
  autoHideSidebar: boolean
  floatingWidgetsEnabled: boolean
}

interface SearchState {
  query: string
  recentSearches: string[]
  searchHistory: Array<{
    query: string
    timestamp: number
    resultsCount: number
  }>
}

interface NavigationState {
  // Current navigation state
  currentView: ViewType
  currentPath: string
  previousPath: string | null
  
  // Sidebar state
  sidebarState: SidebarState
  sidebarWidth: number
  isSidebarPinned: boolean
  
  // Layout preferences
  layoutMode: LayoutMode
  isFullscreen: boolean
  
  // Search state
  searchState: SearchState
  
  // Filter state
  selectedCategories: CategoryKey[]
  activeCategory: CategoryKey | null
  
  // Modal states
  modals: {
    addPin: boolean
    auth: boolean
    settings: boolean
    search: boolean
    notifications: boolean
  }
  
  // Navigation history
  history: NavigationHistory[]
  historyIndex: number
  
  // UI preferences
  preferences: UIPreferences
  
  // Loading states
  isNavigating: boolean
  
  // Actions
  setCurrentView: (view: ViewType) => void
  setCurrentPath: (path: string, title?: string) => void
  goBack: () => void
  goForward: () => void
  
  // Sidebar actions
  setSidebarState: (state: SidebarState) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  toggleSidebarPin: () => void
  
  // Layout actions
  setLayoutMode: (mode: LayoutMode) => void
  toggleFullscreen: () => void
  
  // Search actions
  setSearchQuery: (query: string) => void
  addToSearchHistory: (query: string, resultsCount: number) => void
  clearSearchHistory: () => void
  
  // Filter actions
  setSelectedCategories: (categories: CategoryKey[]) => void
  toggleCategory: (category: CategoryKey) => void
  setActiveCategory: (category: CategoryKey | null) => void
  clearFilters: () => void
  
  // Modal actions
  openModal: (modal: keyof NavigationState['modals']) => void
  closeModal: (modal: keyof NavigationState['modals']) => void
  closeAllModals: () => void
  
  // Preferences actions
  updatePreferences: (preferences: Partial<UIPreferences>) => void
  resetPreferences: () => void
  
  // Navigation actions
  setNavigating: (isNavigating: boolean) => void
  
  // Utility actions
  reset: () => void
}

const defaultPreferences: UIPreferences = {
  theme: 'light',
  reducedMotion: false,
  compactMode: false,
  showTooltips: true,
  autoHideSidebar: false,
  floatingWidgetsEnabled: true
}

const defaultSearchState: SearchState = {
  query: '',
  recentSearches: [],
  searchHistory: []
}

const defaultModals = {
  addPin: false,
  auth: false,
  settings: false,
  search: false,
  notifications: false
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentView: 'map',
      currentPath: '/',
      previousPath: null,
      
      sidebarState: 'expanded',
      sidebarWidth: 320,
      isSidebarPinned: true,
      
      layoutMode: 'floating',
      isFullscreen: false,
      
      searchState: defaultSearchState,
      
      selectedCategories: [],
      activeCategory: null,
      
      modals: defaultModals,
      
      history: [],
      historyIndex: -1,
      
      preferences: defaultPreferences,
      
      isNavigating: false,
      
      // Actions
      setCurrentView: (view) => set({ currentView: view }),
      
      setCurrentPath: (path, title) => {
        const state = get()
        const newHistoryEntry: NavigationHistory = {
          path,
          timestamp: Date.now(),
          title
        }
        
        set({
          previousPath: state.currentPath,
          currentPath: path,
          history: [...state.history.slice(0, state.historyIndex + 1), newHistoryEntry],
          historyIndex: state.historyIndex + 1
        })
      },
      
      goBack: () => {
        const state = get()
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1
          const targetEntry = state.history[newIndex]
          set({
            historyIndex: newIndex,
            currentPath: targetEntry.path,
            previousPath: state.currentPath
          })
          return targetEntry.path
        }
        return null
      },
      
      goForward: () => {
        const state = get()
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1
          const targetEntry = state.history[newIndex]
          set({
            historyIndex: newIndex,
            currentPath: targetEntry.path,
            previousPath: state.currentPath
          })
          return targetEntry.path
        }
        return null
      },
      
      // Sidebar actions
      setSidebarState: (sidebarState) => set({ sidebarState }),
      
      toggleSidebar: () => {
        const state = get()
        const newState = state.sidebarState === 'expanded' ? 'collapsed' : 'expanded'
        set({ sidebarState: newState })
      },
      
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      
      toggleSidebarPin: () => set((state) => ({ 
        isSidebarPinned: !state.isSidebarPinned 
      })),
      
      // Layout actions
      setLayoutMode: (layoutMode) => set({ layoutMode }),
      
      toggleFullscreen: () => set((state) => ({ 
        isFullscreen: !state.isFullscreen 
      })),
      
      // Search actions
      setSearchQuery: (query) => set((state) => ({
        searchState: { ...state.searchState, query }
      })),
      
      addToSearchHistory: (query, resultsCount) => {
        if (!query.trim()) return
        
        set((state) => {
          const newEntry = { query, timestamp: Date.now(), resultsCount }
          const filteredHistory = state.searchState.searchHistory.filter(
            entry => entry.query !== query
          )
          const recentSearches = Array.from(new Set([query, ...state.searchState.recentSearches]))
            .slice(0, 10)
          
          return {
            searchState: {
              ...state.searchState,
              recentSearches,
              searchHistory: [newEntry, ...filteredHistory].slice(0, 50)
            }
          }
        })
      },
      
      clearSearchHistory: () => set((state) => ({
        searchState: { ...state.searchState, searchHistory: [], recentSearches: [] }
      })),
      
      // Filter actions
      setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
      
      toggleCategory: (category) => set((state) => ({
        selectedCategories: state.selectedCategories.includes(category)
          ? state.selectedCategories.filter(c => c !== category)
          : [...state.selectedCategories, category]
      })),
      
      setActiveCategory: (activeCategory) => set({ activeCategory }),
      
      clearFilters: () => set({
        selectedCategories: [],
        activeCategory: null,
        searchState: { ...get().searchState, query: '' }
      }),
      
      // Modal actions
      openModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: true }
      })),
      
      closeModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: false }
      })),
      
      closeAllModals: () => set({ modals: defaultModals }),
      
      // Preferences actions
      updatePreferences: (newPreferences) => set((state) => ({
        preferences: { ...state.preferences, ...newPreferences }
      })),
      
      resetPreferences: () => set({ preferences: defaultPreferences }),
      
      // Navigation actions
      setNavigating: (isNavigating) => set({ isNavigating }),
      
      // Utility actions
      reset: () => set({
        currentView: 'map',
        currentPath: '/',
        previousPath: null,
        sidebarState: 'expanded',
        sidebarWidth: 320,
        isSidebarPinned: true,
        layoutMode: 'floating',
        isFullscreen: false,
        searchState: defaultSearchState,
        selectedCategories: [],
        activeCategory: null,
        modals: defaultModals,
        history: [],
        historyIndex: -1,
        preferences: defaultPreferences,
        isNavigating: false
      })
    }),
    {
      name: 'silas-navigation-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarState: state.sidebarState,
        sidebarWidth: state.sidebarWidth,
        isSidebarPinned: state.isSidebarPinned,
        layoutMode: state.layoutMode,
        preferences: state.preferences,
        searchState: {
          recentSearches: state.searchState.recentSearches,
          searchHistory: state.searchState.searchHistory
        }
      })
    }
  )
)

// Convenience hooks
export const useCurrentView = () => useNavigationStore(state => state.currentView)
export const useSidebarState = () => useNavigationStore(state => ({
  state: state.sidebarState,
  width: state.sidebarWidth,
  isPinned: state.isSidebarPinned,
  toggle: state.toggleSidebar,
  setState: state.setSidebarState,
  setWidth: state.setSidebarWidth,
  togglePin: state.toggleSidebarPin
}))
export const useSearchState = () => useNavigationStore(state => ({
  ...state.searchState,
  setQuery: state.setSearchQuery,
  addToHistory: state.addToSearchHistory,
  clearHistory: state.clearSearchHistory
}))
export const useModalState = () => useNavigationStore(state => ({
  modals: state.modals,
  open: state.openModal,
  close: state.closeModal,
  closeAll: state.closeAllModals
}))
export const useNavigationHistory = () => useNavigationStore(state => ({
  history: state.history,
  currentIndex: state.historyIndex,
  canGoBack: state.historyIndex > 0,
  canGoForward: state.historyIndex < state.history.length - 1,
  goBack: state.goBack,
  goForward: state.goForward
}))
