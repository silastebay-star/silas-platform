'use client'

import { useState } from 'react'
import { MapPin, Menu, X, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import MapView from '@/components/map/MapView'
import CategorySidebar from '@/components/CategorySidebar'
import CategoryPortal from '@/components/CategoryPortal'
import { useCategoryFilter } from '@/hooks/useCategoryFilter'
import { CategoryKey } from '@/config/categories'

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [showPortal, setShowPortal] = useState(false)

  const {
    activeCategory,
    setActiveCategory,
    filteredPins,
    categoryStats,
    totalPins,
    hasFilters,
    clearFilters
  } = useCategoryFilter()

  const handleCategorySelect = (category: CategoryKey) => {
    setActiveCategory(category)
    setShowPortal(true)
  }

  // Apply search filter to already category-filtered pins
  const searchFilteredPins = filteredPins.filter(pin => {
    const matchesSearch = pin.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (pin.description && pin.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="h-screen flex bg-slate-900">
      {/* Category Sidebar */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden z-20`}>
        <CategorySidebar
          active={activeCategory || undefined}
          onSelect={handleCategorySelect}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Map Container */}
        <div className="flex-1 relative">
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-2">
              {!showSidebar && (
                <Button
                  onClick={() => setShowSidebar(true)}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              )}

              {hasFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search pins..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>

            {/* Right Info */}
            <div className="flex items-center space-x-2">
              <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-silas-green" />
                  <span>{searchFilteredPins.length} pins</span>
                  {activeCategory && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300">{activeCategory}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <MapView filteredPins={searchFilteredPins} />
        </div>

        {/* Category Portal */}
        {showPortal && activeCategory && (
          <div className="absolute top-20 left-4 w-96 z-40">
            <CategoryPortal
              categoryKey={activeCategory}
              onClose={() => setShowPortal(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
