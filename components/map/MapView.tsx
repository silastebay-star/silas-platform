'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Map, { MapProvider, Source, Layer, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePinsStore, type Pin } from '@/store/pins'
import { useAuth } from '@/contexts/AuthContext'
import { getCategoryColor } from '@/config/categories'
import PinDrawer from './PinDrawer'
import AddPinModal from './AddPinModal'
import PinDetail from './PinDetail'
import { CensusDataVisualization } from './CensusDataVisualization'
import { handleError } from '@/lib/error-handling'

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
        category: p.categories[0], // Use the first category for styling
        color: getCategoryColor(p.categories[0] as CategoryKey),
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

  const { user } = useAuth()

  // Memoize GeoJSON conversion to prevent unnecessary recalculations
  const geoJsonData = useMemo(() => toGeoJSON(filteredPins), [filteredPins])

  // Memoize pin lookup for performance
  const pinLookup = useMemo(() => {
    const lookup = new Map()
    pins.forEach(pin => lookup.set(pin.id, pin))
    return lookup
  }, [pins])

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const styleUrl = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12'

  // Fetch pins on mount
  useEffect(() => {
    fetchPins()
  }, [fetchPins])

  // Handle add pin
  const handleAddPin = async (pinData: any) => {
    if (!user) {
      handleError('You must be logged in to add a pin.', 'MapView - handleAddPin', true)
      return
    }
    if (!newPinLocation) {
      handleError('Pin location not set.', 'MapView - handleAddPin', true)
      return
    }

    try {
      const newPin = await addPin({
        ...pinData,
        lat: newPinLocation.lat,
        lng: newPinLocation.lng,
        author_id: user.id,
      })

      if (newPin) {
        setShowAddPinModal?.(false)
        setNewPinLocation(null)
      }
    } catch (error: any) {
      handleError(error, 'MapView - handleAddPin', true)
    }
  }

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
      <MapProvider>
        <Map
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: -2.3769,
            latitude: 53.5526,
            zoom: 14,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={styleUrl}
          onLoad={() => setMapLoaded(true)}
          interactiveLayerIds={['unclustered-point', 'clusters']}
          onClick={(e) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0]
              if (feature.layer.id === 'unclustered-point') {
                const pinId = feature.properties?.id as string
                const pin = pinLookup.get(pinId)
                if (pin) {
                  setSelectedPin(pin)
                  setShowPinDrawer(true)
                }
              } else if (feature.layer.id === 'clusters') {
                const clusterId = feature.properties?.cluster_id
                const source = e.target.getSource('pins')
                source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                  if (err) return
                  e.target.easeTo({ center: feature.geometry.coordinates, zoom })
                })
              }
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            setNewPinLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng })
            setShowAddPinModal?.(true)
          }}
        >
          {mapLoaded && (
            <>
              {/* Source: pins (clustered) */}
              <Source
                id="pins"
                type="geojson"
                data={geoJsonData}
                cluster={true}
                clusterMaxZoom={14}
                clusterRadius={60}
              >
                <Layer
                  id="clusters"
                  type="circle"
                  filter={['has', 'point_count']}
                  paint={{
                    'circle-color': '#4C764C', // Silas Green
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
                  }}
                />
                <Layer
                  id="cluster-count"
                  type="symbol"
                  filter={['has', 'point_count']}
                  layout={{
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12,
                  }}
                  paint={{
                    'text-color': '#ffffff',
                  }}
                />
                <Layer
                  id="unclustered-point"
                  type="circle"
                  filter={['!', ['has', 'point_count']]}
                  paint={{
                    'circle-color': ['get', 'color'],
                    'circle-radius': 7,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#FFF',
                    'circle-opacity': 0.8,
                  }}
                />
              </Source>
              <NavigationControl position="top-right" />
              <GeolocateControl positionOptions={{ enableHighAccuracy: true }} trackUserLocation={true} showUserHeading={true} />
              <CensusDataVisualization />
            </>
          )}
        </Map>
      </MapProvider>

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
      {setShowAddPinModal && user && (
        <AddPinModal
          isOpen={showAddPinModal}
          onClose={() => {
            setShowAddPinModal(false)
            setNewPinLocation(null)
          }}
          onSubmit={handleAddPin}
          location={newPinLocation}
          authorId={user.id}
        />
      )}

      {/* Pin Detail Modal */}
      {selectedPin && (
        <PinDetail
          pinId={selectedPin.id}
          isOpen={!!selectedPin}
          onClose={() => setSelectedPin(null)}
        />
      )}

      {/* Pin Drawer (This might be removed later if PinDetail replaces it entirely) */}
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
