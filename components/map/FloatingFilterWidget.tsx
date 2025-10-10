/**
 * Floating Filter Widget Component
 * Compact floating filter interface that replaces the sidebar
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CATEGORIES, CategoryKey } from '@/config/categories'
import { cn } from '@/lib/utils'

interface FloatingFilterWidgetProps {
  selectedCategories: CategoryKey[]
  onCategoryToggle: (category: CategoryKey) => void
  pinCounts: Record<CategoryKey, number>
  className?: string
}

export default function FloatingFilterWidget({
  selectedCategories,
  onCategoryToggle,
  pinCounts,
  className = ""
}: FloatingFilterWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isExpanded])

  const activeFilterCount = selectedCategories.length
  const totalPins = Object.values(pinCounts).reduce((sum, count) => sum + count, 0)

  return (
    <>
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating widget */}
      <div
        ref={widgetRef}
        className={cn(
          "fixed top-4 left-4 z-50 transition-all duration-300 ease-in-out",
          className
        )}
      >
        {/* Collapsed state - compact button */}
        {!isExpanded && (
          <Button
            onClick={() => setIsExpanded(true)}
            variant="default"
            size="default"
            className="bg-white/90 backdrop-blur-md text-gray-900 border border-gray-200/50 shadow-lg hover:bg-white/95 hover:shadow-xl transition-all duration-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 bg-silas-green text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}

        {/* Expanded state - full filter panel */}
        {isExpanded && (
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/50 shadow-2xl p-4 min-w-[320px] max-w-[400px] animate-in slide-in-from-left-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Filter Pins</h3>
                <Badge variant="outline" className="text-xs">
                  {totalPins} total
                </Badge>
              </div>
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter options */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Categories
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category.key)
                  const count = pinCounts[category.key] || 0
                  
                  return (
                    <button
                      key={category.key}
                      onClick={() => onCategoryToggle(category.key)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all duration-200 text-left",
                        isSelected
                          ? "bg-silas-green/10 border-silas-green/30 text-silas-green"
                          : "bg-gray-50/50 border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {category.label}
                          </span>
                          <span className="text-sm">{category.icon}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={isSelected ? "default" : "secondary"}
                          className={cn(
                            "text-xs px-2 py-0.5",
                            isSelected 
                              ? "bg-silas-green text-white" 
                              : "bg-gray-200 text-gray-600"
                          )}
                        >
                          {count}
                        </Badge>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-200/50">
                <Button
                  onClick={() => {
                    CATEGORIES.forEach(cat => {
                      if (!selectedCategories.includes(cat.key)) {
                        onCategoryToggle(cat.key)
                      }
                    })
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={selectedCategories.length === CATEGORIES.length}
                >
                  Select All
                </Button>
                <Button
                  onClick={() => {
                    selectedCategories.forEach(cat => onCategoryToggle(cat))
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={selectedCategories.length === 0}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
