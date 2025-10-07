'use client'

import React from 'react'
import { Pin } from '@/store/pins'
import { MapPin, Heart, MessageCircle, Calendar, User } from 'lucide-react'
import { getCategoryByKey } from '@/config/categories'

interface PinCardSmallProps {
  pin: Pin
  categoryColor?: string
  onClick?: () => void
}

export default function PinCardSmall({ pin, categoryColor, onClick }: PinCardSmallProps) {
  const category = getCategoryByKey(pin.type)
  const color = categoryColor || category?.color || '#6B7280'
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div 
      className="bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition-all duration-200 cursor-pointer group border border-slate-600 hover:border-slate-500"
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Pin Type Indicator */}
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
        >
          <MapPin 
            className="w-4 h-4" 
            style={{ color }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Category */}
          <div className="flex items-start justify-between mb-1">
            <h4 className="text-sm font-medium text-white group-hover:text-slate-100 transition-colors line-clamp-1">
              {pin.title}
            </h4>
            <span 
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium flex-shrink-0 ml-2"
              style={{ backgroundColor: color }}
            >
              {pin.type}
            </span>
          </div>

          {/* Description */}
          {pin.description && (
            <p className="text-xs text-slate-300 line-clamp-2 mb-2">
              {pin.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              {/* Date */}
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(pin.created_at)}</span>
              </div>

              {/* Author */}
              {pin.created_by && (
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-16">{pin.created_by}</span>
                </div>
              )}
            </div>

            {/* Social Stats */}
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              {pin.likes && pin.likes > 0 && (
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{pin.likes}</span>
                </div>
              )}
              
              {pin.comments && pin.comments > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{pin.comments}</span>
                </div>
              )}
            </div>
          </div>

          {/* Category Badge */}
          {pin.category && (
            <div className="mt-2">
              <span className="text-xs px-2 py-0.5 bg-slate-600 text-slate-300 rounded">
                {pin.category}
              </span>
            </div>
          )}

          {/* Photos Indicator */}
          {pin.photos && pin.photos.length > 0 && (
            <div className="mt-2 flex items-center space-x-1">
              <div className="flex -space-x-1">
                {pin.photos.slice(0, 3).map((photo, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded border-2 border-slate-700 bg-slate-600 overflow-hidden"
                  >
                    <img
                      src={photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {pin.photos.length > 3 && (
                <span className="text-xs text-slate-400">
                  +{pin.photos.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="text-xs text-slate-400 hover:text-white transition-colors">
              View Details
            </button>
            <span className="text-slate-600">•</span>
            <button className="text-xs text-slate-400 hover:text-white transition-colors">
              Share
            </button>
          </div>
          
          <div className="text-xs text-slate-500">
            {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  )
}
