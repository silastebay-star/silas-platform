'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { Pin, MapFilters, CategoryKey, MapViewState } from '@/types/silas'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtimePins } from '@/hooks/useRealtimePins'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import TopNavbar from '@/components/navigation/TopNavbar'
import LeftSidebar from '@/components/navigation/LeftSidebar'
import MapRoot from '@/components/map/MapRoot'
import AddPinModal from '@/components/map/AddPinModal'
import AuthModal from '@/components/auth/AuthModal'
import { UserAnalytics } from '@/lib/monitoring'

interface EnhancedAppLayoutProps {
  children?: React.ReactNode
}

function EnhancedAppLayoutContent({ children }: EnhancedAppLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()

  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentView, setCurrentView] = useState<'map' | 'social' | 'data'>('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>([])
  const [activeCategory, setActiveCategory] = useState<CategoryKey | undefined>()
  
  // Modal states
  const [showAddPinModal, setShowAddPinModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin')
  
  // Pin states
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null)
  const [mapViewState, setMapViewState] = useState<MapViewState>({
    longitude: -2.4833, // Stoneclough coordinates
    latitude: 53.5500,
    zoom: 15
  })

  // Build map filters
  const mapFilters: MapFilters = {
    categories: selectedCategories,
    status: ['published', 'proposed'], // Show published and proposed pins
    author_type: [],
    search_query: searchQuery || undefined,
    bounding_box: undefined // Will be set by map bounds
  }

  // Real-time pins hook
  const {
    pins,
    loading: pinsLoading,
    error: pinsError,
    refetch: refetchPins,
    addOptimisticPin,
    updateOptimisticPin,
    removeOptimisticPin
  } = useRealtimePins({
    filters: mapFilters,
    enabled: true,
    onPinAdded: (pin) => {
      UserAnalytics.trackPinViewed(pin.categories[0] || 'community')
    },
    onPinUpdated: (pin) => {
      // Handle pin updates
      if (selectedPin?.id === pin.id) {
        setSelectedPin(pin)
      }
    },
    onPinDeleted: (pinId) => {
      // Handle pin deletion
      if (selectedPin?.id === pinId) {
        setSelectedPin(null)
      }
    }
  })

  // Initialize from URL parameters
  useEffect(() => {
    const view = searchParams.get('view') as 'map' | 'social' | 'data'
    const search = searchParams.get('search')
    const categories = searchParams.get('categories')
    const pinId = searchParams.get('pin')

    if (view && ['map', 'social', 'data'].includes(view)) {
      setCurrentView(view)
    }

    if (search) {
      setSearchQuery(search)
    }

    if (categories) {
      try {
        const categoryArray = categories.split(',') as CategoryKey[]
        setSelectedCategories(categoryArray)
      } catch (error) {
        console.warn('Invalid categories in URL:', categories)
      }
    }

    if (pinId && pins.length > 0) {
      const pin = pins.find(p => p.id === pinId)
      if (pin) {
        setSelectedPin(pin)
      }
    }
  }, [searchParams, pins])

  // Update URL when state changes
  const updateURL = useCallback((updates: {
    view?: string
    search?: string
    categories?: string[]
    pin?: string
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (updates.view) {
      params.set('view', updates.view)
    }

    if (updates.search !== undefined) {
      if (updates.search) {
        params.set('search', updates.search)
      } else {
        params.delete('search')
      }
    }

    if (updates.categories !== undefined) {
      if (updates.categories.length > 0) {
        params.set('categories', updates.categories.join(','))
      } else {
        params.delete('categories')
      }
    }

    if (updates.pin !== undefined) {
      if (updates.pin) {
        params.set('pin', updates.pin)
      } else {
        params.delete('pin')
      }
    }

    const newURL = `${window.location.pathname}?${params.toString()}`
    router.replace(newURL, { scroll: false })
  }, [searchParams, router])

  // Event handlers
  const handleViewChange = useCallback((view: 'map' | 'social' | 'data') => {
    setCurrentView(view)
    updateURL({ view })
    UserAnalytics.trackEvent('view_change', 'navigation', view)
  }, [updateURL])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    updateURL({ search: query })
    
    if (query) {
      UserAnalytics.trackSearch(query, pins.length)
    }
  }, [updateURL, pins.length])

  const handleCategoryToggle = useCallback((category: CategoryKey) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
      
      updateURL({ categories: newCategories })
      return newCategories
    })
  }, [updateURL])

  const handleClearFilters = useCallback(() => {
    setSelectedCategories([])
    setSearchQuery('')
    setActiveCategory(undefined)
    updateURL({ search: '', categories: [] })
  }, [updateURL])

  const handlePinSelect = useCallback((pin: Pin) => {
    setSelectedPin(pin)
    updateURL({ pin: pin.id })
    UserAnalytics.trackPinViewed(pin.categories[0] || 'community')
  }, [updateURL])

  const handlePinHover = useCallback((pin: Pin | null) => {
    setHoveredPin(pin)
  }, [])

  const handleMapMove = useCallback((viewState: MapViewState) => {
    setMapViewState(viewState)
  }, [])

  const handleAddPin = useCallback(() => {
    if (!user) {
      setShowAuthModal(true)
      setAuthModalMode('signin')
    } else {
      setShowAddPinModal(true)
    }
  }, [user])

  const handleSignInClick = useCallback(() => {
    setShowAuthModal(true)
    setAuthModalMode('signin')
  }, [])

  const handleClosePinDrawer = useCallback(() => {
    setSelectedPin(null)
    updateURL({ pin: undefined })
  }, [updateURL])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Focus search input (would need ref to TopNavbar)
      }

      // A for add pin
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          handleAddPin()
        }
      }

      // 1, 2, 3 for view switching
      if (['1', '2', '3'].includes(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          const views: ('map' | 'social' | 'data')[] = ['map', 'social', 'data']
          const viewIndex = parseInt(e.key) - 1
          if (views[viewIndex]) {
            handleViewChange(views[viewIndex])
          }
        }
      }

      // Escape to clear filters or close modals
      if (e.key === 'Escape') {
        if (selectedPin) {
          handleClosePinDrawer()
        } else if (showAddPinModal) {
          setShowAddPinModal(false)
        } else if (showAuthModal) {
          setShowAuthModal(false)
        } else {
          handleClearFilters()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedPin, showAddPinModal, showAuthModal, handleViewChange, handleAddPin, handleClearFilters, handleClosePinDrawer])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <TopNavbar
        currentView={currentView}
        onViewChange={handleViewChange}
        onAddPin={handleAddPin}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          onClearFilters={handleClearFilters}
        />

        {/* Map Container */}
        <div className="flex-1 relative">
          {currentView === 'map' && (
            <MapRoot
              activeCategory={activeCategory}
              filters={mapFilters}
              onPinSelect={handlePinSelect}
              onPinHover={handlePinHover}
              onMapMove={handleMapMove}
              className="w-full h-full"
            />
          )}

          {currentView === 'social' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Social View</h2>
                <p className="text-gray-600">Social feed coming soon...</p>
              </div>
            </div>
          )}

          {currentView === 'data' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Data View</h2>
                <p className="text-gray-600">Data dashboard coming soon...</p>
              </div>
            </div>
          )}

          {/* Custom children if provided */}
          {children}
        </div>

        {/* Pin Drawer - TODO: Update PinDrawer to use new Pin type */}
        {selectedPin && (
          <div className="fixed right-0 top-16 bottom-0 w-96 bg-white shadow-xl border-l border-gray-200 z-40">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedPin.title}</h2>
                <Button variant="ghost" size="sm" className="" onClick={handleClosePinDrawer}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">{selectedPin.description}</p>
              <div className="mt-4">
                <Badge variant="secondary" className="">
                  {selectedPin.categories[0] || 'community'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddPinModal && (
        <AddPinModal
          isOpen={showAddPinModal}
          onClose={() => setShowAddPinModal(false)}
          onSubmit={(pin) => {
            // Add optimistic pin
            addOptimisticPin(pin)
            setShowAddPinModal(false)
            UserAnalytics.trackPinCreated(pin.categories?.[0] || 'community')
          }}
          location={{ lat: mapViewState.latitude, lng: mapViewState.longitude }}
        />
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode={authModalMode}
        />
      )}

      {/* Loading States */}
      {pinsLoading && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-silas-green border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Loading pins...</span>
          </div>
        </div>
      )}

      {/* Error States */}
      {pinsError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 max-w-sm">
          <div className="flex items-start space-x-2">
            <div className="text-red-500 mt-0.5">⚠️</div>
            <div>
              <p className="text-sm font-medium text-red-800">Error loading pins</p>
              <p className="text-xs text-red-600 mt-1">{pinsError}</p>
              <button
                onClick={refetchPins}
                className="text-xs text-red-700 underline mt-1 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EnhancedAppLayout({ children }: EnhancedAppLayoutProps) {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-silas-green rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="text-sm text-gray-600">Loading SILAS...</div>
        </div>
      </div>
    }>
      <EnhancedAppLayoutContent>{children}</EnhancedAppLayoutContent>
    </Suspense>
  )
}
