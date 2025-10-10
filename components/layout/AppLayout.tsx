'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FloatingNavbar from '@/components/navigation/FloatingNavbar'
import LeftSidebar from '@/components/navigation/LeftSidebar'
import { usePinsStore } from '@/store/pins'
import { CategoryKey } from '@/config/categories'
import { PushNotificationManager } from '@/components/notifications/PushNotificationManager'

interface AppLayoutProps {
  children: React.ReactNode | ((props: {
    filteredPins: any[]
    showAddPinModal: boolean
    setShowAddPinModal: (show: boolean) => void
    currentView: 'map' | 'social' | 'data'
    searchQuery: string
    selectedCategories: any[]
  }) => React.ReactNode)
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentView, setCurrentView] = useState<'map' | 'social' | 'data'>('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>([])
  const [showAddPinModal, setShowAddPinModal] = useState(false)

  // Store
  const { pins, fetchPins } = usePinsStore()

  // Initialize from URL params
  useEffect(() => {
    const view = searchParams.get('view') as 'map' | 'social' | 'data'
    if (view && ['map', 'social', 'data'].includes(view)) {
      setCurrentView(view)
    }

    const categories = searchParams.get('categories')
    if (categories) {
      setSelectedCategories(categories.split(',') as CategoryKey[])
    }

    const search = searchParams.get('search')
    if (search) {
      setSearchQuery(search)
    }
  }, [searchParams])

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (currentView !== 'map') {
      params.set('view', currentView)
    }
    
    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','))
    }
    
    if (searchQuery) {
      params.set('search', searchQuery)
    }

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/map${newUrl}`, { scroll: false })
  }, [currentView, selectedCategories, searchQuery, router])

  // Filter pins based on current filters
  const filteredPins = pins.filter(pin => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(pin.type)) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        pin.title.toLowerCase().includes(query) ||
        pin.description?.toLowerCase().includes(query) ||
        pin.type.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Handlers
  const handleViewChange = (view: 'map' | 'social' | 'data') => {
    setCurrentView(view)
  }

  const handleCategoryToggle = (category: CategoryKey) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleClearFilters = () => {
    setSelectedCategories([])
    setSearchQuery('')
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleAddPin = () => {
    setShowAddPinModal(true)
  }

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Focus search input
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }

      // A for add pin
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement
        // Only trigger if not in an input field
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          handleAddPin()
        }
      }

      // Escape to clear search/filters
      if (e.key === 'Escape') {
        if (searchQuery || selectedCategories.length > 0) {
          e.preventDefault()
          handleClearFilters()
        }
      }

      // Number keys for view switching
      if (e.key >= '1' && e.key <= '3' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          const views: ('map' | 'social' | 'data')[] = ['map', 'social', 'data']
          const viewIndex = parseInt(e.key) - 1
          if (views[viewIndex]) {
            handleViewChange(views[viewIndex])
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery, selectedCategories])

  return (
    <div className="h-screen bg-gray-50 relative">
      <PushNotificationManager />
      {/* Floating Navigation */}
      <FloatingNavbar
        currentView={currentView}
        onViewChange={handleViewChange}
        onAddPin={handleAddPin}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Main Content */}
      <div className="h-full flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          onClearFilters={handleClearFilters}
        />

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden">
          {/* Pass filtered data and handlers to children */}
          {typeof children === 'function' 
            ? children({ 
                filteredPins, 
                showAddPinModal, 
                setShowAddPinModal,
                currentView,
                searchQuery,
                selectedCategories
              })
            : children
          }
        </main>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="hidden">
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>⌘K - Search</div>
          <div>A - Add Pin</div>
          <div>1-3 - Switch Views</div>
          <div>Esc - Clear Filters</div>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: AppLayoutProps) {
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
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  )
}
