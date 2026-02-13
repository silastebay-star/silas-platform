import { validatePinLocation, isPointInBoundary } from '@/lib/boundary-utils'
import { LngLatBounds } from 'mapbox-gl'

// Mock the fetch API for /silas.geojson
global.fetch = jest.fn((url) => {
  if (url === '/silas.geojson') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [
                [ // A simple square boundary around Stoneclough
                  [-2.39, 53.53],
                  [-2.34, 53.53],
                  [-2.34, 53.56],
                  [-2.39, 53.56],
                  [-2.39, 53.53],
                ],
              ],
            },
          },
        ],
      }),
    })
  }
  return Promise.reject(new Error('unknown url'))
}) as jest.Mock

describe('isPointInBoundary', () => {
  it('should return true for a point inside the polygon', () => {
    // Test with a point clearly inside the mocked boundary
    expect(isPointInBoundary(-2.36, 53.54)).toBe(true)
  })

  it('should return false for a point outside the polygon', () => {
    // Test with a point clearly outside the mocked boundary
    expect(isPointInBoundary(0, 0)).toBe(false)
  })
})

describe('validatePinLocation', () => {
  it('should return isValid: true for a location within the boundary', () => {
    const lng = -2.365 // Within the mocked boundary
    const lat = 53.545 // Within the mocked boundary
    const result = validatePinLocation(lng, lat)
    expect(result.isValid).toBe(true)
    expect(result.message).toBeUndefined()
  })

  it('should return isValid: false for a location outside the boundary', () => {
    const lng = 0 // Outside the mocked boundary
    const lat = 0 // Outside the mocked boundary
    const result = validatePinLocation(lng, lat)
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('Pin location is outside the community boundary. Please place your pin within the highlighted area.')
  })

  it('should return a suggested location if available', () => {
    const lng = -2.3 // Slightly outside the boundary
    const lat = 53.6 // Slightly outside the boundary
    const result = validatePinLocation(lng, lat)
    if (!result.isValid) {
      expect(result.suggestedLocation).toBeDefined()
    }
  })
})