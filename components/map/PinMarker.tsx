'use client'

import { memo, useMemo } from 'react'
import { Pin, CategoryKey } from '@/types/silas'
import { CATEGORIES } from '@/types/silas'
import {
  MapPin,
  Users,
  Church,
  Building2,
  Calendar,
  Database,
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle,
  Leaf
} from 'lucide-react'

interface PinMarkerProps {
  pin: Pin
  isSelected?: boolean
  isHovered?: boolean
  onClick: (pin: Pin) => void
  onHover: (pin: Pin | null) => void
  size?: 'small' | 'medium' | 'large'
  showBadge?: boolean
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

// Status icon mapping
const STATUS_ICONS = {
  draft: Clock,
  proposed: Eye,
  published: CheckCircle,
  archived: CheckCircle,
  deleted: CheckCircle
}

// Size configurations
const SIZE_CONFIG = {
  small: {
    container: 'w-6 h-6',
    icon: 'w-3 h-3',
    badge: 'w-3 h-3 text-xs',
    ring: 'ring-1'
  },
  medium: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    badge: 'w-4 h-4 text-xs',
    ring: 'ring-2'
  },
  large: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    badge: 'w-5 h-5 text-sm',
    ring: 'ring-3'
  }
}

function PinMarker({
  pin,
  isSelected = false,
  isHovered = false,
  onClick,
  onHover,
  size = 'medium',
  showBadge = true
}: PinMarkerProps) {
  // Get primary category for styling
  const primaryCategory = pin.categories[0] || 'community'
  
  // Get category configuration
  const categoryConfig = useMemo(() => {
    return CATEGORIES.find(c => c.key === primaryCategory) || CATEGORIES[0]
  }, [primaryCategory])

  // Get appropriate icon
  const IconComponent = CATEGORY_ICONS[primaryCategory] || MapPin
  const StatusIcon = STATUS_ICONS[pin.status] || CheckCircle

  // Size configuration
  const sizeConfig = SIZE_CONFIG[size]

  // Calculate opacity based on status
  const opacity = useMemo(() => {
    switch (pin.status) {
      case 'draft': return 0.6
      case 'proposed': return 0.8
      case 'archived': return 0.5
      default: return 1.0
    }
  }, [pin.status])

  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick(pin)
  }

  // Handle mouse events
  const handleMouseEnter = () => {
    onHover(pin)
  }

  const handleMouseLeave = () => {
    onHover(null)
  }

  return (
    <div
      className={`
        relative cursor-pointer transition-all duration-200 ease-in-out
        ${sizeConfig.container}
        ${isHovered ? 'scale-110' : 'scale-100'}
        ${isSelected ? 'z-20' : 'z-10'}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`Pin: ${pin.title}`}
      style={{ opacity }}
    >
      {/* Main pin circle */}
      <div
        className={`
          relative rounded-full flex items-center justify-center
          transition-all duration-200 ease-in-out
          ${sizeConfig.container}
          ${isSelected 
            ? `${sizeConfig.ring} ring-silas-green ring-offset-2 ring-offset-white` 
            : isHovered 
              ? `${sizeConfig.ring} ring-white ring-offset-1 ring-offset-gray-900`
              : ''
          }
        `}
        style={{ 
          backgroundColor: categoryConfig.color,
          boxShadow: isSelected 
            ? `0 4px 12px rgba(76, 118, 76, 0.4)`
            : isHovered
              ? `0 2px 8px rgba(0, 0, 0, 0.3)`
              : `0 1px 4px rgba(0, 0, 0, 0.2)`
        }}
      >
        {/* Category icon */}
        <IconComponent 
          className={`${sizeConfig.icon} text-white`}
          aria-hidden="true"
        />

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 rounded-full border-2 border-silas-green animate-pulse" />
        )}
      </div>

      {/* Status badge */}
      {showBadge && pin.status !== 'published' && (
        <div
          className={`
            absolute -top-1 -right-1 rounded-full flex items-center justify-center
            ${sizeConfig.badge}
            ${pin.status === 'draft' 
              ? 'bg-yellow-500' 
              : pin.status === 'proposed'
                ? 'bg-blue-500'
                : 'bg-gray-500'
            }
            ring-2 ring-white
          `}
          title={`Status: ${pin.status}`}
        >
          <StatusIcon 
            className="w-2 h-2 text-white" 
            aria-hidden="true"
          />
        </div>
      )}

      {/* Multi-category indicator */}
      {pin.categories.length > 1 && (
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center"
          title={`${pin.categories.length} categories`}
        >
          <span className="text-xs font-bold text-gray-600">
            {pin.categories.length}
          </span>
        </div>
      )}

      {/* Project indicator */}
      {pin.project_id && (
        <div
          className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-silas-green border-2 border-white"
          title="Part of a project"
        >
          <div className="w-full h-full rounded-full bg-silas-green opacity-80" />
        </div>
      )}

      {/* Hover glow effect */}
      {isHovered && (
        <div 
          className="absolute inset-0 rounded-full animate-ping"
          style={{ 
            backgroundColor: categoryConfig.color,
            opacity: 0.3
          }}
        />
      )}

      {/* Accessibility enhancements */}
      <div className="sr-only">
        <span>Pin titled &quot;{pin.title}&quot;</span>
        <span>Category: {categoryConfig.label}</span>
        <span>Status: {pin.status}</span>
        {pin.description && <span>Description: {pin.description}</span>}
        {pin.project_id && <span>Part of a project</span>}
        <span>Click to view details</span>
      </div>
    </div>
  )
}

// Memoize component for performance
export default memo(PinMarker, (prevProps, nextProps) => {
  return (
    prevProps.pin.id === nextProps.pin.id &&
    prevProps.pin.updated_at === nextProps.pin.updated_at &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.size === nextProps.size &&
    prevProps.showBadge === nextProps.showBadge
  )
})

// Export additional components for advanced use cases

export function ClusterMarker({
  count,
  dominantCategory,
  categories,
  onClick,
  size = 'medium'
}: {
  count: number
  dominantCategory: CategoryKey
  categories: CategoryKey[]
  onClick: () => void
  size?: 'small' | 'medium' | 'large'
}) {
  const categoryConfig = CATEGORIES.find(c => c.key === dominantCategory) || CATEGORIES[0]
  const sizeConfig = SIZE_CONFIG[size]

  // Calculate cluster size based on count
  const clusterSize = useMemo(() => {
    if (count < 10) return sizeConfig.container
    if (count < 30) return size === 'small' ? 'w-8 h-8' : size === 'medium' ? 'w-10 h-10' : 'w-14 h-14'
    if (count < 50) return size === 'small' ? 'w-10 h-10' : size === 'medium' ? 'w-12 h-12' : 'w-16 h-16'
    return size === 'small' ? 'w-12 h-12' : size === 'medium' ? 'w-14 h-14' : 'w-18 h-18'
  }, [count, size, sizeConfig])

  return (
    <div
      className={`
        relative cursor-pointer transition-all duration-200 ease-in-out
        ${clusterSize}
        hover:scale-110
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Cluster of ${count} pins`}
    >
      {/* Cluster circle */}
      <div
        className={`
          relative rounded-full flex items-center justify-center
          ${clusterSize}
          ring-2 ring-white
        `}
        style={{ 
          backgroundColor: categoryConfig.color,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Count */}
        <span className="text-white font-bold text-sm">
          {count > 99 ? '99+' : count}
        </span>
      </div>

      {/* Multi-category indicator */}
      {categories.length > 1 && (
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-white opacity-60" />
      )}
    </div>
  )
}
