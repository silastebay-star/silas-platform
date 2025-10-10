/**
 * Boundary utilities for SILAS platform
 * Handles GeoJSON boundary validation and map constraints
 */

import { LngLat, LngLatBounds } from 'mapbox-gl'

export interface BoundaryConfig {
  geojson: GeoJSON.FeatureCollection
  bounds: LngLatBounds
  center: [number, number]
  maxBounds: LngLatBounds
}

// Cache for the boundary data
let boundaryCache: BoundaryConfig | null = null

/**
 * Load and parse the boundary configuration
 */
export async function loadBoundaryConfig(): Promise<BoundaryConfig> {
  if (boundaryCache) {
    return boundaryCache
  }

  try {
    const response = await fetch('/silas.geojson')
    const boundaryData = await response.json()
    const geojson = boundaryData as GeoJSON.FeatureCollection

    // Calculate bounds from the GeoJSON
    const bounds = calculateBounds(geojson)

    // Add padding to max bounds to allow some movement outside the boundary
    const padding = 0.01 // ~1km padding
    const maxBounds = new LngLatBounds([
      bounds.getSouthWest().lng - padding,
      bounds.getSouthWest().lat - padding
    ], [
      bounds.getNorthEast().lng + padding,
      bounds.getNorthEast().lat + padding
    ])

    const center: [number, number] = [
      bounds.getCenter().lng,
      bounds.getCenter().lat
    ]

    boundaryCache = {
      geojson,
      bounds,
      center,
      maxBounds
    }

    return boundaryCache
  } catch (error) {
    console.error('Failed to load boundary data:', error)
    // Return a fallback boundary for Stoneclough
    const fallbackBounds = new LngLatBounds([-2.39, 53.53], [-2.34, 53.56])
    return {
      geojson: { type: 'FeatureCollection', features: [] },
      bounds: fallbackBounds,
      center: [-2.365, 53.545],
      maxBounds: fallbackBounds
    }
  }
}

/**
 * Synchronous version that returns cached data or fallback
 */
export function getBoundaryConfig(): BoundaryConfig {
  if (boundaryCache) {
    return boundaryCache
  }

  // Return fallback if not loaded yet
  const fallbackBounds = new LngLatBounds([-2.39, 53.53], [-2.34, 53.56])
  return {
    geojson: { type: 'FeatureCollection', features: [] },
    bounds: fallbackBounds,
    center: [-2.365, 53.545],
    maxBounds: fallbackBounds
  }
}

/**
 * Calculate bounding box from GeoJSON
 */
function calculateBounds(geojson: GeoJSON.FeatureCollection): LngLatBounds {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  
  geojson.features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates[0].forEach(coord => {
        const [lng, lat] = coord
        minLng = Math.min(minLng, lng)
        minLat = Math.min(minLat, lat)
        maxLng = Math.max(maxLng, lng)
        maxLat = Math.max(maxLat, lat)
      })
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => {
        polygon[0].forEach(coord => {
          const [lng, lat] = coord
          minLng = Math.min(minLng, lng)
          minLat = Math.min(minLat, lat)
          maxLng = Math.max(maxLng, lng)
          maxLat = Math.max(maxLat, lat)
        })
      })
    }
  })
  
  return new LngLatBounds([minLng, minLat], [maxLng, maxLat])
}

/**
 * Check if a point is inside the boundary polygon
 */
export function isPointInBoundary(lng: number, lat: number): boolean {
  const geojson = getBoundaryConfig().geojson
  
  for (const feature of geojson.features) {
    if (feature.geometry.type === 'Polygon') {
      if (pointInPolygon([lng, lat], feature.geometry.coordinates[0])) {
        return true
      }
    } else if (feature.geometry.type === 'MultiPolygon') {
      for (const polygon of feature.geometry.coordinates) {
        if (pointInPolygon([lng, lat], polygon[0])) {
          return true
        }
      }
    }
  }
  
  return false
}

/**
 * Point-in-polygon algorithm using ray casting
 */
function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  
  return inside
}

/**
 * Get the closest point on the boundary to a given point
 */
export function getClosestBoundaryPoint(lng: number, lat: number): [number, number] {
  const geojson = getBoundaryConfig().geojson
  let closestPoint: [number, number] = [lng, lat]
  let minDistance = Infinity
  
  for (const feature of geojson.features) {
    if (feature.geometry.type === 'Polygon') {
      const closest = getClosestPointOnPolygon([lng, lat], feature.geometry.coordinates[0])
      const distance = getDistance([lng, lat], closest)
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = closest
      }
    } else if (feature.geometry.type === 'MultiPolygon') {
      for (const polygon of feature.geometry.coordinates) {
        const closest = getClosestPointOnPolygon([lng, lat], polygon[0])
        const distance = getDistance([lng, lat], closest)
        if (distance < minDistance) {
          minDistance = distance
          closestPoint = closest
        }
      }
    }
  }
  
  return closestPoint
}

/**
 * Get closest point on a polygon to a given point
 */
function getClosestPointOnPolygon(point: [number, number], polygon: number[][]): [number, number] {
  let closestPoint: [number, number] = polygon[0] as [number, number]
  let minDistance = Infinity
  
  for (let i = 0; i < polygon.length - 1; i++) {
    const segmentStart = polygon[i] as [number, number]
    const segmentEnd = polygon[i + 1] as [number, number]
    const closest = getClosestPointOnSegment(point, segmentStart, segmentEnd)
    const distance = getDistance(point, closest)
    
    if (distance < minDistance) {
      minDistance = distance
      closestPoint = closest
    }
  }
  
  return closestPoint
}

/**
 * Get closest point on a line segment to a given point
 */
function getClosestPointOnSegment(
  point: [number, number], 
  segmentStart: [number, number], 
  segmentEnd: [number, number]
): [number, number] {
  const [px, py] = point
  const [sx, sy] = segmentStart
  const [ex, ey] = segmentEnd
  
  const dx = ex - sx
  const dy = ey - sy
  
  if (dx === 0 && dy === 0) {
    return segmentStart
  }
  
  const t = Math.max(0, Math.min(1, ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)))
  
  return [sx + t * dx, sy + t * dy]
}

/**
 * Calculate distance between two points
 */
function getDistance(point1: [number, number], point2: [number, number]): number {
  const [x1, y1] = point1
  const [x2, y2] = point2
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/**
 * Validate coordinates and provide user feedback
 */
export interface BoundaryValidationResult {
  isValid: boolean
  message?: string
  suggestedLocation?: [number, number]
}

export function validatePinLocation(lng: number, lat: number): BoundaryValidationResult {
  if (isPointInBoundary(lng, lat)) {
    return { isValid: true }
  }
  
  const closestPoint = getClosestBoundaryPoint(lng, lat)
  
  return {
    isValid: false,
    message: 'Pin location is outside the community boundary. Please place your pin within the highlighted area.',
    suggestedLocation: closestPoint
  }
}

/**
 * Mapbox layer configuration for the boundary
 */
export const BOUNDARY_LAYER_CONFIG = {
  id: 'community-boundary',
  type: 'fill' as const,
  paint: {
    'fill-color': '#10B981',
    'fill-opacity': 0.1
  }
}

export const BOUNDARY_OUTLINE_LAYER_CONFIG = {
  id: 'community-boundary-outline',
  type: 'line' as const,
  paint: {
    'line-color': '#10B981',
    'line-width': 2,
    'line-opacity': 0.8
  }
}
