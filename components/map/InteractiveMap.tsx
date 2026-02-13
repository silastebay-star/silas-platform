/**
 * Interactive Map Component
 * Main map component with pin display and interaction capabilities
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Pin, PinCategory } from '@/lib/services/pin-service'

// Production Pin Categories with Exact Color Specifications
const PIN_CATEGORY_CONFIG = {
  community: { label: 'Community', icon: '👥', color: '#6B8E6B' },
  projects: { label: 'Projects', icon: '🔨', color: '#4C764C' },
  events: { label: 'Events', icon: '📅', color: '#8CBFA5' },
  economy: { label: 'Economy', icon: '💼', color: '#4C6F76' },
  environment: { label: 'Environment', icon: '🌿', color: '#059669' },
  safety: { label: 'Safety', icon: '🚨', color: '#DC2626' },
  faith: { label: 'Faith', icon: '🙏', color: '#3A5D3A' },
  data_ai: { label: 'Data & AI', icon: '📊', color: '#5E6E6E' }
}

interface InteractiveMapProps {
  center: { lat: number; lng: number }
  pins: Pin[]
  onPinClick?: (pin: Pin) => void
  onMapClick?: (location: { lat: number; lng: number }) => void
  onBoundsChange?: (bounds: any) => void
  loading?: boolean
  className?: string
}

export function InteractiveMap({
  center,
  pins,
  onPinClick,
  onMapClick,
  onBoundsChange,
  loading = false,
  className = ""
}: InteractiveMapProps) {
  const [mapCenter, setMapCenter] = useState(center)
  const [zoom, setZoom] = useState(14)
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Mock map implementation - in production, this would use a real map library like Leaflet or Mapbox
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onMapClick) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convert pixel coordinates to lat/lng (mock calculation)
    const lat = center.lat + (y - rect.height / 2) * 0.0001
    const lng = center.lng + (x - rect.width / 2) * 0.0001

    onMapClick({ lat, lng })
  }

  const handlePinClick = (pin: Pin, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedPinId(pin.id)
    onPinClick?.(pin)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 18))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 1))
  }

  const handleResetView = () => {
    setMapCenter(center)
    setZoom(14)
  }

  // Simulate bounds change
  useEffect(() => {
    const bounds = {
      north: mapCenter.lat + 0.01,
      south: mapCenter.lat - 0.01,
      east: mapCenter.lng + 0.01,
      west: mapCenter.lng - 0.01
    }
    onBoundsChange?.(bounds)
  }, [mapCenter, zoom, onBoundsChange])

  return (
    <div className={cn("relative w-full h-full bg-green-50", className)}>
      {/* Map Background */}
      <div
        ref={mapRef}
        className="absolute inset-0 cursor-crosshair overflow-hidden touch-manipulation"
        onClick={handleMapClick}
        onTouchEnd={(e) => {
          // Handle touch events for mobile
          if (e.touches.length === 0 && e.changedTouches.length === 1) {
            const touch = e.changedTouches[0]
            const rect = e.currentTarget.getBoundingClientRect()
            const x = touch.clientX - rect.left
            const y = touch.clientY - rect.top

            // Convert to lat/lng (mock calculation)
            const lat = center.lat + (y - rect.height / 2) * 0.0001
            const lng = center.lng + (x - rect.width / 2) * 0.0001

            onMapClick?.({ lat, lng })
          }
        }}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(5, 150, 105, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(5, 150, 105, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(5, 150, 105, 0.08) 0%, transparent 50%)
          `,
          backgroundColor: '#f0fdf4'
        }}
      >
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(5, 150, 105, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(5, 150, 105, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Center Marker */}
        <div 
          className="absolute w-4 h-4 bg-silas-green rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: '50%',
            top: '50%'
          }}
        />

        {/* Pins */}
        {pins.map((pin, index) => {
          const categoryConfig = PIN_CATEGORY_CONFIG[pin.category]
          
          // Mock positioning based on index and some variation
          const offsetX = (index % 5 - 2) * 80 + (Math.sin(index) * 40)
          const offsetY = (Math.floor(index / 5) % 5 - 2) * 60 + (Math.cos(index) * 30)
          
          return (
            <div
              key={pin.id}
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all duration-200",
                selectedPinId === pin.id && "scale-125 z-30"
              )}
              style={{
                left: `calc(50% + ${offsetX}px)`,
                top: `calc(50% + ${offsetY}px)`
              }}
              onClick={(e) => handlePinClick(pin, e)}
            >
              {/* Pin Marker */}
              <div 
                className="w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform"
                style={{ backgroundColor: categoryConfig.color }}
              >
                <span className="text-xs">{categoryConfig.icon}</span>
              </div>

              {/* Pin Tooltip */}
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-40">
                <Card className="bg-white/95 backdrop-blur-md border-gray-200/60 shadow-xl min-w-[200px]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${categoryConfig.color}20`,
                          color: categoryConfig.color,
                          border: `1px solid ${categoryConfig.color}40`
                        }}
                      >
                        {categoryConfig.icon} {categoryConfig.label}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {pin.title}
                    </h4>
                    {pin.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {pin.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>❤️ {pin.like_count}</span>
                      <span>💬 {pin.comment_count}</span>
                      <span>👁️ {pin.view_count}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        })}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="bg-white/90 backdrop-blur-md">
              <CardContent className="p-6 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-silas-green" />
                <span className="text-sm font-medium">Loading community data...</span>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Map Controls - Mobile Optimized */}
      <div className="absolute bottom-20 md:bottom-6 left-4 md:left-6 z-[8000]">
        <Card className="bg-white/95 backdrop-blur-md border-gray-200/60 shadow-lg">
          <CardContent className="p-2">
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="h-10 w-10 p-0 touch-manipulation"
                title="Zoom In"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="h-10 w-10 p-0 touch-manipulation"
                title="Zoom Out"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetView}
                className="h-10 w-10 p-0 touch-manipulation"
                title="Reset View"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Hint */}
      <div className="absolute bottom-20 md:bottom-6 right-4 md:right-6 z-[8000]">
        <Card className="bg-white/95 backdrop-blur-md border-gray-200/60 shadow-lg">
          <CardContent className="p-3">
            <div className="text-center">
              <h4 className="font-semibold text-sm mb-1">Stoneclough Map</h4>
              <div className="text-xs text-gray-600">
                {pins.length} community pins
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Tap anywhere to add a pin
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Info */}
      <div className="absolute top-4 left-4 z-[8000]">
        <Card className="bg-white/90 backdrop-blur-md border-gray-200/60 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-silas-green" />
              <span className="font-medium">Stoneclough Community Map</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {pins.length} community pins • Zoom: {zoom}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
