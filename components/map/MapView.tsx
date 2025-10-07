'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePinsStore, type Pin } from '@/store/pins'
import { getCategoryColor } from '@/config/categories'
import PinDrawer from './PinDrawer'
import AddPinModal from './AddPinModal'

interface MapViewProps {
  filteredPins: Pin[]
  showAddPinModal?: boolean
  setShowAddPinModal?: (show: boolean) => void
}

// Helper: convert pins to GeoJSON FeatureCollection
function pinsToFeatureCollection(pins: Pin) {
  // dummy to satisfy TS when not used
  return pins as any
}

function toGeoJSON(pins: Pin[]) {
  return {
    type: 'FeatureCollection',
    features: pins.map((p) => ({
      type: 'Feature',
      id: p.id,
      properties: {
        id: p.id,
        type: p.type,
        color: getCategoryColor(p.type),
        title: p.title,
      },
      geometry: {
        type: 'Point',
        coordinates: [p.lng, p.lat],
      },
    })),
  } as GeoJSON.FeatureCollection
}

export default function MapView({ filteredPins, showAddPinModal = false, setShowAddPinModal }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const mapboxRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const [newPinLocation, setNewPinLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showPinDrawer, setShowPinDrawer] = useState(false)

  const {
    selectedPin,
    setSelectedPin,
    addPin,
    fetchPins,
    isLoading,
    error,
    pins,
  } = usePinsStore()

  // Memoize GeoJSON conversion to prevent unnecessary recalculations
  const geoJsonData = useMemo(() => toGeoJSON(filteredPins), [filteredPins])

  // Memoize pin lookup for performance
  const pinLookup = useMemo(() => {
    const lookup = new Map()
    pins.forEach(pin => lookup.set(pin.id, pin))
    return lookup
  }, [pins])

  // Initialize map via dynamic import for smaller initial bundle
  useEffect(() => {
    let isCancelled = false

    async function init() {
      if (!mapContainer.current || mapRef.current) return

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      if (!mapboxToken) {
        console.warn('Mapbox token not found')
        return
      }

      const mapboxgl = (await import('mapbox-gl')).default
      if (isCancelled) return
      mapboxRef.current = mapboxgl
      mapboxgl.accessToken = mapboxToken

      const styleUrl = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12'

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [-2.3769, 53.5526], // Stoneclough coordinates
        zoom: 14,
        pitch: 0,
        bearing: 0,
      })

      mapRef.current.on('load', () => {
        setMapLoaded(true)

        // Source: pins (clustered)
        if (!mapRef.current.getSource('pins')) {
          mapRef.current.addSource('pins', {
            type: 'geojson',
            data: geoJsonData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 60,
            clusterProperties: {
              // Calculate dominant category in each cluster
              'dominant_category': [
                'case',
                ['>', ['get', 'community_count'], ['get', 'faith_count']], 'community',
                ['>', ['get', 'faith_count'], ['get', 'projects_count']], 'faith',
                ['>', ['get', 'projects_count'], ['get', 'economy_count']], 'projects',
                ['>', ['get', 'economy_count'], ['get', 'events_count']], 'economy',
                ['>', ['get', 'events_count'], ['get', 'data_ai_count']], 'events',
                ['>', ['get', 'data_ai_count'], ['get', 'issues_count']], 'data_ai',
                'issues' // fallback
              ],
              // Count pins by category in each cluster
              'community_count': ['+', ['case', ['==', ['get', 'type'], 'community'], 1, 0]],
              'faith_count': ['+', ['case', ['==', ['get', 'type'], 'faith'], 1, 0]],
              'projects_count': ['+', ['case', ['==', ['get', 'type'], 'projects'], 1, 0]],
              'economy_count': ['+', ['case', ['==', ['get', 'type'], 'economy'], 1, 0]],
              'events_count': ['+', ['case', ['==', ['get', 'type'], 'events'], 1, 0]],
              'data_ai_count': ['+', ['case', ['==', ['get', 'type'], 'data_ai'], 1, 0]],
              'issues_count': ['+', ['case', ['==', ['get', 'type'], 'issues'], 1, 0]]
            }
          })
        }

        // Layer: clusters
        if (!mapRef.current.getLayer('clusters')) {
          mapRef.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'pins',
            filter: ['has', 'point_count'],
            paint: {
              // Category-aware cluster colors with fallback to SILAS green
              'circle-color': [
                'case',
                ['has', 'dominant_category'],
                [
                  'case',
                  ['==', ['get', 'dominant_category'], 'community'], '#6B8E6B',
                  ['==', ['get', 'dominant_category'], 'faith'], '#3A5D3A',
                  ['==', ['get', 'dominant_category'], 'projects'], '#4C764C',
                  ['==', ['get', 'dominant_category'], 'economy'], '#4C6F76',
                  ['==', ['get', 'dominant_category'], 'events'], '#8CBFA5',
                  ['==', ['get', 'dominant_category'], 'data_ai'], '#5E6E6E',
                  ['==', ['get', 'dominant_category'], 'issues'], '#C97340',
                  '#4C764C' // fallback to SILAS green
                ],
                '#4C764C' // fallback when no dominant_category
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                16,
                10, 20,
                30, 26,
                100, 32,
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFF',
              'circle-opacity': 0.8,
            },
          })
        }

        // Layer: cluster count labels
        if (!mapRef.current.getLayer('cluster-count')) {
          mapRef.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'pins',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
            paint: {
              'text-color': '#ffffff',
            },
          })
        }

        // Layer: unclustered points
        if (!mapRef.current.getLayer('unclustered-point')) {
          mapRef.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'pins',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': ['get', 'color'],
              'circle-radius': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                9, // larger radius on hover
                7  // normal radius
              ],
              'circle-stroke-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                3, // thicker stroke on hover
                2  // normal stroke
              ],
              'circle-stroke-color': '#FFF',
              'circle-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1.0, // full opacity on hover
                0.8  // slightly transparent normally
              ],
            },
          })
        }

        // Interactions: right-click add pin
        mapRef.current.on('contextmenu', (e: any) => {
          e.preventDefault()
          setNewPinLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng })
          setShowAddPinModal?.(true)
        })

        // Interactions: click cluster to zoom in
        mapRef.current.on('click', 'clusters', (e: any) => {
          const features = mapRef.current.queryRenderedFeatures(e.point, { layers: ['clusters'] })
          const clusterId = features[0].properties.cluster_id
          const source: any = mapRef.current.getSource('pins')
          source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return
            mapRef.current.easeTo({ center: features[0].geometry.coordinates, zoom })
          })
        })

        // Interactions: click pin to open drawer
        mapRef.current.on('click', 'unclustered-point', (e: any) => {
          const feature = e.features && e.features[0]
          if (!feature) return
          const pinId = feature.properties?.id as string
          const pin = pinLookup.get(pinId)
          if (pin) {
            setSelectedPin(pin)
            setShowPinDrawer(true)
          }
        })

        // Hover effects and cursor feedback
        let hoveredPinId: string | null = null

        // Cluster hover effects
        mapRef.current.on('mouseenter', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer'
        })
        mapRef.current.on('mouseleave', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = ''
        })

        // Pin hover effects with feature-state
        mapRef.current.on('mouseenter', 'unclustered-point', (e: any) => {
          mapRef.current.getCanvas().style.cursor = 'pointer'

          if (e.features.length > 0) {
            const feature = e.features[0]
            const pinId = feature.properties?.id

            if (hoveredPinId !== null) {
              mapRef.current.setFeatureState(
                { source: 'pins', id: hoveredPinId },
                { hover: false }
              )
            }

            hoveredPinId = pinId
            mapRef.current.setFeatureState(
              { source: 'pins', id: pinId },
              { hover: true }
            )

            // Create lightweight hover popup
            const coordinates = feature.geometry.coordinates.slice()
            const { title, type } = feature.properties

            // Ensure popup appears above the point
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
            }

            const popup = new mapboxRef.current.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'pin-hover-popup',
              offset: [0, -10]
            })
              .setLngLat(coordinates)
              .setHTML(`
                <div class="p-2 text-sm">
                  <div class="font-medium text-gray-900">${title}</div>
                  <div class="text-xs text-gray-500 capitalize">${type.replace('_', ' ')}</div>
                </div>
              `)
              .addTo(mapRef.current)

            // Store popup reference for cleanup
            mapRef.current._hoverPopup = popup
          }
        })

        mapRef.current.on('mouseleave', 'unclustered-point', () => {
          mapRef.current.getCanvas().style.cursor = ''

          if (hoveredPinId !== null) {
            mapRef.current.setFeatureState(
              { source: 'pins', id: hoveredPinId },
              { hover: false }
            )
            hoveredPinId = null
          }

          // Remove hover popup
          if (mapRef.current._hoverPopup) {
            mapRef.current._hoverPopup.remove()
            mapRef.current._hoverPopup = null
          }
        })

        // Navigation controls
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
        mapRef.current.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true,
          }),
          'top-right',
        )
      })
    }

    init()

    return () => {
      isCancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  // We intentionally exclude filteredPins here; source updates handled below
  }, [])

  // Fetch pins on mount
  useEffect(() => {
    fetchPins()
  }, [fetchPins])

  // Keep GeoJSON source in sync with filtered pins
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    const source: any = mapRef.current.getSource('pins')
    if (source) {
      source.setData(geoJsonData)
    }
  }, [geoJsonData, mapLoaded])

  // Keyboard shortcut: 'A' to add a pin at map center
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a') {
        const center = mapRef.current.getCenter()
        setNewPinLocation({ lat: center.lat, lng: center.lng })
        setShowAddPinModal?.(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mapLoaded])

  // Handle add pin
  const handleAddPin = async (pinData: any) => {
    if (!newPinLocation) return

    const newPin = await addPin({
      ...pinData,
      lat: newPinLocation.lat,
      lng: newPinLocation.lng,
    })

    if (newPin) {
      setShowAddPinModal?.(false)
      setNewPinLocation(null)
    }
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Mapbox Token Required</h3>
          <p className="text-gray-500">Please add your Mapbox access token to environment variables</p>
          <code className="block mt-2 p-2 bg-gray-200 rounded text-sm">NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here</code>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-silas-green"></div>
            <span className="text-sm text-gray-600">Loading pins...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-10">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Pin Count */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2 z-10">
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="w-4 h-4 text-silas-green" />
          <span className="font-medium">{filteredPins.length} pins</span>
        </div>
      </div>

      {/* Add Pin Instructions */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-3 max-w-xs z-10">
        <div className="flex items-start space-x-2">
          <Plus className="w-5 h-5 text-silas-green mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Add a Pin</p>
            <p className="text-xs text-gray-600">Right-click anywhere on the map</p>
          </div>
        </div>
      </div>

      {/* Add Pin Modal */}
      {setShowAddPinModal && (
        <AddPinModal
          isOpen={showAddPinModal}
          onClose={() => {
            setShowAddPinModal(false)
            setNewPinLocation(null)
          }}
          onSubmit={handleAddPin}
          location={newPinLocation}
        />
      )}

      {/* Pin Drawer */}
      <PinDrawer
        pin={selectedPin}
        isOpen={showPinDrawer}
        onClose={() => {
          setShowPinDrawer(false)
          setSelectedPin(null)
        }}
      />
    </div>
  )
}
