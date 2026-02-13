/**
 * @jest-environment jsdom
 */

import { geoJSONService } from '@/lib/services/geojson-service'
import { supabase } from '@/lib/supabase/client'

// Mock Supabase for integration tests
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('GeoJSON Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Census Data Integration', () => {
    it('should integrate census data with community statistics', async () => {
      const mockCensusData = [
        {
          id: 'area-1',
          name: 'Stoneclough Central',
          population: 2000,
          households: 800,
          median_age: 40,
          median_income: 30000,
          unemployment_rate: 3.5,
          education_level: {
            no_qualifications: 15,
            level_1_qualifications: 10,
            level_2_qualifications: 20,
            apprenticeship: 10,
            level_3_qualifications: 20,
            level_4_qualifications_and_above: 25,
            other_qualifications: 0
          },
          housing: {
            owned_outright: 35,
            owned_with_mortgage: 40,
            shared_ownership: 2,
            social_rented: 10,
            private_rented: 12,
            rent_free: 1
          },
          transport: {
            work_from_home: 25,
            car_driver: 45,
            car_passenger: 5,
            bus: 10,
            train: 8,
            bicycle: 4,
            on_foot: 3,
            other: 0
          },
          geom: {
            type: 'Polygon',
            coordinates: [[[-2.385, 53.548], [-2.375, 53.548], [-2.375, 53.555], [-2.385, 53.555], [-2.385, 53.548]]]
          }
        },
        {
          id: 'area-2',
          name: 'Stoneclough North',
          population: 1500,
          households: 600,
          median_age: 35,
          median_income: 28000,
          unemployment_rate: 4.0,
          education_level: {
            no_qualifications: 12,
            level_1_qualifications: 12,
            level_2_qualifications: 18,
            apprenticeship: 12,
            level_3_qualifications: 22,
            level_4_qualifications_and_above: 24,
            other_qualifications: 0
          },
          housing: {
            owned_outright: 30,
            owned_with_mortgage: 42,
            shared_ownership: 3,
            social_rented: 12,
            private_rented: 12,
            rent_free: 1
          },
          transport: {
            work_from_home: 22,
            car_driver: 48,
            car_passenger: 4,
            bus: 12,
            train: 10,
            bicycle: 3,
            on_foot: 1,
            other: 0
          },
          geom: {
            type: 'Polygon',
            coordinates: [[[-2.385, 53.555], [-2.375, 53.555], [-2.375, 53.562], [-2.385, 53.562], [-2.385, 53.555]]]
          }
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockCensusData, error: null })
      } as any)

      // Test census data retrieval
      const censusData = await geoJSONService.getCensusData()
      expect(censusData).toHaveLength(2)
      expect(censusData[0].name).toBe('Stoneclough Central')

      // Test community statistics calculation
      const statistics = await geoJSONService.getCommunityStatistics()
      expect(statistics.total_population).toBe(3500)
      expect(statistics.total_households).toBe(1400)
      expect(statistics.average_age).toBeCloseTo(38, 0)
      expect(statistics.average_income).toBeCloseTo(29143, 0)
      expect(statistics.unemployment_rate).toBeCloseTo(3.7, 1)
    })

    it('should create demographic heatmaps from census data', async () => {
      const mockCensusData = [
        {
          id: 'area-1',
          name: 'Test Area',
          population: 1000,
          education_level: { level_4_qualifications_and_above: 30 },
          housing: { owned_outright: 40 },
          transport: { car_driver: 50 },
          geom: {
            type: 'Polygon',
            coordinates: [[[-2.4, 53.5], [-2.3, 53.5], [-2.3, 53.6], [-2.4, 53.6], [-2.4, 53.5]]]
          }
        }
      ]

      jest.spyOn(geoJSONService, 'getCensusData').mockResolvedValue(mockCensusData)

      // Test population heatmap
      const populationHeatmap = await geoJSONService.createDemographicHeatmap('population')
      expect(populationHeatmap.type).toBe('FeatureCollection')
      expect(populationHeatmap.features[0].properties.value).toBe(1000)
      expect(populationHeatmap.features[0].properties.metric).toBe('population')

      // Test education heatmap
      const educationHeatmap = await geoJSONService.createDemographicHeatmap('level_4_qualifications_and_above')
      expect(educationHeatmap.features[0].properties.value).toBe(30)

      // Test housing heatmap
      const housingHeatmap = await geoJSONService.createDemographicHeatmap('owned_outright')
      expect(housingHeatmap.features[0].properties.value).toBe(40)

      // Test transport heatmap
      const transportHeatmap = await geoJSONService.createDemographicHeatmap('car_driver')
      expect(transportHeatmap.features[0].properties.value).toBe(50)
    })
  })

  describe('Community Boundaries Integration', () => {
    it('should integrate boundaries with census data', async () => {
      const mockBoundaries = [
        {
          id: 'boundary-1',
          name: 'Stoneclough Parish',
          type: 'parish',
          description: 'Historic parish boundary',
          population: 5000,
          area_hectares: 500,
          geom: {
            type: 'Polygon',
            coordinates: [[[-2.390, 53.545], [-2.370, 53.545], [-2.370, 53.565], [-2.390, 53.565], [-2.390, 53.545]]]
          },
          metadata: { established: '1894' }
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockBoundaries, error: null })
      } as any)

      const boundaries = await geoJSONService.getCommunityBoundaries()
      expect(boundaries).toHaveLength(1)
      expect(boundaries[0].name).toBe('Stoneclough Parish')
      expect(boundaries[0].type).toBe('parish')
      expect(boundaries[0].population).toBe(5000)
    })

    it('should filter boundaries by type', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      await geoJSONService.getCommunityBoundaries('ward')

      expect(mockSupabase.from).toHaveBeenCalledWith('community_boundaries')
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'ward')
    })
  })

  describe('Points of Interest Integration', () => {
    it('should integrate POIs with geographic context', async () => {
      const mockPOIs = [
        {
          id: 'poi-1',
          name: 'Stoneclough Primary School',
          category: 'education',
          description: 'Local primary school',
          address: 'School Lane, Stoneclough',
          geom: {
            type: 'Point',
            coordinates: [-2.378, 53.552]
          },
          metadata: {
            capacity: 420,
            age_range: '4-11',
            ofsted_rating: 'Good'
          }
        },
        {
          id: 'poi-2',
          name: 'Community Centre',
          category: 'community',
          description: 'Village hall and meeting space',
          address: 'Church Street, Stoneclough',
          geom: {
            type: 'Point',
            coordinates: [-2.382, 53.551]
          },
          metadata: {
            capacity: 150,
            facilities: ['Main hall', 'Kitchen', 'Meeting rooms']
          }
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockPOIs, error: null })
      } as any)

      // Test all POIs
      const allPOIs = await geoJSONService.getPointsOfInterest()
      expect(allPOIs.type).toBe('FeatureCollection')
      expect(allPOIs.features).toHaveLength(2)
      expect(allPOIs.features[0].properties.name).toBe('Stoneclough Primary School')

      // Test filtered POIs
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [mockPOIs[0]], error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const educationPOIs = await geoJSONService.getPointsOfInterest('education')
      expect(educationPOIs.features).toHaveLength(1)
      expect(educationPOIs.features[0].properties.category).toBe('education')
    })
  })

  describe('Geographic Layers Integration', () => {
    it('should integrate multiple layer types', async () => {
      const mockLayers = [
        {
          id: 'layer-1',
          name: 'Transport Network',
          description: 'Bus routes and transport infrastructure',
          type: 'transport',
          data_source: 'Transport for Greater Manchester',
          visible: true,
          opacity: 0.8,
          color_scheme: 'blues',
          geom: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [[-2.390, 53.548], [-2.370, 53.552]]
                },
                properties: {
                  route: '524',
                  operator: 'First Greater Manchester'
                }
              }
            ]
          },
          metadata: { last_updated: '2024-01-15' }
        },
        {
          id: 'layer-2',
          name: 'Environmental Zones',
          description: 'Protected areas and green spaces',
          type: 'environment',
          data_source: 'Natural England',
          visible: true,
          opacity: 0.6,
          color_scheme: 'greens',
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
        in: jest.fn().mockResolvedValue({ data: mockLayers, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const layers = await geoJSONService.getGeographicLayers(['transport', 'environment'])
      expect(layers).toHaveLength(2)
      expect(layers[0].type).toBe('transport')
      expect(layers[1].type).toBe('environment')
    })
  })

  describe('Spatial Query Integration', () => {
    it('should perform spatial queries with bounds', async () => {
      const bounds = {
        north: 53.565,
        south: 53.545,
        east: -2.370,
        west: -2.390
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        filter: jest.fn().mockResolvedValue({ data: [], error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      await geoJSONService.getCensusData(bounds)

      expect(mockQuery.filter).toHaveBeenCalledWith(
        'geom',
        'intersects',
        expect.stringContaining('POLYGON((-2.390 53.545, -2.370 53.545, -2.370 53.565, -2.390 53.565, -2.390 53.545))')
      )
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: null, error: new Error('Database connection failed') })
      } as any)

      const censusData = await geoJSONService.getCensusData()
      expect(censusData).toEqual([])

      const boundaries = await geoJSONService.getCommunityBoundaries()
      expect(boundaries).toEqual([])

      const layers = await geoJSONService.getGeographicLayers()
      expect(layers).toEqual([])

      const statistics = await geoJSONService.getCommunityStatistics()
      expect(statistics.total_population).toBe(0)
    })

    it('should handle malformed data gracefully', async () => {
      const malformedData = [
        {
          id: 'bad-data',
          name: null,
          population: 'not-a-number',
          geom: 'invalid-geometry'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: malformedData, error: null })
      } as any)

      // Should not throw errors
      const censusData = await geoJSONService.getCensusData()
      expect(censusData).toEqual(malformedData)

      // Statistics calculation should handle bad data
      const statistics = await geoJSONService.getCommunityStatistics()
      expect(statistics).toBeDefined()
    })
  })

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      // Generate large dataset
      const largeCensusData = Array.from({ length: 100 }, (_, i) => ({
        id: `area-${i}`,
        name: `Area ${i}`,
        population: Math.floor(Math.random() * 5000) + 500,
        households: Math.floor(Math.random() * 2000) + 200,
        median_age: Math.random() * 30 + 25,
        median_income: Math.floor(Math.random() * 40000) + 20000,
        unemployment_rate: Math.random() * 10,
        education_level: {
          no_qualifications: Math.random() * 20,
          level_1_qualifications: Math.random() * 20,
          level_2_qualifications: Math.random() * 20,
          apprenticeship: Math.random() * 15,
          level_3_qualifications: Math.random() * 20,
          level_4_qualifications_and_above: Math.random() * 30,
          other_qualifications: 0
        },
        housing: {
          owned_outright: Math.random() * 40,
          owned_with_mortgage: Math.random() * 40,
          shared_ownership: Math.random() * 5,
          social_rented: Math.random() * 20,
          private_rented: Math.random() * 20,
          rent_free: Math.random() * 2
        },
        transport: {
          work_from_home: Math.random() * 30,
          car_driver: Math.random() * 60,
          car_passenger: Math.random() * 10,
          bus: Math.random() * 20,
          train: Math.random() * 15,
          bicycle: Math.random() * 10,
          on_foot: Math.random() * 10,
          other: Math.random() * 5
        },
        geom: {
          type: 'Polygon',
          coordinates: [[
            [-2.4 + (i % 10) * 0.01, 53.5 + Math.floor(i / 10) * 0.01],
            [-2.39 + (i % 10) * 0.01, 53.5 + Math.floor(i / 10) * 0.01],
            [-2.39 + (i % 10) * 0.01, 53.51 + Math.floor(i / 10) * 0.01],
            [-2.4 + (i % 10) * 0.01, 53.51 + Math.floor(i / 10) * 0.01],
            [-2.4 + (i % 10) * 0.01, 53.5 + Math.floor(i / 10) * 0.01]
          ]]
        }
      }))

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: largeCensusData, error: null })
      } as any)

      const startTime = Date.now()
      const statistics = await geoJSONService.getCommunityStatistics()
      const endTime = Date.now()

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
      expect(statistics.total_population).toBeGreaterThan(0)
      expect(statistics.total_households).toBeGreaterThan(0)
    })
  })
})
