/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useGeoJSONData } from '../useGeoJSONData'
import { geoJSONService } from '@/lib/services/geojson-service'

// Mock the GeoJSON service
jest.mock('@/lib/services/geojson-service', () => ({
  geoJSONService: {
    getCensusData: jest.fn(),
    getCommunityBoundaries: jest.fn(),
    getGeographicLayers: jest.fn(),
    getCommunityStatistics: jest.fn(),
    createDemographicHeatmap: jest.fn(),
    getPointsOfInterest: jest.fn(),
  },
}))

const mockGeoJSONService = geoJSONService as jest.Mocked<typeof geoJSONService>

describe('useGeoJSONData', () => {
  const mockCensusData = [
    {
      id: 'census-1',
      name: 'Test Area',
      code: 'E00000001',
      population: 1000,
      households: 400,
      median_age: 35.5,
      median_income: 25000,
      unemployment_rate: 4.2,
      education_level: {
        no_qualifications: 10,
        level_1_qualifications: 15,
        level_2_qualifications: 20,
        apprenticeship: 10,
        level_3_qualifications: 20,
        level_4_qualifications_and_above: 25,
        other_qualifications: 0
      },
      housing: {
        owned_outright: 30,
        owned_with_mortgage: 40,
        shared_ownership: 2,
        social_rented: 15,
        private_rented: 12,
        rent_free: 1
      },
      transport: {
        work_from_home: 20,
        underground_metro: 0,
        train: 10,
        bus: 15,
        taxi: 1,
        motorcycle: 2,
        car_driver: 40,
        car_passenger: 5,
        bicycle: 5,
        on_foot: 2,
        other: 0
      },
      geom: {
        type: 'Polygon' as const,
        coordinates: [[[-2.4, 53.5], [-2.3, 53.5], [-2.3, 53.6], [-2.4, 53.6], [-2.4, 53.5]]]
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  const mockBoundaries = [
    {
      id: 'boundary-1',
      name: 'Test Parish',
      type: 'parish' as const,
      description: 'Test parish boundary',
      population: 5000,
      area_hectares: 500,
      geom: {
        type: 'Polygon' as const,
        coordinates: [[[-2.5, 53.4], [-2.2, 53.4], [-2.2, 53.7], [-2.5, 53.7], [-2.5, 53.4]]]
      },
      metadata: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  const mockLayers = [
    {
      id: 'layer-1',
      name: 'Transport Network',
      description: 'Bus routes and transport',
      type: 'transport' as const,
      source_url: 'https://example.com',
      data_source: 'Test Source',
      last_updated: '2024-01-01T00:00:00Z',
      visible: true,
      opacity: 0.8,
      color_scheme: 'blues',
      geom: {
        type: 'FeatureCollection',
        features: []
      },
      metadata: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  const mockStatistics = {
    total_population: 1000,
    total_households: 400,
    average_age: 35.5,
    average_income: 25000,
    unemployment_rate: 4.2,
    housing_ownership: { owned: 70, rented: 12, social: 15 },
    education_levels: { no_qualifications: 10, basic: 35, intermediate: 30, advanced: 25 },
    transport_modes: { car: 45, public_transport: 25, active_travel: 7, work_from_home: 20 }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGeoJSONService.getCensusData.mockResolvedValue(mockCensusData)
    mockGeoJSONService.getCommunityBoundaries.mockResolvedValue(mockBoundaries)
    mockGeoJSONService.getGeographicLayers.mockResolvedValue(mockLayers)
    mockGeoJSONService.getCommunityStatistics.mockResolvedValue(mockStatistics)
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: false }))

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.censusData).toEqual([])
    expect(result.current.boundaries).toEqual([])
    expect(result.current.layers).toEqual([])
    expect(result.current.statistics).toBe(null)
    expect(result.current.overlayConfig.community_boundaries).toBe(true)
    expect(result.current.overlayConfig.census_data).toBe(false)
  })

  it('should auto-load data when autoLoad is true', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: true }))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockGeoJSONService.getCensusData).toHaveBeenCalled()
    expect(mockGeoJSONService.getCommunityBoundaries).toHaveBeenCalled()
    expect(mockGeoJSONService.getGeographicLayers).toHaveBeenCalled()
    expect(mockGeoJSONService.getCommunityStatistics).toHaveBeenCalled()

    expect(result.current.censusData).toEqual(mockCensusData)
    expect(result.current.boundaries).toEqual(mockBoundaries)
    expect(result.current.layers).toEqual(mockLayers)
    expect(result.current.statistics).toEqual(expect.objectContaining(mockStatistics))
  })

  it('should handle loading errors gracefully', async () => {
    const errorMessage = 'Failed to load data'
    mockGeoJSONService.getCensusData.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useGeoJSONData({ autoLoad: true }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
  })

  it('should manually load data', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: false }))

    await act(async () => {
      await result.current.loadData()
    })

    expect(mockGeoJSONService.getCensusData).toHaveBeenCalled()
    expect(result.current.censusData).toEqual(mockCensusData)
  })

  it('should load census data with custom bounds', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: false }))

    const customBounds = { north: 53.6, south: 53.5, east: -2.3, west: -2.4 }

    await act(async () => {
      await result.current.loadCensusData(customBounds)
    })

    expect(mockGeoJSONService.getCensusData).toHaveBeenCalledWith(customBounds)
  })

  it('should load boundaries by type', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: false }))

    await act(async () => {
      await result.current.loadBoundaries('ward')
    })

    expect(mockGeoJSONService.getCommunityBoundaries).toHaveBeenCalledWith('ward')
  })

  it('should create demographic heatmap', async () => {
    const mockHeatmapData = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          id: 'area-1',
          geometry: mockCensusData[0].geom,
          properties: {
            id: 'area-1',
            name: 'Test Area',
            value: 1000,
            population: 1000,
            metric: 'population'
          }
        }
      ]
    }

    mockGeoJSONService.createDemographicHeatmap.mockResolvedValue(mockHeatmapData)

    const { result } = renderHook(() => useGeoJSONData({ autoLoad: false }))

    let heatmapResult
    await act(async () => {
      heatmapResult = await result.current.createDemographicHeatmap('population')
    })

    expect(mockGeoJSONService.createDemographicHeatmap).toHaveBeenCalledWith('population')
    expect(heatmapResult).toEqual(mockHeatmapData)
  })

  it('should get points of interest', async () => {
    const mockPOIData = {
      type: 'FeatureCollection' as const,
      features: []
    }

    mockGeoJSONService.getPointsOfInterest.mockResolvedValue(mockPOIData)

    const { result } = renderHook(() => useGeoJSONData({ autoLoad: false }))

    let poiResult
    await act(async () => {
      poiResult = await result.current.getPointsOfInterest('education')
    })

    expect(mockGeoJSONService.getPointsOfInterest).toHaveBeenCalledWith('education')
    expect(poiResult).toEqual(mockPOIData)
  })

  it('should update overlay configuration', () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: false }))

    act(() => {
      result.current.updateOverlayConfig({ census_data: true, transport_networks: true })
    })

    expect(result.current.overlayConfig.census_data).toBe(true)
    expect(result.current.overlayConfig.transport_networks).toBe(true)
    expect(result.current.overlayConfig.community_boundaries).toBe(true) // Should remain unchanged
  })

  it('should toggle overlay', () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: false }))

    expect(result.current.overlayConfig.census_data).toBe(false)

    act(() => {
      result.current.toggleOverlay('census_data')
    })

    expect(result.current.overlayConfig.census_data).toBe(true)

    act(() => {
      result.current.toggleOverlay('census_data')
    })

    expect(result.current.overlayConfig.census_data).toBe(false)
  })

  it('should generate correct GeoJSON data', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: true }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJSONData.census.type).toBe('FeatureCollection')
    expect(result.current.geoJSONData.census.features).toHaveLength(1)
    expect(result.current.geoJSONData.census.features[0].properties.population).toBe(1000)

    expect(result.current.geoJSONData.boundaries.type).toBe('FeatureCollection')
    expect(result.current.geoJSONData.boundaries.features).toHaveLength(1)
    expect(result.current.geoJSONData.boundaries.features[0].properties.name).toBe('Test Parish')

    expect(result.current.geoJSONData.layers).toHaveLength(1)
    expect(result.current.geoJSONData.layers[0].name).toBe('Transport Network')
  })

  it('should provide enhanced statistics', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: true }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.statistics).toEqual(expect.objectContaining({
      ...mockStatistics,
      home_ownership_rate: 70,
      rental_rate: 12,
      higher_education_rate: 25,
      car_dependency: 45,
      active_travel_rate: 7,
      remote_work_rate: 20
    }))
  })

  it('should indicate data availability', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: true }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hasData.census).toBe(true)
    expect(result.current.hasData.boundaries).toBe(true)
    expect(result.current.hasData.layers).toBe(true)
    expect(result.current.hasData.statistics).toBe(true)
  })

  it('should get demographic data for specific area', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: true }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const demographicData = result.current.getDemographicData('census-1')

    expect(demographicData).toEqual({
      population: 1000,
      demographics: {
        median_age: 35.5,
        median_income: 25000,
        unemployment_rate: 4.2
      },
      education: mockCensusData[0].education_level,
      housing: mockCensusData[0].housing,
      transport: mockCensusData[0].transport
    })
  })

  it('should return null for non-existent area', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: true }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const demographicData = result.current.getDemographicData('non-existent')

    expect(demographicData).toBe(null)
  })

  it('should calculate area statistics for multiple areas', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: true }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const areaStats = result.current.getAreaStatistics(['census-1'])

    expect(areaStats).toEqual({
      total_population: 1000,
      total_households: 400,
      average_age: 35.5,
      average_income: 25000,
      unemployment_rate: 4.2
    })
  })

  it('should return null for empty area list', async () => {
    const { result } = renderHook(() => useGeoJSONData({ autoLoad: true }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const areaStats = result.current.getAreaStatistics([])

    expect(areaStats).toBe(null)
  })
})
