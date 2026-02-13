/**
 * @jest-environment jsdom
 */

import { geoJSONService } from '../geojson-service'
import { supabase } from '@/lib/supabase/client'

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('GeoJSONService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCensusData', () => {
    it('should fetch census data without bounds', async () => {
      const mockData = [
        {
          id: 'census-1',
          name: 'Test Area',
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
            car_driver: 50,
            public_transport: 15,
            bicycle: 5,
            on_foot: 10
          },
          geom: {
            type: 'Polygon',
            coordinates: [[[-2.4, 53.5], [-2.3, 53.5], [-2.3, 53.6], [-2.4, 53.6], [-2.4, 53.5]]]
          }
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockData, error: null })
      } as any)

      const result = await geoJSONService.getCensusData()

      expect(mockSupabase.from).toHaveBeenCalledWith('census_data')
      expect(result).toEqual(mockData)
    })

    it('should fetch census data with bounds', async () => {
      const bounds = { north: 53.6, south: 53.5, east: -2.3, west: -2.4 }
      const mockData = []

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        filter: jest.fn().mockResolvedValue({ data: mockData, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await geoJSONService.getCensusData(bounds)

      expect(mockSupabase.from).toHaveBeenCalledWith('census_data')
      expect(mockQuery.filter).toHaveBeenCalledWith('geom', 'intersects', expect.stringContaining('POLYGON'))
      expect(result).toEqual(mockData)
    })

    it('should handle errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      } as any)

      const result = await geoJSONService.getCensusData()

      expect(result).toEqual([])
    })
  })

  describe('getCommunityBoundaries', () => {
    it('should fetch all boundaries when no type specified', async () => {
      const mockData = [
        {
          id: 'boundary-1',
          name: 'Test Parish',
          type: 'parish',
          description: 'Test parish boundary',
          population: 5000,
          area_hectares: 500,
          geom: {
            type: 'Polygon',
            coordinates: [[[-2.5, 53.4], [-2.2, 53.4], [-2.2, 53.7], [-2.5, 53.7], [-2.5, 53.4]]]
          },
          metadata: {}
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockData, error: null })
      } as any)

      const result = await geoJSONService.getCommunityBoundaries()

      expect(mockSupabase.from).toHaveBeenCalledWith('community_boundaries')
      expect(result).toEqual(mockData)
    })

    it('should filter by type when specified', async () => {
      const mockData = []
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await geoJSONService.getCommunityBoundaries('ward')

      expect(mockSupabase.from).toHaveBeenCalledWith('community_boundaries')
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'ward')
      expect(result).toEqual(mockData)
    })
  })

  describe('getGeographicLayers', () => {
    it('should fetch visible layers', async () => {
      const mockData = [
        {
          id: 'layer-1',
          name: 'Transport Network',
          description: 'Bus routes and transport',
          type: 'transport',
          visible: true,
          opacity: 0.8,
          color_scheme: 'blues',
          geom: {
            type: 'FeatureCollection',
            features: []
          },
          metadata: {}
        }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockData, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await geoJSONService.getGeographicLayers(['transport'])

      expect(mockSupabase.from).toHaveBeenCalledWith('geographic_layers')
      expect(mockQuery.eq).toHaveBeenCalledWith('visible', true)
      expect(mockQuery.in).toHaveBeenCalledWith('type', ['transport'])
      expect(result).toEqual(mockData)
    })
  })

  describe('createDemographicHeatmap', () => {
    it('should create heatmap from census data', async () => {
      const mockCensusData = [
        {
          id: 'area-1',
          name: 'Area 1',
          population: 1000,
          median_age: 35,
          median_income: 25000,
          unemployment_rate: 4.2,
          education_level: {
            level_4_qualifications_and_above: 25
          },
          housing: {
            owned_outright: 30
          },
          transport: {
            car_driver: 50
          },
          geom: {
            type: 'Polygon',
            coordinates: [[[-2.4, 53.5], [-2.3, 53.5], [-2.3, 53.6], [-2.4, 53.6], [-2.4, 53.5]]]
          }
        }
      ]

      // Mock getCensusData method
      jest.spyOn(geoJSONService, 'getCensusData').mockResolvedValue(mockCensusData)

      const result = await geoJSONService.createDemographicHeatmap('population')

      expect(result.type).toBe('FeatureCollection')
      expect(result.features).toHaveLength(1)
      expect(result.features[0].properties.value).toBe(1000)
      expect(result.features[0].properties.metric).toBe('population')
    })

    it('should handle nested metric values', async () => {
      const mockCensusData = [
        {
          id: 'area-1',
          name: 'Area 1',
          population: 1000,
          education_level: {
            level_4_qualifications_and_above: 25
          },
          housing: {
            owned_outright: 30
          },
          transport: {
            car_driver: 50
          },
          geom: {
            type: 'Polygon',
            coordinates: [[[-2.4, 53.5], [-2.3, 53.5], [-2.3, 53.6], [-2.4, 53.6], [-2.4, 53.5]]]
          }
        }
      ]

      jest.spyOn(geoJSONService, 'getCensusData').mockResolvedValue(mockCensusData)

      const result = await geoJSONService.createDemographicHeatmap('level_4_qualifications_and_above')

      expect(result.features[0].properties.value).toBe(25)
    })
  })

  describe('getCommunityStatistics', () => {
    it('should calculate community statistics from census data', async () => {
      const mockCensusData = [
        {
          id: 'area-1',
          name: 'Area 1',
          population: 1000,
          households: 400,
          median_age: 35,
          median_income: 25000,
          unemployment_rate: 4.0,
          education_level: {
            no_qualifications: 10,
            level_1_qualifications: 15,
            level_2_qualifications: 20,
            apprenticeship: 10,
            level_3_qualifications: 20,
            level_4_qualifications_and_above: 25
          },
          housing: {
            owned_outright: 30,
            owned_with_mortgage: 40,
            private_rented: 20,
            social_rented: 10
          },
          transport: {
            car_driver: 40,
            car_passenger: 10,
            bus: 15,
            train: 5,
            bicycle: 10,
            on_foot: 15,
            work_from_home: 5
          }
        },
        {
          id: 'area-2',
          name: 'Area 2',
          population: 500,
          households: 200,
          median_age: 40,
          median_income: 30000,
          unemployment_rate: 3.0,
          education_level: {
            no_qualifications: 5,
            level_1_qualifications: 10,
            level_2_qualifications: 25,
            apprenticeship: 15,
            level_3_qualifications: 25,
            level_4_qualifications_and_above: 20
          },
          housing: {
            owned_outright: 40,
            owned_with_mortgage: 35,
            private_rented: 15,
            social_rented: 10
          },
          transport: {
            car_driver: 45,
            car_passenger: 5,
            bus: 10,
            train: 10,
            bicycle: 15,
            on_foot: 10,
            work_from_home: 5
          }
        }
      ]

      jest.spyOn(geoJSONService, 'getCensusData').mockResolvedValue(mockCensusData)

      const result = await geoJSONService.getCommunityStatistics()

      expect(result.total_population).toBe(1500)
      expect(result.total_households).toBe(600)
      expect(result.average_age).toBeCloseTo(36.7, 1)
      expect(result.average_income).toBe(26667)
      expect(result.unemployment_rate).toBeCloseTo(3.7, 1)
      expect(result.housing_ownership.owned).toBeCloseTo(70, 1)
      expect(result.education_levels.advanced).toBeCloseTo(23.3, 1)
      expect(result.transport_modes.car).toBeCloseTo(66.7, 1)
    })

    it('should return default statistics when no data available', async () => {
      jest.spyOn(geoJSONService, 'getCensusData').mockResolvedValue([])

      const result = await geoJSONService.getCommunityStatistics()

      expect(result.total_population).toBe(0)
      expect(result.total_households).toBe(0)
      expect(result.average_age).toBe(0)
      expect(result.average_income).toBe(0)
      expect(result.unemployment_rate).toBe(0)
    })
  })

  describe('getPointsOfInterest', () => {
    it('should fetch all POIs when no category specified', async () => {
      const mockData = [
        {
          id: 'poi-1',
          name: 'Community Center',
          category: 'community',
          description: 'Local community center',
          geom: {
            type: 'Point',
            coordinates: [-2.38, 53.55]
          },
          metadata: {}
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockData, error: null })
      } as any)

      const result = await geoJSONService.getPointsOfInterest()

      expect(mockSupabase.from).toHaveBeenCalledWith('points_of_interest')
      expect(result.type).toBe('FeatureCollection')
      expect(result.features).toHaveLength(1)
      expect(result.features[0].properties.name).toBe('Community Center')
    })

    it('should filter by category when specified', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await geoJSONService.getPointsOfInterest('education')

      expect(mockSupabase.from).toHaveBeenCalledWith('points_of_interest')
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'education')
      expect(result.type).toBe('FeatureCollection')
    })
  })
})