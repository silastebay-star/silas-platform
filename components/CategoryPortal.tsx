'use client'

import React from 'react'
import { CATEGORIES, CategoryKey, getCategoryByKey } from '@/config/categories'
import { usePinsStore } from '@/store/pins'
import { MapPin, Users, Calendar, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PinCardSmall from './PinCardSmall'

interface CategoryPortalProps {
  categoryKey: CategoryKey
  onClose?: () => void
}

export default function CategoryPortal({ categoryKey, onClose }: CategoryPortalProps) {
  const { pins } = usePinsStore()
  const category = getCategoryByKey(categoryKey)
  
  if (!category) return null

  // Filter pins by category
  const categoryPins = pins.filter(pin => pin.type === categoryKey)
  
  // Get category-specific stats
  const getStats = () => {
    switch (categoryKey) {
      case 'community':
        return [
          { label: 'Active Groups', value: '12', icon: Users },
          { label: 'Members', value: '89', icon: Users },
          { label: 'This Week', value: '+5', icon: TrendingUp }
        ]
      case 'projects':
        return [
          { label: 'Active Projects', value: categoryPins.length.toString(), icon: MapPin },
          { label: 'Volunteers', value: '34', icon: Users },
          { label: 'Funded', value: '£1,200', icon: TrendingUp }
        ]
      case 'events':
        return [
          { label: 'This Month', value: '8', icon: Calendar },
          { label: 'Attendees', value: '156', icon: Users },
          { label: 'Next Event', value: '3 days', icon: Calendar }
        ]
      case 'economy':
        return [
          { label: 'Businesses', value: categoryPins.length.toString(), icon: MapPin },
          { label: 'Jobs Posted', value: '7', icon: TrendingUp },
          { label: 'Local Spend', value: '£890', icon: TrendingUp }
        ]
      default:
        return [
          { label: 'Total Pins', value: categoryPins.length.toString(), icon: MapPin },
          { label: 'Active', value: categoryPins.filter(p => p.status === 'active').length.toString(), icon: TrendingUp },
          { label: 'This Week', value: '2', icon: Calendar }
        ]
    }
  }

  const stats = getStats()

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 text-white relative overflow-hidden"
        style={{ backgroundColor: `${category.color}15` }}
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{ backgroundColor: category.color }}
        />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${category.color}30` }}
              >
                {category.icon}
              </div>
              <div>
                <h3 
                  className="font-heading text-lg font-bold"
                  style={{ color: category.color }}
                >
                  {category.label}
                </h3>
                <p className="text-sm text-slate-300">{category.description}</p>
              </div>
            </div>
            
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                ×
              </Button>
            )}
          </div>

          {/* Purpose */}
          <p className="text-xs text-slate-300 leading-relaxed">
            {category.purpose}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-slate-700">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <IconComponent className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white">Quick Actions</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="default"
            size="sm"
            className="text-xs"
            style={{ backgroundColor: category.color }}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add {category.key === 'projects' ? 'Project' : category.key === 'events' ? 'Event' : 'Pin'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            View All
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Recent Pins */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white">
            Recent {category.label}
          </h4>
          <span className="text-xs text-slate-400">
            {categoryPins.length} total
          </span>
        </div>

        {categoryPins.length === 0 ? (
          <div className="text-center py-6">
            <div 
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-xl"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {category.icon}
            </div>
            <p className="text-sm text-slate-400 mb-2">
              No {category.label.toLowerCase()} yet
            </p>
            <p className="text-xs text-slate-500">
              Be the first to add one!
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categoryPins.slice(0, 5).map((pin) => (
              <PinCardSmall 
                key={pin.id} 
                pin={pin} 
                categoryColor={category.color}
              />
            ))}
            
            {categoryPins.length > 5 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-400 hover:text-white"
                >
                  View {categoryPins.length - 5} more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features Preview */}
      <div className="p-4 bg-slate-900 border-t border-slate-700">
        <h4 className="text-xs font-medium text-slate-400 mb-2">
          Available Features
        </h4>
        <div className="space-y-1">
          {category.features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs text-slate-300">{feature}</span>
            </div>
          ))}
          {category.features.length > 3 && (
            <div className="text-xs text-slate-500 pl-3.5">
              +{category.features.length - 3} more features
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
