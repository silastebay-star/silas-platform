'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Filter, Bookmark, Activity, Settings, Map, Users, Heart, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { usePinsStore } from '@/store/pins'
import { CATEGORIES, getCategoryColor, getCategoryByKey, type CategoryKey } from '@/config/categories'

interface LeftSidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  selectedCategories: CategoryKey[]
  onCategoryToggle: (category: CategoryKey) => void
  onClearFilters: () => void
}

interface CategoryFilterProps {
  category: CategoryKey
  isSelected: boolean
  onToggle: () => void
  isCollapsed: boolean
  count?: number
}

function CategoryFilter({ category, isSelected, onToggle, isCollapsed, count }: CategoryFilterProps) {
  const categoryConfig = getCategoryByKey(category)
  const color = getCategoryColor(category)

  if (!categoryConfig) return null

  return (
    <button
      onClick={onToggle}
      className={`
        w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200
        ${isSelected 
          ? 'bg-opacity-20 border-2' 
          : 'hover:bg-gray-50 border border-transparent'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
      style={{
        backgroundColor: isSelected ? `${color}20` : undefined,
        borderColor: isSelected ? color : undefined
      }}
    >
      <div className="flex items-center space-x-2 min-w-0">
        <span className="text-lg flex-shrink-0">{categoryConfig.icon}</span>
        {!isCollapsed && (
          <span className="font-medium text-sm text-gray-900 truncate">
            {categoryConfig.label}
          </span>
        )}
      </div>
      
      {!isCollapsed && count !== undefined && count > 0 && (
        <Badge 
          variant="secondary" 
          className="ml-2 text-xs"
          style={{ 
            backgroundColor: isSelected ? color : undefined,
            color: isSelected ? 'white' : undefined
          }}
        >
          {count}
        </Badge>
      )}
    </button>
  )
}

export default function LeftSidebar({ 
  isCollapsed, 
  onToggleCollapse, 
  selectedCategories, 
  onCategoryToggle, 
  onClearFilters 
}: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { pins } = usePinsStore()

  // Calculate category counts
  const categoryCounts = pins.reduce((acc, pin) => {
    acc[pin.type] = (acc[pin.type] || 0) + 1
    return acc
  }, {} as Record<CategoryKey, number>)

  const hasActiveFilters = selectedCategories.length > 0 || searchQuery.length > 0

  const savedViews = [
    { id: 'recent', name: 'Recent Activity', icon: Activity, count: 12 },
    { id: 'favorites', name: 'My Favorites', icon: Heart, count: 5 },
    { id: 'nearby', name: 'Nearby', icon: Map, count: 8 }
  ]

  return (
    <div className={`
      relative bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-80'}
      flex flex-col h-full
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="font-bold text-lg text-gray-900 font-heading">Filters</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Search */}
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search pins..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {!isCollapsed && hasActiveFilters && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Active Filters</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedCategories.map(category => {
                const categoryConfig = getCategoryByKey(category)
                const color = getCategoryColor(category)
                if (!categoryConfig) return null
                return (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    style={{ backgroundColor: `${color}20`, color: color }}
                    onClick={() => onCategoryToggle(category)}
                  >
                    {categoryConfig.icon} {categoryConfig.label}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            {!isCollapsed && (
              <span className="font-medium text-sm text-gray-700">Categories</span>
            )}
          </div>
          
          <div className="space-y-1">
            {CATEGORIES.map(categoryConfig => (
              <CategoryFilter
                key={categoryConfig.key}
                category={categoryConfig.key}
                isSelected={selectedCategories.includes(categoryConfig.key)}
                onToggle={() => onCategoryToggle(categoryConfig.key)}
                isCollapsed={isCollapsed}
                count={categoryCounts[categoryConfig.key]}
              />
            ))}
          </div>
        </div>

        {/* Saved Views */}
        {!isCollapsed && (
          <>
            <Separator className="" />
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-sm text-gray-700">Saved Views</span>
              </div>
              
              <div className="space-y-1">
                {savedViews.map(view => {
                  const Icon = view.icon
                  return (
                    <button
                      key={view.id}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm text-gray-700">
                          {view.name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {view.count}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Quick Stats */}
        {!isCollapsed && (
          <>
            <Separator className="" />
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-sm text-gray-700">Quick Stats</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{pins.length}</div>
                  <div className="text-xs text-gray-500">Total Pins</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {selectedCategories.length > 0 
                      ? pins.filter(pin => selectedCategories.includes(pin.type)).length
                      : pins.length
                    }
                  </div>
                  <div className="text-xs text-gray-500">Visible</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      )}
    </div>
  )
}
