'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Pin, CategoryKey } from '@/types/silas'
import { CATEGORIES } from '@/types/silas'
import { 
  X, 
  MapPin, 
  Calendar, 
  User, 
  Building2, 
  Lock,
  ArrowRight,
  Users,
  Church,
  Database,
  AlertTriangle,
  Leaf
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PinPreviewTooltipProps {
  pin: Pin
  position: { x: number; y: number }
  isVisible: boolean
  onClose: () => void
  onSignInClick: () => void
}

// Category icon mapping
const CATEGORY_ICONS: Record<CategoryKey, React.ComponentType<any>> = {
  community: Users,
  projects: Building2,
  events: Calendar,
  economy: Building2,
  environment: Leaf,
  safety: AlertTriangle,
  faith: Church,
  data_ai: Database,
  issues: AlertTriangle
}

export default function PinPreviewTooltip({
  pin,
  position,
  isVisible,
  onClose,
  onSignInClick
}: PinPreviewTooltipProps) {
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Get primary category
  const primaryCategory = pin.categories[0] || 'community'
  const categoryConfig = CATEGORIES.find(c => c.key === primaryCategory) || CATEGORIES[0]
  const IconComponent = CATEGORY_ICONS[primaryCategory] || MapPin

  // Adjust tooltip position to stay within viewport
  useEffect(() => {
    if (!isVisible || !tooltipRef.current) return

    const tooltip = tooltipRef.current
    const rect = tooltip.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let adjustedX = position.x
    let adjustedY = position.y

    // Adjust horizontal position
    if (position.x + rect.width > viewportWidth - 20) {
      adjustedX = position.x - rect.width - 20
    }

    // Adjust vertical position
    if (position.y + rect.height > viewportHeight - 20) {
      adjustedY = position.y - rect.height - 20
    }

    // Ensure tooltip doesn't go off-screen
    adjustedX = Math.max(20, adjustedX)
    adjustedY = Math.max(20, adjustedY)

    setAdjustedPosition({ x: adjustedX, y: adjustedY })
  }, [position, isVisible])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, onClose])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Truncate description
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  if (!isVisible) return null

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className="fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-scale-in"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        maxWidth: 'calc(100vw - 40px)'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-preview-title"
      aria-describedby="pin-preview-description"
    >
      {/* Header */}
      <div 
        className="px-4 py-3 border-b border-gray-100"
        style={{ backgroundColor: `${categoryConfig.color}10` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Category icon */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: categoryConfig.color }}
            >
              <IconComponent className="w-4 h-4 text-white" />
            </div>

            {/* Title and metadata */}
            <div className="flex-1 min-w-0">
              <h3 
                id="pin-preview-title"
                className="font-semibold text-gray-900 text-sm leading-tight"
              >
                {pin.title}
              </h3>
              
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: `${categoryConfig.color}20`,
                    color: categoryConfig.color 
                  }}
                >
                  {categoryConfig.label}
                </Badge>
                
                {pin.categories.length > 1 && (
                  <Badge variant="outline" className="text-xs">
                    +{pin.categories.length - 1} more
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 p-0 text-gray-400 hover:text-gray-600"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description */}
        {pin.description && (
          <p 
            id="pin-preview-description"
            className="text-sm text-gray-600 mb-3 leading-relaxed"
          >
            {truncateText(pin.description, 120)}
          </p>
        )}

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          {/* Author type */}
          <div className="flex items-center text-xs text-gray-500">
            <User className="w-3 h-3 mr-1" />
            <span className="capitalize">{pin.author_type}</span>
          </div>

          {/* Created date */}
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{formatDate(pin.created_at)}</span>
          </div>

          {/* Project indicator */}
          {pin.project_id && (
            <div className="flex items-center text-xs text-gray-500">
              <Building2 className="w-3 h-3 mr-1" />
              <span>Part of a project</span>
            </div>
          )}
        </div>

        {/* Authentication gate */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-start space-x-2">
            <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-2">
                Sign in to view full details, comments, and participate in the community.
              </p>
              <Button
                onClick={onSignInClick}
                size="sm"
                variant="default"
                className="w-full bg-silas-green hover:bg-silas-green/90 text-white text-xs"
              >
                Sign In to Continue
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          SILAS Community Platform • Transparent • Public
        </p>
      </div>

      {/* Tooltip arrow */}
      <div
        className="absolute w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45"
        style={{
          left: '20px',
          top: '-6px'
        }}
      />
    </div>
  )

  // Render in portal to avoid z-index issues
  return createPortal(tooltipContent, document.body)
}

// Enhanced version with image preview
export function PinPreviewTooltipWithImage({
  pin,
  position,
  isVisible,
  onClose,
  onSignInClick
}: PinPreviewTooltipProps) {
  const hasImages = pin.photos && pin.photos.length > 0

  if (!hasImages) {
    return (
      <PinPreviewTooltip
        pin={pin}
        position={position}
        isVisible={isVisible}
        onClose={onClose}
        onSignInClick={onSignInClick}
      />
    )
  }

  // Similar implementation but with image preview
  // This would include the first image from pin.photos
  return (
    <PinPreviewTooltip
      pin={pin}
      position={position}
      isVisible={isVisible}
      onClose={onClose}
      onSignInClick={onSignInClick}
    />
  )
}

// Lightweight version for mobile
export function PinPreviewTooltipMobile({
  pin,
  isVisible,
  onClose,
  onSignInClick
}: Omit<PinPreviewTooltipProps, 'position'>) {
  if (!isVisible) return null

  const primaryCategory = pin.categories[0] || 'community'
  const categoryConfig = CATEGORIES.find(c => c.key === primaryCategory) || CATEGORIES[0]

  const tooltipContent = (
    <div className="fixed inset-x-4 bottom-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 animate-slide-in-left">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm pr-2">
            {pin.title}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-6 h-6 p-0 text-gray-400"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Badge 
          variant="secondary" 
          className="text-xs mb-2"
          style={{ 
            backgroundColor: `${categoryConfig.color}20`,
            color: categoryConfig.color 
          }}
        >
          {categoryConfig.label}
        </Badge>

        <Button
          onClick={onSignInClick}
          size="sm"
          variant="default"
          className="w-full bg-silas-green hover:bg-silas-green/90 text-white text-xs"
        >
          Sign In to View Details
        </Button>
      </div>
    </div>
  )

  return createPortal(tooltipContent, document.body)
}
