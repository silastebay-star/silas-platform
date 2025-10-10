/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GeoJSONOverlay from '../GeoJSONOverlay'
import { geoJSONService } from '@/lib/services/geojson-service'

// Mock the GeoJSON service
jest.mock('@/lib/services/geojson-service', () => ({
  geoJSONService: {
    getCensusData: jest.fn(),
    getCommunityBoundaries: jest.fn(),
    getCommunityStatistics: jest.fn(),
    createDemographicHeatmap: jest.fn(),
  },
}))

const mockGeoJSONService = geoJSONService as jest.Mocked<typeof geoJSONService>

// Mock Mapbox GL Map
const mockMap = {
  isStyleLoaded: jest.fn(() => true),
  addSource: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn(),
  getLayer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  setLayoutProperty: jest.fn(),
  setPaintProperty: jest.fn(),
} as any

describe('GeoJSONOverlay', () => {
  const mockOnToggle = jest.fn()

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
    mockGeoJSONService.getCommunityStatistics.mockResolvedValue(mockStatistics)
    mockGeoJSONService.createDemographicHeatmap.mockResolvedValue({
      type: 'FeatureCollection',
      features: []
    })
  })

  it('should not render when not visible', () => {
    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={false}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.queryByText('Geographic Overlays')).not.toBeInTheDocument()
  })

  it('should render when visible', () => {
    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByText('Geographic Overlays')).toBeInTheDocument()
    expect(screen.getByText('Census Data')).toBeInTheDocument()
    expect(screen.getByText('Community Boundaries')).toBeInTheDocument()
    expect(screen.getByText('Demographic Heatmaps')).toBeInTheDocument()
  })

  it('should load data when visible', async () => {
    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    await waitFor(() => {
      expect(mockGeoJSONService.getCensusData).toHaveBeenCalled()
      expect(mockGeoJSONService.getCommunityBoundaries).toHaveBeenCalled()
      expect(mockGeoJSONService.getCommunityStatistics).toHaveBeenCalled()
    })
  })

  it('should display community statistics', async () => {
    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Community Overview')).toBeInTheDocument()
      expect(screen.getByText('1,000')).toBeInTheDocument() // Population
      expect(screen.getByText('400')).toBeInTheDocument() // Households
      expect(screen.getByText('35.5 years')).toBeInTheDocument() // Average age
      expect(screen.getByText('£25,000')).toBeInTheDocument() // Average income
    })
  })

  it('should toggle overlay configurations', async () => {
    const user = userEvent.setup()

    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    // Find and click the census data toggle
    const censusToggle = screen.getByRole('switch', { name: /census data/i })
    expect(censusToggle).not.toBeChecked()

    await user.click(censusToggle)
    expect(censusToggle).toBeChecked()

    // Find and click the community boundaries toggle (should be checked by default)
    const boundariesToggle = screen.getByRole('switch', { name: /community boundaries/i })
    expect(boundariesToggle).toBeChecked()

    await user.click(boundariesToggle)
    expect(boundariesToggle).not.toBeChecked()
  })

  it('should show demographic metric selector when census data is enabled', async () => {
    const user = userEvent.setup()

    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    // Enable census data
    const censusToggle = screen.getByRole('switch', { name: /census data/i })
    await user.click(censusToggle)

    // Check if demographic metric selector appears
    await waitFor(() => {
      expect(screen.getByText('Demographic Metric')).toBeInTheDocument()
    })

    // Check if the select has the default value
    expect(screen.getByDisplayValue('Population')).toBeInTheDocument()
  })

  it('should update demographic heatmap when metric changes', async () => {
    const user = userEvent.setup()

    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    // Enable census data first
    const censusToggle = screen.getByRole('switch', { name: /census data/i })
    await user.click(censusToggle)

    await waitFor(() => {
      expect(screen.getByText('Demographic Metric')).toBeInTheDocument()
    })

    // Find and click the select trigger
    const selectTrigger = screen.getByRole('combobox')
    await user.click(selectTrigger)

    // Wait for options to appear and select one
    await waitFor(() => {
      expect(screen.getByText('Median Age')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Median Age'))

    await waitFor(() => {
      expect(mockGeoJSONService.createDemographicHeatmap).toHaveBeenCalledWith('median_age')
    })
  })

  it('should show loading state', () => {
    // Mock loading state by making the service calls hang
    mockGeoJSONService.getCensusData.mockImplementation(() => new Promise(() => {}))

    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByText('Loading geographic data...')).toBeInTheDocument()
  })

  it('should initialize map layers when data is loaded', async () => {
    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    await waitFor(() => {
      expect(mockMap.addSource).toHaveBeenCalledWith('census-data', expect.objectContaining({
        type: 'geojson',
        data: expect.objectContaining({
          type: 'FeatureCollection',
          features: expect.arrayContaining([
            expect.objectContaining({
              type: 'Feature',
              id: 'census-1',
              properties: expect.objectContaining({
                name: 'Test Area',
                population: 1000
              })
            })
          ])
        })
      }))
    })

    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'census-fill',
      type: 'fill',
      source: 'census-data'
    }))

    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'census-outline',
      type: 'line',
      source: 'census-data'
    }))
  })

  it('should add boundary layers', async () => {
    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    await waitFor(() => {
      expect(mockMap.addSource).toHaveBeenCalledWith('community-boundaries', expect.objectContaining({
        type: 'geojson',
        data: expect.objectContaining({
          type: 'FeatureCollection',
          features: expect.arrayContaining([
            expect.objectContaining({
              type: 'Feature',
              id: 'boundary-1',
              properties: expect.objectContaining({
                name: 'Test Parish',
                type: 'parish'
              })
            })
          ])
        })
      }))
    })

    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'boundaries-fill',
      type: 'fill',
      source: 'community-boundaries'
    }))

    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'boundaries-outline',
      type: 'line',
      source: 'community-boundaries'
    }))
  })

  it('should update layer visibility when config changes', async () => {
    const user = userEvent.setup()

    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    // Wait for initial load
    await waitFor(() => {
      expect(mockMap.addLayer).toHaveBeenCalled()
    })

    // Toggle census data on
    const censusToggle = screen.getByRole('switch', { name: /census data/i })
    await user.click(censusToggle)

    await waitFor(() => {
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('census-fill', 'visibility', 'visible')
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('census-outline', 'visibility', 'visible')
    })

    // Toggle community boundaries off
    const boundariesToggle = screen.getByRole('switch', { name: /community boundaries/i })
    await user.click(boundariesToggle)

    await waitFor(() => {
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('boundaries-fill', 'visibility', 'none')
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('boundaries-outline', 'visibility', 'none')
    })
  })

  it('should show legend when census data is enabled', async () => {
    const user = userEvent.setup()

    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    // Enable census data
    const censusToggle = screen.getByRole('switch', { name: /census data/i })
    await user.click(censusToggle)

    await waitFor(() => {
      expect(screen.getByText('Legend')).toBeInTheDocument()
      expect(screen.getByText('Low')).toBeInTheDocument()
      expect(screen.getByText('High')).toBeInTheDocument()
    })
  })

  it('should handle click events on census areas', async () => {
    render(
      <GeoJSONOverlay
        map={mockMap}
        visible={true}
        onToggle={mockOnToggle}
      />
    )

    await waitFor(() => {
      expect(mockMap.on).toHaveBeenCalledWith('click', 'census-fill', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('mouseenter', 'census-fill', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('mouseleave', 'census-fill', expect.any(Function))
    })
  })
})
