'use client'

import React from 'react'
import { CATEGORIES, CategoryKey } from '@/config/categories'
import { MapPin, Users, Heart, Hammer, Briefcase, Calendar, BarChart3, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const categoryIcons = {
  community: Users,
  faith: Heart,
  projects: Hammer,
  economy: Briefcase,
  events: Calendar,
  data_ai: BarChart3,
  issues: AlertTriangle
}

interface CategorySidebarProps {
  active?: CategoryKey
  onSelect: (key: CategoryKey) => void
  className?: string
}

export default function CategorySidebar({ active, onSelect, className }: CategorySidebarProps) {
  return (
    <aside className={cn(
      "w-72 bg-slate-900 text-white p-4 rounded-r-lg shadow-lg h-screen sticky top-0 overflow-y-auto",
      className
    )}>
      {/* Header */}
      <div className="mb-6 px-2">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="w-6 h-6 text-silas-green" />
          <div className="text-silas-green font-heading text-xl font-bold">SILAS</div>
        </div>
        <div className="text-sm text-slate-400">
          Stoneclough Initiative for Local & Autonomous Systems
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Explore community categories
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="flex flex-col gap-2">
        {CATEGORIES.map((category) => {
          const IconComponent = categoryIcons[category.key]
          const isActive = active === category.key
          
          return (
            <button
              key={category.key}
              onClick={() => onSelect(category.key)}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-200 text-left group',
                isActive && 'bg-white/10 ring-2 ring-offset-2 ring-offset-slate-900',
                category.key === 'issues' && 'border-t border-slate-700 mt-2 pt-4'
              )}
              style={{
                '--ring-color': isActive ? category.color : undefined
              } as React.CSSProperties}
            >
              {/* Icon with category color */}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ 
                  backgroundColor: `${category.color}20`,
                  border: `1px solid ${category.color}40`
                }}
              >
                <IconComponent 
                  className="w-4 h-4" 
                  style={{ color: category.color }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div 
                  className="font-medium text-sm group-hover:text-white transition-colors"
                  style={{ color: isActive ? category.color : undefined }}
                >
                  {category.label}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  {category.description}
                </div>
                
                {/* Purpose on hover/active */}
                {isActive && (
                  <div className="text-xs text-slate-300 mt-2 p-2 bg-slate-800 rounded border-l-2"
                       style={{ borderLeftColor: category.color }}>
                    {category.purpose}
                  </div>
                )}
              </div>

              {/* Active indicator */}
              {isActive && (
                <div 
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-8 px-2 pt-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 mb-2">Map Overlays</div>
        <div className="flex flex-wrap gap-1">
          <button className="text-xs px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
            Census Data
          </button>
          <button className="text-xs px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
            Fund Flow
          </button>
          <button className="text-xs px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
            Activity Heat
          </button>
        </div>
      </div>

      {/* Community Stats */}
      <div className="mt-4 px-2">
        <div className="text-xs text-slate-500 mb-2">Community Stats</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Active Pins</span>
            <span className="text-white font-medium">127</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Community Fund</span>
            <span className="text-silas-green font-medium">£2,340</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Members</span>
            <span className="text-white font-medium">89</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
