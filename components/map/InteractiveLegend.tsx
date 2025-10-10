/**
 * Interactive Legend Component
 * Mobile-first legend with category filtering and pin counts
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Filter, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { PinCategory } from '@/lib/services/pin-service'

// Production Pin Categories with Exact Color Specifications
export const PIN_CATEGORIES = [
  { 
    category: 'community' as PinCategory, 
    label: 'Community', 
    icon: '🧍',
    color: '#6B8E6B',
    description: 'Discussions, announcements'
  },
  { 
    category: 'faith' as PinCategory, 
    label: 'Faith', 
    icon: '🙏',
    color: '#8B5A96',
    description: 'Services, spiritual events'
  },
  { 
    category: 'projects' as PinCategory, 
    label: 'Projects', 
    icon: '🛠️',
    color: '#3A5D3A',
    description: 'Rejuvenation, community builds'
  },
  { 
    category: 'economy' as PinCategory, 
    label: 'Economy', 
    icon: '💷',
    color: '#4C6F76',
    description: 'Local business profiles'
  },
  { 
    category: 'events' as PinCategory, 
    label: 'Events', 
    icon: '📅',
    color: '#8CBFA5',
    description: 'Local gatherings, fairs'
  },
  { 
    category: 'data_ai' as PinCategory, 
    label: 'Data & AI', 
    icon: '🤖',
    color: '#5E6E6E',
    description: 'Census, insights, polls'
  },
  { 
    category: 'issues' as PinCategory, 
    label: 'Issues', 
    icon: '⚠️',
    color: '#C97340',
    description: 'Problems, safety concerns'
  },
  { 
    category: 'heritage_culture' as PinCategory, 
    label: 'Heritage & Culture', 
    icon: '🏛️',
    color: '#8B6F47',
    description: 'Historical sites, culture'
  },
  { 
    category: 'governance' as PinCategory, 
    label: 'Governance', 
    icon: '🏛️',
    color: '#2C4A6B',
    description: 'Council, civic matters'
  }
]

interface InteractiveLegendProps {
  categoryStats: Record<PinCategory, number>
  selectedCategories: PinCategory[]
  onCategoryToggle: (category: PinCategory) => void
  onToggleAll: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

export default function InteractiveLegend({
  categoryStats,
  selectedCategories,
  onCategoryToggle,
  onToggleAll,
  isCollapsed = false,
  onToggleCollapse,
  className = ""
}: InteractiveLegendProps) {
  const totalPins = Object.values(categoryStats).reduce((sum, count) => sum + count, 0)
  const visibleCategories = selectedCategories.length === 0 ? PIN_CATEGORIES.length : selectedCategories.length
  const allSelected = selectedCategories.length === 0
  const noneSelected = selectedCategories.length === PIN_CATEGORIES.length

  return (
    <Card className={cn(
      "bg-white/95 backdrop-blur-md border-gray-200/60 shadow-lg transition-all duration-300",
      "w-full max-w-sm",
      className
    )}>
      <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-silas-green" />
                <span>Community Map</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {totalPins} pins
                </Badge>
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-3">
            {/* Filter Controls */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                Showing {visibleCategories} of {PIN_CATEGORIES.length} categories
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleAll}
                className="h-6 px-2 text-xs"
              >
                {allSelected ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide All
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show All
                  </>
                )}
              </Button>
            </div>

            {/* Category List */}
            <div className="space-y-2">
              {PIN_CATEGORIES.map(({ category, label, icon, color, description }) => {
                const count = categoryStats[category] || 0
                const isVisible = selectedCategories.length === 0 || selectedCategories.includes(category)
                
                return (
                  <button
                    key={category}
                    onClick={() => onCategoryToggle(category)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200",
                      "hover:bg-gray-50 active:bg-gray-100",
                      "border border-transparent",
                      isVisible 
                        ? "bg-white shadow-sm border-gray-200" 
                        : "bg-gray-50 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Category Indicator */}
                      <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        <span className="text-[10px]">{icon}</span>
                      </div>
                      
                      {/* Category Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {label}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {description}
                        </div>
                      </div>
                    </div>

                    {/* Pin Count */}
                    <Badge 
                      variant={isVisible ? "default" : "secondary"}
                      className={cn(
                        "ml-2 text-xs font-medium",
                        isVisible && "shadow-sm"
                      )}
                      style={isVisible ? { 
                        backgroundColor: `${color}20`,
                        color: color,
                        borderColor: `${color}40`
                      } : {}}
                    >
                      {count}
                    </Badge>
                  </button>
                )
              })}
            </div>

            {/* Summary */}
            <div className="pt-2 border-t border-gray-200/60">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Total Community Pins</span>
                <Badge variant="outline" className="font-medium">
                  {totalPins}
                </Badge>
              </div>
              
              {selectedCategories.length > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>Filtered Pins</span>
                  <span className="font-medium">
                    {selectedCategories.reduce((sum, cat) => sum + (categoryStats[cat] || 0), 0)}
                  </span>
                </div>
              )}
            </div>

            {/* Mobile Hint */}
            <div className="text-xs text-gray-400 text-center pt-1 border-t border-gray-100">
              Tap categories to filter • Tap pins for details
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
