/**
 * GeoJSON Integration Service
 * Handles census data overlays, community boundaries, and geographic data visualization
 */

import { supabase } from '@/lib/supabase'

export interface CensusData {
  id: string
  name: string
  population: number
  households: number
  median_age: number
  median_income: number
  unemployment_rate: number
  education_level: {
    no_qualifications: number
    level_1_qualifications: number
    level_2_qualifications: number
    apprenticeship: number
    level_3_qualifications: number
    level_4_qualifications_and_above: number
    other_qualifications: number
  }
  housing: {
    owned_outright: number
    owned_with_mortgage: number
    shared_ownership: number
    social_rented: number
    private_rented: number
    rent_free: number
  }
  transport: {
    work_from_home: number
    underground_metro: number
    train: number
    bus: number
    taxi: number
    motorcycle: number
    car_driver: number
    car_passenger: number
    bicycle: number
    on_foot: number
    other: number
  }
  geom: GeoJSON.Polygon
  created_at: string
  updated_at: string
}

export interface CommunityBoundary {
  id: string
  name: string
  type: 'ward' | 'parish' | 'constituency' | 'local_authority' | 'custom'
  description?: string
  population?: number
  area_hectares?: number
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface GeographicLayer {
  id: string
  name: string
  description: string
  type: 'census' | 'boundary' | 'infrastructure' | 'environment' | 'transport'
  source_url?: string
  data_source: string
  last_updated: string
  visible: boolean
  opacity: number
  color_scheme: string
  geom: GeoJSON.FeatureCollection
  metadata: Record<string, any>
}

export interface MapOverlayConfig {
  census_data: boolean
  community_boundaries: boolean
  transport_networks: boolean
  environmental_zones: boolean
  infrastructure: boolean
  demographic_heatmaps: boolean
}

class GeoJSONService {
  /**
   * Get census data for a specific area
   */
  async getCensusData(bounds?: {
    north: number
    south: number
    east: number
    west: number
  }): Promise<CensusData[]> {
    try {
      let query = supabase
        .from('census_data')
        .select('*')

      if (bounds) {
        // Use PostGIS to filter by bounding box
        query = query.filter('geom', 'intersects', `POLYGON((${bounds.west} ${bounds.south}, ${bounds.east} ${bounds.south}, ${bounds.east} ${bounds.north}, ${bounds.west} ${bounds.north}, ${bounds.west} ${bounds.south}))`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching census data:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getCensusData:', error)
      return []
    }
  }

  /**
   * Get community boundaries
   */
  async getCommunityBoundaries(type?: string): Promise<CommunityBoundary[]> {
    try {
      let query = supabase
        .from('community_boundaries')
        .select('*')

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching community boundaries:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getCommunityBoundaries:', error)
      return []
    }
  }

  /**
   * Get geographic layers for map overlays
   */
  async getGeographicLayers(types?: string[]): Promise<GeographicLayer[]> {
    try {
      let query = supabase
        .from('geographic_layers')
        .select('*')
        .eq('visible', true)

      if (types && types.length > 0) {
        query = query.in('type', types)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching geographic layers:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getGeographicLayers:', error)
      return []
    }
  }

  /**
   * Create demographic heatmap data
   */
  async createDemographicHeatmap(metric: keyof CensusData['education_level'] | keyof CensusData['housing'] | keyof CensusData['transport'] | 'population' | 'median_age' | 'median_income' | 'unemployment_rate'): Promise<GeoJSON.FeatureCollection> {
    try {
      const censusData = await this.getCensusData()
      
      const features = censusData.map(area => ({
        type: 'Feature' as const,
        id: area.id,
        geometry: area.geom,
        properties: {
          id: area.id,
          name: area.name,
          value: this.extractMetricValue(area, metric),
          population: area.population,
          metric: metric
        }
      }))

      return {
        type: 'FeatureCollection',
        features
      }
    } catch (error) {
      console.error('Error creating demographic heatmap:', error)
      return { type: 'FeatureCollection', features: [] }
    }
  }

  /**
   * Extract metric value from census data
   */
  private extractMetricValue(area: CensusData, metric: string): number {
    if (metric in area) {
      return area[metric as keyof CensusData] as number
    }
    
    if (metric in area.education_level) {
      return area.education_level[metric as keyof CensusData['education_level']]
    }
    
    if (metric in area.housing) {
      return area.housing[metric as keyof CensusData['housing']]
    }
    
    if (metric in area.transport) {
      return area.transport[metric as keyof CensusData['transport']]
    }
    
    return 0
  }

  /**
   * Get points of interest within community boundaries
   */
  async getPointsOfInterest(category?: string): Promise<GeoJSON.FeatureCollection> {
    try {
      let query = supabase
        .from('points_of_interest')
        .select('*')

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching points of interest:', error)
        return { type: 'FeatureCollection', features: [] }
      }

      const features = (data || []).map(poi => ({
        type: 'Feature' as const,
        id: poi.id,
        geometry: poi.geom,
        properties: {
          id: poi.id,
          name: poi.name,
          category: poi.category,
          description: poi.description,
          metadata: poi.metadata
        }
      }))

      return {
        type: 'FeatureCollection',
        features
      }
    } catch (error) {
      console.error('Error in getPointsOfInterest:', error)
      return { type: 'FeatureCollection', features: [] }
    }
  }

  /**
   * Calculate community statistics from census data
   */
  async getCommunityStatistics(): Promise<{
    total_population: number
    total_households: number
    average_age: number
    average_income: number
    unemployment_rate: number
    housing_ownership: {
      owned: number
      rented: number
      social: number
    }
    education_levels: {
      no_qualifications: number
      basic: number
      intermediate: number
      advanced: number
    }
    transport_modes: {
      car: number
      public_transport: number
      active_travel: number
      work_from_home: number
    }
  }> {
    try {
      const censusData = await this.getCensusData()
      
      if (censusData.length === 0) {
        return this.getDefaultStatistics()
      }

      let housingOwnership = { owned: 0, rented: 0, social: 0 }
      let educationLevels = { no_qualifications: 0, basic: 0, intermediate: 0, advanced: 0 }
      let transportModes = { car: 0, public_transport: 0, active_travel: 0, work_from_home: 0 }

      const totalPopulation = censusData.reduce((sum, area) => sum + area.population, 0)
      const totalHouseholds = censusData.reduce((sum, area) => sum + area.households, 0)
      
      // Calculate weighted averages
      const averageAge = censusData.reduce((sum, area) => sum + (area.median_age * area.population), 0) / totalPopulation
      const averageIncome = censusData.reduce((sum, area) => sum + (area.median_income * area.households), 0) / totalHouseholds
      const unemploymentRate = censusData.reduce((sum, area) => sum + (area.unemployment_rate * area.population), 0) / totalPopulation

      // Aggregate housing data
      housingOwnership = {
        owned: censusData.reduce((sum, area) => sum + area.housing.owned_outright + area.housing.owned_with_mortgage, 0) / totalHouseholds * 100,
        rented: censusData.reduce((sum, area) => sum + area.housing.private_rented, 0) / totalHouseholds * 100,
        social: censusData.reduce((sum, area) => sum + area.housing.social_rented, 0) / totalHouseholds * 100
      }

      // Aggregate education data
      educationLevels = {
        no_qualifications: censusData.reduce((sum, area) => sum + area.education_level.no_qualifications, 0) / totalPopulation * 100,
        basic: censusData.reduce((sum, area) => sum + area.education_level.level_1_qualifications + area.education_level.level_2_qualifications, 0) / totalPopulation * 100,
        intermediate: censusData.reduce((sum, area) => sum + area.education_level.level_3_qualifications + area.education_level.apprenticeship, 0) / totalPopulation * 100,
        advanced: censusData.reduce((sum, area) => sum + area.education_level.level_4_qualifications_and_above, 0) / totalPopulation * 100
      }

      // Aggregate transport data
      transportModes = {
        car: censusData.reduce((sum, area) => sum + area.transport.car_driver + area.transport.car_passenger, 0) / totalPopulation * 100,
        public_transport: censusData.reduce((sum, area) => sum + area.transport.bus + area.transport.train + area.transport.underground_metro, 0) / totalPopulation * 100,
        active_travel: censusData.reduce((sum, area) => sum + area.transport.bicycle + area.transport.on_foot, 0) / totalPopulation * 100,
        work_from_home: censusData.reduce((sum, area) => sum + area.transport.work_from_home, 0) / totalPopulation * 100
      }

      return {
        total_population: totalPopulation,
        total_households: totalHouseholds,
        average_age: Math.round(averageAge * 10) / 10,
        average_income: Math.round(averageIncome),
        unemployment_rate: Math.round(unemploymentRate * 10) / 10,
        housing_ownership,
        education_levels,
        transport_modes
      }
    } catch (error) {
      console.error('Error calculating community statistics:', error)
      return this.getDefaultStatistics()
    }
  }

  private getDefaultStatistics() {
    return {
      total_population: 0,
      total_households: 0,
      average_age: 0,
      average_income: 0,
      unemployment_rate: 0,
      housing_ownership: { owned: 0, rented: 0, social: 0 },
      education_levels: { no_qualifications: 0, basic: 0, intermediate: 0, advanced: 0 },
      transport_modes: { car: 0, public_transport: 0, active_travel: 0, work_from_home: 0 }
    }
  }
}

export const geoJSONService = new GeoJSONService()
export default geoJSONService
