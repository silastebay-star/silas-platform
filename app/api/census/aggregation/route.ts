import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const aggregationSchema = z.object({
  bbox: z.string(),
  level: z.enum(['tract', 'block', 'county']).default('tract'),
  metrics: z.array(z.string()).min(1),
  aggregation_type: z.enum(['sum', 'average', 'median', 'min', 'max', 'count']).default('average'),
  group_by: z.string().optional(),
  filters: z.record(z.object({
    min: z.number().optional(),
    max: z.number().optional()
  })).optional()
})

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const body = await request.json()
    const { bbox, level, metrics, aggregation_type, group_by, filters } = aggregationSchema.parse(body)

    // Parse bounding box
    const bboxCoords = bbox.split(',').map(Number)
    if (bboxCoords.length !== 4) {
      return NextResponse.json({ error: 'Invalid bbox format' }, { status: 400 })
    }

    // Get census data for the area
    const censusResponse = await fetch(`${request.url.replace('/aggregation', '/data')}?bbox=${bbox}&level=${level}`)
    if (!censusResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch census data' }, { status: 500 })
    }

    const censusData = await censusResponse.json()

    // Apply filters if specified
    let filteredData = censusData
    if (filters) {
      filteredData = censusData.filter((item: any) => {
        return Object.entries(filters).every(([metric, range]) => {
          const value = item.properties[metric]
          if (value == null) return true
          
          if (range.min !== undefined && value < range.min) return false
          if (range.max !== undefined && value > range.max) return false
          return true
        })
      })
    }

    // Perform aggregation
    const aggregatedResults: { [key: string]: any } = {}

    if (group_by) {
      // Group by specified field and aggregate within groups
      const groups: { [key: string]: any[] } = {}
      
      filteredData.forEach((item: any) => {
        const groupValue = item.properties[group_by]
        if (!groups[groupValue]) groups[groupValue] = []
        groups[groupValue].push(item)
      })

      Object.entries(groups).forEach(([groupValue, groupData]) => {
        aggregatedResults[groupValue] = {}
        
        metrics.forEach(metric => {
          const values = groupData.map(item => item.properties[metric]).filter(v => v != null)
          aggregatedResults[groupValue][metric] = calculateAggregation(values, aggregation_type)
        })
      })
    } else {
      // Aggregate across all data
      metrics.forEach(metric => {
        const values = filteredData.map((item: any) => item.properties[metric]).filter((v: any) => v != null)
        aggregatedResults[metric] = calculateAggregation(values, aggregation_type)
      })
    }

    // Calculate additional statistics
    const statistics = {
      total_areas: filteredData.length,
      total_population: filteredData.reduce((sum: number, item: any) => sum + (item.properties.population || 0), 0),
      coverage_area: calculateCoverageArea(bboxCoords),
      data_quality: calculateDataQuality(filteredData, metrics)
    }

    // Save aggregation request for analytics
    await supabase
      .from('census_aggregation_requests')
      .insert({
        bbox,
        level,
        metrics,
        aggregation_type,
        group_by,
        filters,
        result_count: filteredData.length,
        requested_at: new Date().toISOString()
      })
      .catch(err => console.error('Failed to log aggregation request:', err))

    return NextResponse.json({
      aggregation: aggregatedResults,
      statistics,
      metadata: {
        bbox,
        level,
        metrics,
        aggregation_type,
        group_by,
        filters_applied: !!filters,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error performing census aggregation:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request parameters', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to perform aggregation' }, { status: 500 })
  }
}

function calculateAggregation(values: number[], type: string): number | null {
  if (values.length === 0) return null

  switch (type) {
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0)
    
    case 'average':
      return values.reduce((sum, val) => sum + val, 0) / values.length
    
    case 'median':
      const sorted = [...values].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid]
    
    case 'min':
      return Math.min(...values)
    
    case 'max':
      return Math.max(...values)
    
    case 'count':
      return values.length
    
    default:
      return values.reduce((sum, val) => sum + val, 0) / values.length
  }
}

function calculateCoverageArea(bbox: number[]): number {
  const [minLng, minLat, maxLng, maxLat] = bbox
  // Rough calculation in square kilometers
  const latDiff = maxLat - minLat
  const lngDiff = maxLng - minLng
  return latDiff * lngDiff * 111 * 111 // Approximate km² conversion
}

function calculateDataQuality(data: any[], metrics: string[]): number {
  if (data.length === 0) return 0

  let totalFields = 0
  let completeFields = 0

  data.forEach(item => {
    metrics.forEach(metric => {
      totalFields++
      if (item.properties[metric] != null) {
        completeFields++
      }
    })
  })

  return totalFields > 0 ? (completeFields / totalFields) * 100 : 0
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bbox = searchParams.get('bbox')
  const level = searchParams.get('level') || 'tract'
  const metric = searchParams.get('metric')

  if (!bbox || !metric) {
    return NextResponse.json({ 
      error: 'bbox and metric parameters are required' 
    }, { status: 400 })
  }

  try {
    // Quick aggregation for single metric
    const censusResponse = await fetch(`${request.url.replace('/aggregation', '/data')}?bbox=${bbox}&level=${level}`)
    if (!censusResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch census data' }, { status: 500 })
    }

    const censusData = await censusResponse.json()
    const values = censusData.map((item: any) => item.properties[metric]).filter((v: any) => v != null)

    if (values.length === 0) {
      return NextResponse.json({ 
        error: `No data available for metric: ${metric}` 
      }, { status: 404 })
    }

    const result = {
      metric,
      count: values.length,
      sum: values.reduce((sum: number, val: number) => sum + val, 0),
      average: values.reduce((sum: number, val: number) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      median: (() => {
        const sorted = [...values].sort((a: number, b: number) => a - b)
        const mid = Math.floor(sorted.length / 2)
        return sorted.length % 2 === 0 
          ? (sorted[mid - 1] + sorted[mid]) / 2 
          : sorted[mid]
      })()
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error performing quick aggregation:', error)
    return NextResponse.json({ error: 'Failed to perform aggregation' }, { status: 500 })
  }
}
