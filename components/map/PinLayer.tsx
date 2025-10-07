'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import { Pin, MapFilters, CategoryKey, PinFeature, ClusterFeature } from '@/types/silas'
import { CATEGORIES } from '@/types/silas'
import { ErrorTracker } from '@/lib/monitoring'

interface PinLayerProps {
  map: mapboxgl.Map
  pins: Pin[]
  selectedPinId?: string
  hoveredPinId?: string
  filters: MapFilters
  onPinClick: (pin: Pin) => void
  onPinHover: (pin: Pin | null, event?: MouseEvent) => void
  showClustering?: boolean
  clusterRadius?: number
}

// Source and layer IDs
const PINS_SOURCE_ID = 'pins-source'
const CLUSTERS_LAYER_ID = 'clusters'
const CLUSTER_COUNT_LAYER_ID = 'cluster-count'
const UNCLUSTERED_LAYER_ID = 'unclustered-pins'
const SELECTED_PIN_LAYER_ID = 'selected-pin'

export default function PinLayer({
  map,
  pins,
  selectedPinId,
  hoveredPinId,
  filters,
  onPinClick,
  onPinHover,
  showClustering = true,
  clusterRadius = 50
}: PinLayerProps) {
  const layersInitialized = useRef(false)
  const pinLookup = useRef<Map<string, Pin>>(new Map())

  // Convert pins to GeoJSON features
  const geoJsonData = useMemo(() => {
    const features: PinFeature[] = pins.map(pin => ({
      type: 'Feature',
      id: pin.id,
      geometry: pin.geom,
      properties: {
        ...pin,
        cluster: false
      }
    }))

    // Update pin lookup
    pinLookup.current.clear()
    pins.forEach(pin => {
      pinLookup.current.set(pin.id, pin)
    })

    return {
      type: 'FeatureCollection' as const,
      features
    }
  }, [pins])

  // Get category color
  const getCategoryColor = useCallback((categoryKey: CategoryKey): string => {
    const category = CATEGORIES.find(c => c.key === categoryKey)
    return category?.color || '#6B8E6B'
  }, [])

  // Get dominant category from cluster
  const getDominantCategory = useCallback((categories: CategoryKey[]): CategoryKey => {
    const counts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<CategoryKey, number>)

    return Object.entries(counts).reduce((a, b) => 
      counts[a[0] as CategoryKey] > counts[b[0] as CategoryKey] ? a : b
    )[0] as CategoryKey
  }, [])

  // Initialize map layers
  const initializeLayers = useCallback(() => {
    if (layersInitialized.current || !map.isStyleLoaded()) return

    try {
      // Add pins source
      map.addSource(PINS_SOURCE_ID, {
        type: 'geojson',
        data: geoJsonData,
        cluster: showClustering,
        clusterMaxZoom: 14,
        clusterRadius: clusterRadius,
        clusterProperties: {
          // Aggregate categories for cluster styling
          categories: ['concat', ['get', 'categories']],
          dominant_category: ['get', 'categories', 0] // First category as dominant
        }
      })

      // Cluster circles
      map.addLayer({
        id: CLUSTERS_LAYER_ID,
        type: 'circle',
        source: PINS_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'case',
            ['has', 'dominant_category'],
            [
              'match',
              ['get', 'dominant_category'],
              'community', getCategoryColor('community'),
              'faith', getCategoryColor('faith'),
              'projects', getCategoryColor('projects'),
              'economy', getCategoryColor('economy'),
              'events', getCategoryColor('events'),
              'data_ai', getCategoryColor('data_ai'),
              'issues', getCategoryColor('issues'),
              '#6B8E6B' // Default
            ],
            '#6B8E6B' // Fallback
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, // Base size
            10, 25, // 10+ pins
            30, 30, // 30+ pins
            50, 35  // 50+ pins
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        }
      })

      // Cluster count labels
      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: 'symbol',
        source: PINS_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#ffffff'
        }
      })

      // Unclustered pins
      map.addLayer({
        id: UNCLUSTERED_LAYER_ID,
        type: 'circle',
        source: PINS_SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['>', ['length', ['get', 'categories']], 0],
            [
              'match',
              ['get', 'categories', 0], // First category
              'community', getCategoryColor('community'),
              'faith', getCategoryColor('faith'),
              'projects', getCategoryColor('projects'),
              'economy', getCategoryColor('economy'),
              'events', getCategoryColor('events'),
              'data_ai', getCategoryColor('data_ai'),
              'issues', getCategoryColor('issues'),
              '#6B8E6B' // Default
            ],
            '#6B8E6B' // Fallback
          ],
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 12,
            ['boolean', ['feature-state', 'hovered'], false], 10,
            8
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 3,
            ['boolean', ['feature-state', 'hovered'], false], 2,
            1
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#4C764C',
            ['boolean', ['feature-state', 'hovered'], false], '#ffffff',
            '#ffffff'
          ],
          'circle-opacity': [
            'case',
            ['==', ['get', 'status'], 'draft'], 0.5,
            ['==', ['get', 'status'], 'proposed'], 0.7,
            1.0
          ]
        }
      })

      // Pin status badges (for draft/proposed pins)
      map.addLayer({
        id: 'pin-badges',
        type: 'symbol',
        source: PINS_SOURCE_ID,
        filter: [
          'all',
          ['!', ['has', 'point_count']],
          ['in', ['get', 'status'], ['literal', ['draft', 'proposed']]]
        ],
        layout: {
          'text-field': [
            'case',
            ['==', ['get', 'status'], 'draft'], 'D',
            ['==', ['get', 'status'], 'proposed'], 'P',
            ''
          ],
          'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-offset': [0.8, -0.8],
          'text-anchor': 'bottom-left'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': [
            'case',
            ['==', ['get', 'status'], 'draft'], '#f59e0b',
            ['==', ['get', 'status'], 'proposed'], '#3b82f6',
            '#000000'
          ],
          'text-halo-width': 2
        }
      })

      layersInitialized.current = true

    } catch (error) {
      ErrorTracker.logCustomError('Pin layer initialization failed', { error })
    }
  }, [map, geoJsonData, showClustering, clusterRadius, getCategoryColor])

  // Update source data
  const updateSourceData = useCallback(() => {
    if (!layersInitialized.current) return

    try {
      const source = map.getSource(PINS_SOURCE_ID) as mapboxgl.GeoJSONSource
      if (source) {
        source.setData(geoJsonData)
      }
    } catch (error) {
      ErrorTracker.logCustomError('Pin source update failed', { error })
    }
  }, [map, geoJsonData])

  // Update feature states for selection and hover
  const updateFeatureStates = useCallback(() => {
    if (!layersInitialized.current) return

    try {
      // Clear all feature states
      pins.forEach(pin => {
        map.removeFeatureState({
          source: PINS_SOURCE_ID,
          id: pin.id
        })
      })

      // Set selected state
      if (selectedPinId) {
        map.setFeatureState({
          source: PINS_SOURCE_ID,
          id: selectedPinId
        }, { selected: true })
      }

      // Set hovered state
      if (hoveredPinId) {
        map.setFeatureState({
          source: PINS_SOURCE_ID,
          id: hoveredPinId
        }, { hovered: true })
      }

    } catch (error) {
      ErrorTracker.logCustomError('Feature state update failed', { error })
    }
  }, [map, pins, selectedPinId, hoveredPinId])

  // Initialize layers when map style loads
  useEffect(() => {
    if (map.isStyleLoaded()) {
      initializeLayers()
    } else {
      map.on('styledata', initializeLayers)
    }

    return () => {
      map.off('styledata', initializeLayers)
    }
  }, [map, initializeLayers])

  // Update source data when pins change
  useEffect(() => {
    updateSourceData()
  }, [updateSourceData])

  // Update feature states when selection/hover changes
  useEffect(() => {
    updateFeatureStates()
  }, [updateFeatureStates])

  // Add click and hover event handlers
  useEffect(() => {
    if (!layersInitialized.current) return

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [CLUSTERS_LAYER_ID, UNCLUSTERED_LAYER_ID]
      })

      if (features.length > 0) {
        const feature = features[0]

        if (feature.properties?.cluster) {
          // Handle cluster click - zoom in
          const clusterId = feature.properties.cluster_id
          const source = map.getSource(PINS_SOURCE_ID) as mapboxgl.GeoJSONSource
          
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || zoom == null) return

            map.easeTo({
              center: (feature.geometry as any).coordinates,
              zoom: zoom
            })
          })
        } else {
          // Handle pin click
          const pin = pinLookup.current.get(feature.id as string)
          if (pin) {
            onPinClick(pin)
          }
        }
      }
    }

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [UNCLUSTERED_LAYER_ID]
      })

      if (features.length > 0) {
        const feature = features[0]
        const pin = pinLookup.current.get(feature.id as string)
        if (pin) {
          map.getCanvas().style.cursor = 'pointer'
          onPinHover(pin, e.originalEvent)
        }
      } else {
        map.getCanvas().style.cursor = ''
        onPinHover(null)
      }
    }

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ''
      onPinHover(null)
    }

    // Add event listeners
    map.on('click', handleClick)
    map.on('mousemove', handleMouseMove)
    map.on('mouseleave', handleMouseLeave)

    return () => {
      map.off('click', handleClick)
      map.off('mousemove', handleMouseMove)
      map.off('mouseleave', handleMouseLeave)
    }
  }, [map, onPinClick, onPinHover])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (layersInitialized.current) {
        try {
          // Remove layers
          const layersToRemove = [
            'pin-badges',
            UNCLUSTERED_LAYER_ID,
            CLUSTER_COUNT_LAYER_ID,
            CLUSTERS_LAYER_ID
          ]

          layersToRemove.forEach(layerId => {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId)
            }
          })

          // Remove source
          if (map.getSource(PINS_SOURCE_ID)) {
            map.removeSource(PINS_SOURCE_ID)
          }

          layersInitialized.current = false
        } catch (error) {
          ErrorTracker.logCustomError('Pin layer cleanup failed', { error })
        }
      }
    }
  }, [map])

  return null // This component doesn't render anything directly
}
