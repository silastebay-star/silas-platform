'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapRootProps, MapViewState, Pin, MapFilters, CategoryKey } from '@/types/silas'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import PinLayer from './PinLayer'
import PinPreviewTooltip from './PinPreviewTooltip'
import GeoJSONOverlay from './GeoJSONOverlay'
import { ErrorTracker, PerformanceTracker } from '@/lib/monitoring'
import {
  loadBoundaryConfig,
  getBoundaryConfig,
  BOUNDARY_LAYER_CONFIG,
  BOUNDARY_OUTLINE_LAYER_CONFIG
} from '@/lib/boundary-utils'

// Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

// Get boundary configuration
const boundaryConfig = getBoundaryConfig()

// Default map configuration using boundary center
const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: boundaryConfig.center[0],
  latitude: boundaryConfig.center[1],
  zoom: 15,
  bearing: 0,
  pitch: 0
}

const DEFAULT_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12'

interface MapRootState {
  isLoaded: boolean
  pins: Pin[]
  selectedPin: Pin | null
  hoveredPin: Pin | null
  showGeoJSONOverlay: boolean
  previewTooltip: {
    pin: Pin | null
    position: { x: number; y: number }
    visible: boolean
  }
}

export default function MapRoot({
  activeCategory,
  filters = { categories: [], status: ['published'], author_type: [] },
  onPinSelect,
  onPinHover,
  onMapMove,
  className = '',
  style = {}
}: MapRootProps) {
  // Refs
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  
  // Auth context
  const { user, profile } = useAuth()
  
  // State
  const [state, setState] = useState<MapRootState>({
    isLoaded: false,
    pins: [],
    selectedPin: null,
    hoveredPin: null,
    showGeoJSONOverlay: false,
    previewTooltip: {
      pin: null,
      position: { x: 0, y: 0 },
      visible: false
    }
  })

  // Memoized filters with active category
  const effectiveFilters = useMemo<MapFilters>(() => ({
    ...filters,
    categories: activeCategory 
      ? [activeCategory, ...filters.categories.filter(c => c !== activeCategory)]
      : filters.categories
  }), [filters, activeCategory])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    PerformanceTracker.startTiming('map-initialization')

    // Load boundary data first
    loadBoundaryConfig().then(() => {
      initializeMap()
    }).catch(error => {
      console.error('Failed to load boundary data:', error)
      initializeMap() // Continue with fallback
    })

    function initializeMap() {
      if (!mapContainer.current || map.current) return

      try {
        const boundaryConfig = getBoundaryConfig()
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: DEFAULT_STYLE,
          center: boundaryConfig.center,
          zoom: DEFAULT_VIEW_STATE.zoom,
          bearing: DEFAULT_VIEW_STATE.bearing,
          pitch: DEFAULT_VIEW_STATE.pitch,
          antialias: true,
          maxZoom: 20,
          minZoom: 10,
          maxBounds: boundaryConfig.maxBounds
        })

        // Fit map to boundary on initialization
        map.current.fitBounds(boundaryConfig.bounds, {
          padding: 50,
          duration: 0 // No animation on initial load
        })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      
      // Add geolocate control
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      })
      map.current.addControl(geolocate, 'top-right')

      // Add GeoJSON overlay toggle control
      const geoJSONToggle = new (class {
        onAdd(map: mapboxgl.Map) {
          this._map = map
          this._container = document.createElement('div')
          this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'

          const button = document.createElement('button')
          button.className = 'mapboxgl-ctrl-icon'
          button.type = 'button'
          button.title = 'Toggle Geographic Overlays'
          button.innerHTML = '🗺️'
          button.style.fontSize = '16px'
          button.style.width = '29px'
          button.style.height = '29px'
          button.style.display = 'flex'
          button.style.alignItems = 'center'
          button.style.justifyContent = 'center'

          button.addEventListener('click', () => {
            setState(prev => ({ ...prev, showGeoJSONOverlay: !prev.showGeoJSONOverlay }))
          })

          this._container.appendChild(button)
          return this._container
        }

        onRemove() {
          this._container.parentNode?.removeChild(this._container)
          this._map = undefined
        }
      })()

      map.current.addControl(geoJSONToggle, 'top-right')

        // Map event handlers
        map.current.on('load', () => {
          // Add boundary data source
          if (map.current && boundaryConfig.geojson.features.length > 0) {
            map.current.addSource('community-boundary', {
              type: 'geojson',
              data: boundaryConfig.geojson
            })

            // Add boundary fill layer
            map.current.addLayer({
              ...BOUNDARY_LAYER_CONFIG,
              source: 'community-boundary'
            })

            // Add boundary outline layer
            map.current.addLayer({
              ...BOUNDARY_OUTLINE_LAYER_CONFIG,
              source: 'community-boundary'
            })
          }

          setState(prev => ({ ...prev, isLoaded: true }))
          PerformanceTracker.endTiming('map-initialization')
        })

      map.current.on('move', () => {
        if (onMapMove && map.current) {
          const center = map.current.getCenter()
          const zoom = map.current.getZoom()
          const bearing = map.current.getBearing()
          const pitch = map.current.getPitch()
          
          onMapMove({
            longitude: center.lng,
            latitude: center.lat,
            zoom,
            bearing,
            pitch
          })
        }
      })

        // Error handling
        map.current.on('error', (e) => {
          ErrorTracker.logCustomError('Mapbox error', { error: e.error })
        })

      } catch (error) {
        ErrorTracker.logCustomError('Map initialization failed', { error })
      }
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [onMapMove])

  // Fetch pins based on filters
  const fetchPins = useCallback(async () => {
    if (!map.current) return

    try {
      PerformanceTracker.startTiming('pin-fetch')
      
      // Get current map bounds
      const bounds = map.current.getBounds()
      if (!bounds) return

      const bbox = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      }

      // Build query
      let query = supabase
        .from('pins')
        .select(`
          *,
          author:profiles(id, display_name, role),
          project:projects(id, name, status),
          group:groups(id, name, public)
        `)
        .gte('geom->coordinates->1', bbox.south)
        .lte('geom->coordinates->1', bbox.north)
        .gte('geom->coordinates->0', bbox.west)
        .lte('geom->coordinates->0', bbox.east)

      // Apply status filter
      if (effectiveFilters.status.length > 0) {
        query = query.in('status', effectiveFilters.status)
      }

      // Apply category filter
      if (effectiveFilters.categories.length > 0) {
        query = query.overlaps('categories', effectiveFilters.categories)
      }

      // Apply author type filter
      if (effectiveFilters.author_type.length > 0) {
        query = query.in('author_type', effectiveFilters.author_type)
      }

      // Apply search query
      if (effectiveFilters.search_query) {
        query = query.or(`title.ilike.%${effectiveFilters.search_query}%,description.ilike.%${effectiveFilters.search_query}%`)
      }

      // Apply date range filter
      if (effectiveFilters.date_range) {
        query = query
          .gte('created_at', effectiveFilters.date_range.start)
          .lte('created_at', effectiveFilters.date_range.end)
      }

      // Limit results for performance
      query = query.limit(1000)

      const { data, error } = await query

      if (error) {
        throw error
      }

      setState(prev => ({ ...prev, pins: data || [] }))
      PerformanceTracker.endTiming('pin-fetch')
      PerformanceTracker.measurePinLoad(data?.length || 0)

    } catch (error) {
      ErrorTracker.logCustomError('Pin fetch failed', { error, filters: effectiveFilters })
    }
  }, [effectiveFilters])

  // Fetch pins when map loads or filters change
  useEffect(() => {
    if (state.isLoaded) {
      fetchPins()
    }
  }, [state.isLoaded, fetchPins])

  // Real-time subscriptions
  useEffect(() => {
    if (!state.isLoaded) return

    // Subscribe to pin changes
    const pinSubscription = supabase
      .channel('pins-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pins' },
        (payload) => {
          // Refresh pins on any change
          fetchPins()
        }
      )
      .subscribe()

    return () => {
      pinSubscription.unsubscribe()
    }
  }, [state.isLoaded, fetchPins])

  // Pin selection handlers
  const handlePinClick = useCallback((pin: Pin) => {
    setState(prev => ({ 
      ...prev, 
      selectedPin: pin,
      previewTooltip: { ...prev.previewTooltip, visible: false }
    }))
    onPinSelect(pin)
  }, [onPinSelect])

  const handlePinHover = useCallback((pin: Pin | null, event?: MouseEvent) => {
    setState(prev => ({ ...prev, hoveredPin: pin }))
    
    if (onPinHover) {
      onPinHover(pin)
    }

    // Show preview tooltip for guest users
    if (pin && !user && event) {
      setState(prev => ({
        ...prev,
        previewTooltip: {
          pin,
          position: { x: event.clientX, y: event.clientY },
          visible: true
        }
      }))
    } else {
      setState(prev => ({
        ...prev,
        previewTooltip: { ...prev.previewTooltip, visible: false }
      }))
    }
  }, [onPinHover, user])

  // Close preview tooltip
  const handleClosePreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      previewTooltip: { ...prev.previewTooltip, visible: false }
    }))
  }, [])

  // Handle sign-in click from preview
  const handleSignInClick = useCallback(() => {
    // This would trigger the auth modal
    // Implementation depends on your auth system
    console.log('Sign in clicked from preview')
  }, [])

  if (!mapboxgl.accessToken) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Configuration Required</h3>
          <p className="text-gray-600">Please configure your Mapbox access token.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`} style={style}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        role="application"
        aria-label="Interactive map showing community pins"
      />

      {/* Pin Layer */}
      {state.isLoaded && map.current && (
        <PinLayer
          map={map.current}
          pins={state.pins}
          selectedPinId={state.selectedPin?.id}
          hoveredPinId={state.hoveredPin?.id}
          filters={effectiveFilters}
          onPinClick={handlePinClick}
          onPinHover={handlePinHover}
          showClustering={true}
          clusterRadius={50}
        />
      )}

      {/* GeoJSON Overlay */}
      {map.current && (
        <GeoJSONOverlay
          map={map.current}
          visible={state.showGeoJSONOverlay}
          onToggle={() => setState(prev => ({ ...prev, showGeoJSONOverlay: !prev.showGeoJSONOverlay }))}
        />
      )}

      {/* Preview Tooltip for Guest Users */}
      {state.previewTooltip.visible && state.previewTooltip.pin && (
        <PinPreviewTooltip
          pin={state.previewTooltip.pin}
          position={state.previewTooltip.position}
          isVisible={state.previewTooltip.visible}
          onClose={handleClosePreview}
          onSignInClick={handleSignInClick}
        />
      )}

      {/* Loading Indicator */}
      {!state.isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-8 h-8 bg-silas-green rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div className="text-sm text-gray-600">Loading map...</div>
          </div>
        </div>
      )}
    </div>
  )
}
