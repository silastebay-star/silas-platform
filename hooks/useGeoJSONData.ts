/**
 * Hook for managing GeoJSON data and geographic overlays
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { geoJSONService, type CensusData, type CommunityBoundary, type GeographicLayer, type MapOverlayConfig } from '@/lib/services/geojson-service'

interface UseGeoJSONDataOptions {
  autoLoad?: boolean
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

interface GeoJSONDataState {
  censusData: CensusData[]
  boundaries: CommunityBoundary[]
  layers: GeographicLayer[]
  statistics: any
  loading: boolean
  error: string | null
}

export function useGeoJSONData(options: UseGeoJSONDataOptions = {}) {
  const { autoLoad = true, bounds } = options

  const [state, setState] = useState<GeoJSONDataState>({
    censusData: [],
    boundaries: [],
    layers: [],
    statistics: null,
    loading: false,
    error: null
  })

  const [overlayConfig, setOverlayConfig] = useState<MapOverlayConfig>({
    census_data: false,
    community_boundaries: true,
    transport_networks: false,
    environmental_zones: false,
    infrastructure: false,
    demographic_heatmaps: false
  })

  // Load all GeoJSON data
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const [censusData, boundaries, layers, statistics] = await Promise.all([
        geoJSONService.getCensusData(bounds),
        geoJSONService.getCommunityBoundaries(),
        geoJSONService.getGeographicLayers(),
        geoJSONService.getCommunityStatistics()
      ])

      setState(prev => ({
        ...prev,
        censusData,
        boundaries,
        layers,
        statistics,
        loading: false
      }))
    } catch (error) {
      console.error('Error loading GeoJSON data:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load geographic data'
      }))
    }
  }, [bounds])

  // Load census data only
  const loadCensusData = useCallback(async (customBounds?: typeof bounds) => {
    try {
      const censusData = await geoJSONService.getCensusData(customBounds || bounds)
      setState(prev => ({ ...prev, censusData }))
      return censusData
    } catch (error) {
      console.error('Error loading census data:', error)
      return []
    }
  }, [bounds])

  // Load community boundaries
  const loadBoundaries = useCallback(async (type?: string) => {
    try {
      const boundaries = await geoJSONService.getCommunityBoundaries(type)
      setState(prev => ({ ...prev, boundaries }))
      return boundaries
    } catch (error) {
      console.error('Error loading boundaries:', error)
      return []
    }
  }, [])

  // Create demographic heatmap
  const createDemographicHeatmap = useCallback(async (metric: string) => {
    try {
      return await geoJSONService.createDemographicHeatmap(metric as any)
    } catch (error) {
      console.error('Error creating demographic heatmap:', error)
      return { type: 'FeatureCollection' as const, features: [] }
    }
  }, [])

  // Get points of interest
  const getPointsOfInterest = useCallback(async (category?: string) => {
    try {
      return await geoJSONService.getPointsOfInterest(category)
    } catch (error) {
      console.error('Error loading points of interest:', error)
      return { type: 'FeatureCollection' as const, features: [] }
    }
  }, [])

  // Update overlay configuration
  const updateOverlayConfig = useCallback((updates: Partial<MapOverlayConfig>) => {
    setOverlayConfig(prev => ({ ...prev, ...updates }))
  }, [])

  // Toggle specific overlay
  const toggleOverlay = useCallback((key: keyof MapOverlayConfig) => {
    setOverlayConfig(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadData()
    }
  }, [autoLoad, loadData])

  // Memoized GeoJSON feature collections
  const geoJSONData = useMemo(() => {
    return {
      census: {
        type: 'FeatureCollection' as const,
        features: state.censusData.map(area => ({
          type: 'Feature' as const,
          id: area.id,
          geometry: area.geom,
          properties: {
            ...area,
            // Flatten nested objects for easier access in map expressions
            population: area.population,
            households: area.households,
            median_age: area.median_age,
            median_income: area.median_income,
            unemployment_rate: area.unemployment_rate,
            ...area.education_level,
            ...area.housing,
            ...area.transport
          }
        }))
      },
      boundaries: {
        type: 'FeatureCollection' as const,
        features: state.boundaries.map(boundary => ({
          type: 'Feature' as const,
          id: boundary.id,
          geometry: boundary.geom,
          properties: boundary
        }))
      },
      layers: state.layers.map(layer => ({
        ...layer,
        geom: typeof layer.geom === 'string' ? JSON.parse(layer.geom) : layer.geom
      }))
    }
  }, [state.censusData, state.boundaries, state.layers])

  // Statistics with computed values
  const enhancedStatistics = useMemo(() => {
    if (!state.statistics) return null

    return {
      ...state.statistics,
      // Add computed percentages and ratios
      home_ownership_rate: state.statistics.housing_ownership?.owned || 0,
      rental_rate: state.statistics.housing_ownership?.rented || 0,
      higher_education_rate: state.statistics.education_levels?.advanced || 0,
      car_dependency: state.statistics.transport_modes?.car || 0,
      active_travel_rate: state.statistics.transport_modes?.active_travel || 0,
      remote_work_rate: state.statistics.transport_modes?.work_from_home || 0
    }
  }, [state.statistics])

  // Check if data is available
  const hasData = useMemo(() => ({
    census: state.censusData.length > 0,
    boundaries: state.boundaries.length > 0,
    layers: state.layers.length > 0,
    statistics: state.statistics !== null
  }), [state])

  // Get census area by coordinates
  const getCensusAreaByCoordinates = useCallback((lng: number, lat: number) => {
    return state.censusData.find(area => {
      // Simple point-in-polygon check (for more accuracy, use a proper library)
      // This is a simplified version - in production, use turf.js or similar
      return true // Placeholder - implement proper point-in-polygon
    })
  }, [state.censusData])

  // Get demographic data for a specific area
  const getDemographicData = useCallback((areaId: string) => {
    const area = state.censusData.find(a => a.id === areaId)
    if (!area) return null

    return {
      population: area.population,
      demographics: {
        median_age: area.median_age,
        median_income: area.median_income,
        unemployment_rate: area.unemployment_rate
      },
      education: area.education_level,
      housing: area.housing,
      transport: area.transport
    }
  }, [state.censusData])

  // Calculate area statistics
  const getAreaStatistics = useCallback((areaIds: string[]) => {
    const areas = state.censusData.filter(area => areaIds.includes(area.id))
    if (areas.length === 0) return null

    const totalPopulation = areas.reduce((sum, area) => sum + area.population, 0)
    const totalHouseholds = areas.reduce((sum, area) => sum + area.households, 0)

    return {
      total_population: totalPopulation,
      total_households: totalHouseholds,
      average_age: areas.reduce((sum, area) => sum + (area.median_age * area.population), 0) / totalPopulation,
      average_income: areas.reduce((sum, area) => sum + (area.median_income * area.households), 0) / totalHouseholds,
      unemployment_rate: areas.reduce((sum, area) => sum + (area.unemployment_rate * area.population), 0) / totalPopulation
    }
  }, [state.censusData])

  return {
    // Data
    ...state,
    geoJSONData,
    statistics: enhancedStatistics,
    hasData,
    overlayConfig,

    // Actions
    loadData,
    loadCensusData,
    loadBoundaries,
    createDemographicHeatmap,
    getPointsOfInterest,
    updateOverlayConfig,
    toggleOverlay,

    // Utilities
    getCensusAreaByCoordinates,
    getDemographicData,
    getAreaStatistics
  }
}

export default useGeoJSONData
