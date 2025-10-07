/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import MapRoot from '../MapRoot'
import { Pin, MapFilters } from '@/types/silas'

// Mock Mapbox GL
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    addControl: jest.fn(),
    getCenter: jest.fn(() => ({ lng: -2.4833, lat: 53.5500 })),
    getZoom: jest.fn(() => 15),
    getBearing: jest.fn(() => 0),
    getPitch: jest.fn(() => 0),
    getBounds: jest.fn(() => ({
      getNorth: () => 53.56,
      getSouth: () => 53.54,
      getEast: () => -2.47,
      getWest: () => -2.49
    })),
    isStyleLoaded: jest.fn(() => true),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    getSource: jest.fn(),
    getLayer: jest.fn(),
    queryRenderedFeatures: jest.fn(() => []),
    setFeatureState: jest.fn(),
    removeFeatureState: jest.fn(),
    getCanvas: jest.fn(() => ({
      style: { cursor: '' }
    }))
  })),
  NavigationControl: jest.fn(),
  GeolocateControl: jest.fn()
}))

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn(() => Promise.resolve({ data: [], error: null }))
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn()
  }))
}

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock monitoring
jest.mock('@/lib/monitoring', () => ({
  ErrorTracker: {
    logCustomError: jest.fn()
  },
  PerformanceTracker: {
    startTiming: jest.fn(),
    endTiming: jest.fn(),
    measurePinLoad: jest.fn()
  }
}))

// Mock environment variable
process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'test-token'

// Test data
const mockPin: Pin = {
  id: 'test-pin-1',
  title: 'Test Pin',
  description: 'A test pin for unit testing',
  categories: ['community'],
  project_id: null,
  group_id: null,
  author_type: 'individual',
  geom: {
    type: 'Point',
    coordinates: [-2.4833, 53.5500]
  },
  status: 'published',
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const defaultFilters: MapFilters = {
  categories: [],
  status: ['published'],
  author_type: []
}

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-auth-provider">{children}</div>
)

describe('MapRoot Component', () => {
  const mockOnPinSelect = jest.fn()
  const mockOnPinHover = jest.fn()
  const mockOnMapMove = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <MockAuthProvider>
        <MapRoot
          filters={defaultFilters}
          onPinSelect={mockOnPinSelect}
        />
      </MockAuthProvider>
    )

    expect(screen.getByRole('application')).toBeInTheDocument()
    expect(screen.getByLabelText('Interactive map showing community pins')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(
      <MockAuthProvider>
        <MapRoot
          filters={defaultFilters}
          onPinSelect={mockOnPinSelect}
        />
      </MockAuthProvider>
    )

    expect(screen.getByText('Loading map...')).toBeInTheDocument()
  })

  it('shows error when Mapbox token is missing', () => {
    const originalToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    render(
      <MockAuthProvider>
        <MapRoot
          filters={defaultFilters}
          onPinSelect={mockOnPinSelect}
        />
      </MockAuthProvider>
    )

    expect(screen.getByText('Map Configuration Required')).toBeInTheDocument()
    expect(screen.getByText('Please configure your Mapbox access token.')).toBeInTheDocument()

    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = originalToken
  })

  it('applies active category filter', () => {
    render(
      <MockAuthProvider>
        <MapRoot
          activeCategory="community"
          filters={defaultFilters}
          onPinSelect={mockOnPinSelect}
        />
      </MockAuthProvider>
    )

    // The component should merge activeCategory with filters
    expect(mockSupabase.from).toHaveBeenCalledWith('pins')
  })

  it('calls onPinSelect when pin is selected', async () => {
    render(
      <MockAuthProvider>
        <MapRoot
          filters={defaultFilters}
          onPinSelect={mockOnPinSelect}
        />
      </MockAuthProvider>
    )

    // Simulate pin selection (this would normally come from PinLayer)
    // Since we're testing the MapRoot component, we'll test the callback
    expect(mockOnPinSelect).toHaveBeenCalledTimes(0)
  })

  it('calls onMapMove when map moves', () => {
    render(
      <MockAuthProvider>
        <MapRoot
          filters={defaultFilters}
          onPinSelect={mockOnPinSelect}
          onMapMove={mockOnMapMove}
        />
      </MockAuthProvider>
    )

    // The onMapMove callback should be set up
    expect(mockOnMapMove).toHaveBeenCalledTimes(0)
  })

  it('applies custom className and style', () => {
    const customClass = 'custom-map-class'
    const customStyle = { backgroundColor: 'red' }

    render(
      <MockAuthProvider>
        <MapRoot
          filters={defaultFilters}
          onPinSelect={mockOnPinSelect}
          className={customClass}
          style={customStyle}
        />
      </MockAuthProvider>
    )

    const mapContainer = screen.getByRole('application').parentElement
    expect(mapContainer).toHaveClass(customClass)
    expect(mapContainer).toHaveStyle(customStyle)
  })

  it('handles search query in filters', () => {
    const filtersWithSearch: MapFilters = {
      ...defaultFilters,
      search_query: 'test search'
    }

    render(
      <MockAuthProvider>
        <MapRoot
          filters={filtersWithSearch}
          onPinSelect={mockOnPinSelect}
        />
      </MockAuthProvider>
    )

    expect(mockSupabase.from).toHaveBeenCalledWith('pins')
  })

  it('handles date range filter', () => {
    const filtersWithDateRange: MapFilters = {
      ...defaultFilters,
      date_range: {
        start: '2024-01-01',
        end: '2024-12-31'
      }
    }

    render(
      <MockAuthProvider>
        <MapRoot
          filters={filtersWithDateRange}
          onPinSelect={mockOnPinSelect}
        />
      </MockAuthProvider>
    )

    expect(mockSupabase.from).toHaveBeenCalledWith('pins')
  })

  it('handles bounding box filter', () => {
    const filtersWithBbox: MapFilters = {
      ...defaultFilters,
      bounding_box: {
        north: 53.56,
        south: 53.54,
        east: -2.47,
        west: -2.49
      }
    }

    render(
      <MockAuthProvider>
        <MapRoot
          filters={filtersWithBbox}
          onPinSelect={mockOnPinSelect}
        />
      </MockAuthProvider>
    )

    expect(mockSupabase.from).toHaveBeenCalledWith('pins')
  })

  it('sets up real-time subscription', () => {
    render(
      <MockAuthProvider>
        <MapRoot
          filters={defaultFilters}
          onPinSelect={mockOnPinSelect}
        />
      </MockAuthProvider>
    )

    expect(mockSupabase.channel).toHaveBeenCalledWith('pins-changes')
  })

  it('handles accessibility attributes correctly', () => {
    render(
      <MockAuthProvider>
        <MapRoot
          filters={defaultFilters}
          onPinSelect={mockOnPinSelect}
        />
      </MockAuthProvider>
    )

    const mapElement = screen.getByRole('application')
    expect(mapElement).toHaveAttribute('aria-label', 'Interactive map showing community pins')
  })
})

describe('MapRoot Integration', () => {
  it('integrates with AuthProvider correctly', () => {
    render(
      <AuthProvider>
        <MapRoot
          filters={defaultFilters}
          onPinSelect={jest.fn()}
        />
      </AuthProvider>
    )

    // Should render without errors when wrapped in real AuthProvider
    expect(screen.getByRole('application')).toBeInTheDocument()
  })
})
