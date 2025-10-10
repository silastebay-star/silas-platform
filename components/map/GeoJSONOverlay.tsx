'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { geoJSONService, type MapOverlayConfig, type CensusData, type CommunityBoundary } from '@/lib/services/geojson-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Layers, BarChart3, Users, Home, Car, GraduationCap, MapPin } from 'lucide-react'

interface GeoJSONOverlayProps {
  map: mapboxgl.Map
  visible: boolean
  onToggle: () => void
}

interface LayerState {
  id: string
  visible: boolean
  opacity: number
  colorScheme: string
}

const COLOR_SCHEMES = {
  viridis: ['#440154', '#31688e', '#35b779', '#fde725'],
  plasma: ['#0d0887', '#7e03a8', '#cc4778', '#f89441', '#f0f921'],
  blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'],
  reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d'],
  greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45']
}

const DEMOGRAPHIC_METRICS = [
  { key: 'population', label: 'Population', icon: Users },
  { key: 'median_age', label: 'Median Age', icon: Users },
  { key: 'median_income', label: 'Median Income', icon: BarChart3 },
  { key: 'unemployment_rate', label: 'Unemployment Rate', icon: BarChart3 },
  { key: 'owned_outright', label: 'Home Ownership', icon: Home },
  { key: 'car_driver', label: 'Car Usage', icon: Car },
  { key: 'level_4_qualifications_and_above', label: 'Higher Education', icon: GraduationCap }
]

export default function GeoJSONOverlay({ map, visible, onToggle }: GeoJSONOverlayProps) {
  const [config, setConfig] = useState<MapOverlayConfig>({
    census_data: false,
    community_boundaries: true,
    transport_networks: false,
    environmental_zones: false,
    infrastructure: false,
    demographic_heatmaps: false
  })

  const [layers, setLayers] = useState<LayerState[]>([])
  const [selectedMetric, setSelectedMetric] = useState('population')
  const [censusData, setCensusData] = useState<CensusData[]>([])
  const [boundaries, setBoundaries] = useState<CommunityBoundary[]>([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<any>(null)

  const layersInitialized = useRef(false)

  // Load initial data
  useEffect(() => {
    if (!visible || !map) return

    loadGeoJSONData()
  }, [visible, map])

  // Initialize layers when data is loaded
  useEffect(() => {
    if (!map || !visible || layersInitialized.current) return

    initializeLayers()
    layersInitialized.current = true

    return () => {
      cleanupLayers()
      layersInitialized.current = false
    }
  }, [map, visible, censusData, boundaries])

  // Update layer visibility and styling
  useEffect(() => {
    if (!map || !layersInitialized.current) return

    updateLayerVisibility()
  }, [config, layers])

  const loadGeoJSONData = async () => {
    setLoading(true)
    try {
      const [censusResult, boundariesResult, statsResult] = await Promise.all([
        geoJSONService.getCensusData(),
        geoJSONService.getCommunityBoundaries(),
        geoJSONService.getCommunityStatistics()
      ])

      setCensusData(censusResult)
      setBoundaries(boundariesResult)
      setStatistics(statsResult)
    } catch (error) {
      console.error('Error loading GeoJSON data:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeLayers = () => {
    if (!map) return

    // Add census data source and layer
    if (censusData.length > 0) {
      const censusGeoJSON = {
        type: 'FeatureCollection' as const,
        features: censusData.map(area => ({
          type: 'Feature' as const,
          id: area.id,
          geometry: area.geom,
          properties: {
            ...area,
            value: area.population // Default metric
          }
        }))
      }

      if (!map.getSource('census-data')) {
        map.addSource('census-data', {
          type: 'geojson',
          data: censusGeoJSON
        })
      }

      if (!map.getLayer('census-fill')) {
        map.addLayer({
          id: 'census-fill',
          type: 'fill',
          source: 'census-data',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'value'],
              0, COLOR_SCHEMES.viridis[0],
              1000, COLOR_SCHEMES.viridis[1],
              5000, COLOR_SCHEMES.viridis[2],
              10000, COLOR_SCHEMES.viridis[3]
            ],
            'fill-opacity': 0.6
          },
          layout: {
            visibility: config.census_data ? 'visible' : 'none'
          }
        })
      }

      if (!map.getLayer('census-outline')) {
        map.addLayer({
          id: 'census-outline',
          type: 'line',
          source: 'census-data',
          paint: {
            'line-color': '#ffffff',
            'line-width': 1,
            'line-opacity': 0.8
          },
          layout: {
            visibility: config.census_data ? 'visible' : 'none'
          }
        })
      }
    }

    // Add community boundaries
    if (boundaries.length > 0) {
      const boundariesGeoJSON = {
        type: 'FeatureCollection' as const,
        features: boundaries.map(boundary => ({
          type: 'Feature' as const,
          id: boundary.id,
          geometry: boundary.geom,
          properties: boundary
        }))
      }

      if (!map.getSource('community-boundaries')) {
        map.addSource('community-boundaries', {
          type: 'geojson',
          data: boundariesGeoJSON
        })
      }

      if (!map.getLayer('boundaries-fill')) {
        map.addLayer({
          id: 'boundaries-fill',
          type: 'fill',
          source: 'community-boundaries',
          paint: {
            'fill-color': '#10B981',
            'fill-opacity': 0.1
          },
          layout: {
            visibility: config.community_boundaries ? 'visible' : 'none'
          }
        })
      }

      if (!map.getLayer('boundaries-outline')) {
        map.addLayer({
          id: 'boundaries-outline',
          type: 'line',
          source: 'community-boundaries',
          paint: {
            'line-color': '#10B981',
            'line-width': 2,
            'line-opacity': 0.8
          },
          layout: {
            visibility: config.community_boundaries ? 'visible' : 'none'
          }
        })
      }
    }

    // Add click handlers for census areas
    map.on('click', 'census-fill', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0]
        const properties = feature.properties

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-semibold text-lg mb-2">${properties?.name || 'Census Area'}</h3>
              <div class="space-y-1 text-sm">
                <div><strong>Population:</strong> ${properties?.population?.toLocaleString() || 'N/A'}</div>
                <div><strong>Households:</strong> ${properties?.households?.toLocaleString() || 'N/A'}</div>
                <div><strong>Median Age:</strong> ${properties?.median_age || 'N/A'}</div>
                <div><strong>Median Income:</strong> £${properties?.median_income?.toLocaleString() || 'N/A'}</div>
                <div><strong>Unemployment:</strong> ${properties?.unemployment_rate || 'N/A'}%</div>
              </div>
            </div>
          `)
          .addTo(map)
      }
    })

    // Change cursor on hover
    map.on('mouseenter', 'census-fill', () => {
      map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'census-fill', () => {
      map.getCanvas().style.cursor = ''
    })
  }

  const cleanupLayers = () => {
    if (!map) return

    const layerIds = ['census-fill', 'census-outline', 'boundaries-fill', 'boundaries-outline']
    const sourceIds = ['census-data', 'community-boundaries']

    layerIds.forEach(id => {
      if (map.getLayer(id)) {
        map.removeLayer(id)
      }
    })

    sourceIds.forEach(id => {
      if (map.getSource(id)) {
        map.removeSource(id)
      }
    })
  }

  const updateLayerVisibility = () => {
    if (!map) return

    // Update census data visibility
    const censusVisibility = config.census_data ? 'visible' : 'none'
    if (map.getLayer('census-fill')) {
      map.setLayoutProperty('census-fill', 'visibility', censusVisibility)
    }
    if (map.getLayer('census-outline')) {
      map.setLayoutProperty('census-outline', 'visibility', censusVisibility)
    }

    // Update boundaries visibility
    const boundariesVisibility = config.community_boundaries ? 'visible' : 'none'
    if (map.getLayer('boundaries-fill')) {
      map.setLayoutProperty('boundaries-fill', 'visibility', boundariesVisibility)
    }
    if (map.getLayer('boundaries-outline')) {
      map.setLayoutProperty('boundaries-outline', 'visibility', boundariesVisibility)
    }
  }

  const updateDemographicHeatmap = async (metric: string) => {
    if (!map || !map.getSource('census-data')) return

    setSelectedMetric(metric)

    try {
      const heatmapData = await geoJSONService.createDemographicHeatmap(metric as any)
      
      if (map.getSource('census-data')) {
        (map.getSource('census-data') as mapboxgl.GeoJSONSource).setData(heatmapData)
      }
    } catch (error) {
      console.error('Error updating demographic heatmap:', error)
    }
  }

  const toggleOverlay = (key: keyof MapOverlayConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (!visible) return null

  return (
    <Card className="absolute top-4 right-4 w-80 max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Geographic Overlays
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overlay Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Census Data</label>
            <Switch
              checked={config.census_data}
              onCheckedChange={() => toggleOverlay('census_data')}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Community Boundaries</label>
            <Switch
              checked={config.community_boundaries}
              onCheckedChange={() => toggleOverlay('community_boundaries')}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Demographic Heatmaps</label>
            <Switch
              checked={config.demographic_heatmaps}
              onCheckedChange={() => toggleOverlay('demographic_heatmaps')}
            />
          </div>
        </div>

        {/* Demographic Metric Selector */}
        {config.census_data && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Demographic Metric</label>
            <Select value={selectedMetric} onValueChange={updateDemographicHeatmap}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEMOGRAPHIC_METRICS.map(metric => (
                  <SelectItem key={metric.key} value={metric.key}>
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-4 w-4" />
                      {metric.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Community Statistics */}
        {statistics && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Community Overview</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium">Population</div>
                <div>{statistics.total_population.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium">Households</div>
                <div>{statistics.total_households.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium">Avg Age</div>
                <div>{statistics.average_age} years</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium">Avg Income</div>
                <div>£{statistics.average_income.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        {config.census_data && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Legend</h4>
            <div className="flex items-center gap-1">
              {COLOR_SCHEMES.viridis.map((color, index) => (
                <div
                  key={index}
                  className="h-4 flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading geographic data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
