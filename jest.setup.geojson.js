/**
 * Jest setup file for GeoJSON integration tests
 */

// Mock Mapbox GL JS
global.mapboxgl = {
  Map: jest.fn(() => ({
    addControl: jest.fn(),
    removeControl: jest.fn(),
    addSource: jest.fn(),
    removeSource: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    getSource: jest.fn(),
    getLayer: jest.fn(),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    isStyleLoaded: jest.fn(() => true),
    getCanvas: jest.fn(() => ({
      style: { cursor: '' }
    }))
  })),
  NavigationControl: jest.fn(),
  GeolocateControl: jest.fn(),
  Popup: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    setHTML: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn()
  })),
  supported: jest.fn(() => true)
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'test-mapbox-token'

// Mock console methods to reduce noise in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Global test utilities
global.testUtils = {
  // Helper to create mock census data
  createMockCensusData: (overrides = {}) => ({
    id: 'test-census-1',
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
      type: 'Polygon',
      coordinates: [[[-2.4, 53.5], [-2.3, 53.5], [-2.3, 53.6], [-2.4, 53.6], [-2.4, 53.5]]]
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }),

  // Helper to create mock boundary data
  createMockBoundaryData: (overrides = {}) => ({
    id: 'test-boundary-1',
    name: 'Test Parish',
    type: 'parish',
    description: 'Test parish boundary',
    population: 5000,
    area_hectares: 500,
    geom: {
      type: 'Polygon',
      coordinates: [[[-2.5, 53.4], [-2.2, 53.4], [-2.2, 53.7], [-2.5, 53.7], [-2.5, 53.4]]]
    },
    metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }),

  // Helper to create mock statistics
  createMockStatistics: (overrides = {}) => ({
    total_population: 1000,
    total_households: 400,
    average_age: 35.5,
    average_income: 25000,
    unemployment_rate: 4.2,
    housing_ownership: { owned: 70, rented: 12, social: 15 },
    education_levels: { no_qualifications: 10, basic: 35, intermediate: 30, advanced: 25 },
    transport_modes: { car: 45, public_transport: 25, active_travel: 7, work_from_home: 20 },
    ...overrides
  }),

  // Helper to wait for async operations
  waitFor: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const check = () => {
        if (condition()) {
          resolve(true)
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'))
        } else {
          setTimeout(check, 100)
        }
      }
      check()
    })
  },

  // Helper to simulate user interactions
  simulateUserEvent: {
    click: (element) => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    },
    change: (element, value) => {
      element.value = value
      element.dispatchEvent(new Event('change', { bubbles: true }))
    },
    keyPress: (element, key) => {
      element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    }
  }
}

// Mock performance API
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  now: jest.fn(() => Date.now())
}
