import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Mock census data generator for demonstration
// In production, this would connect to actual census APIs like ONS or US Census Bureau
function generateMockCensusData(bbox: number[], level: string = 'tract') {
  const [minLng, minLat, maxLng, maxLat] = bbox
  const data = []
  
  // Generate grid of census areas based on level
  const gridSize = level === 'tract' ? 0.01 : level === 'block' ? 0.005 : 0.02
  
  for (let lat = minLat; lat < maxLat; lat += gridSize) {
    for (let lng = minLng; lng < maxLng; lng += gridSize) {
      const id = `${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`
      
      // Generate realistic demographic data with some correlation
      const basePopulation = Math.random() * 5000 + 1000
      const populationDensity = basePopulation / (gridSize * gridSize * 111 * 111) // rough km²
      
      // Income correlates with education and housing value
      const educationLevel = Math.random() * 60 + 20 // 20-80%
      const medianIncome = 25000 + (educationLevel * 800) + (Math.random() * 20000)
      const housingValue = medianIncome * (3 + Math.random() * 2) // 3-5x income
      
      // Age and unemployment have some correlation
      const medianAge = 25 + Math.random() * 40
      const unemploymentRate = Math.max(2, 15 - (educationLevel * 0.2) + (Math.random() * 8))
      const povertyRate = Math.max(5, unemploymentRate * 1.5 + (Math.random() * 10))
      
      data.push({
        id,
        geoid: `GB${id}`,
        name: `Census Area ${id}`,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng, lat],
            [lng + gridSize, lat],
            [lng + gridSize, lat + gridSize],
            [lng, lat + gridSize],
            [lng, lat]
          ]]
        },
        properties: {
          population: Math.round(basePopulation),
          population_density: Math.round(populationDensity),
          households: Math.round(basePopulation * 0.4),
          median_income: Math.round(medianIncome),
          median_age: Math.round(medianAge * 10) / 10,
          education_bachelor_plus: Math.round(educationLevel * 10) / 10,
          housing_median_value: Math.round(housingValue),
          unemployment_rate: Math.round(unemploymentRate * 10) / 10,
          poverty_rate: Math.round(povertyRate * 10) / 10,
          commute_time_avg: Math.round(15 + Math.random() * 30),
          households_with_children: Math.round((20 + Math.random() * 40) * 10) / 10,
          senior_population: Math.round((5 + Math.random() * 25) * 10) / 10,
          foreign_born: Math.round((5 + Math.random() * 30) * 10) / 10,
          owner_occupied_housing: Math.round((40 + Math.random() * 40) * 10) / 10,
          median_rent: Math.round(medianIncome * 0.3 / 12),
          vehicles_per_household: Math.round((0.5 + Math.random() * 2) * 10) / 10
        }
      })
    }
  }
  
  return data
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const bbox = searchParams.get('bbox')
  const level = searchParams.get('level') || 'tract'
  const fields = searchParams.get('fields')?.split(',')
  
  if (!bbox) {
    return NextResponse.json({ error: 'bbox parameter is required' }, { status: 400 })
  }

  try {
    // Parse bounding box
    const bboxCoords = bbox.split(',').map(Number)
    if (bboxCoords.length !== 4) {
      return NextResponse.json({ error: 'Invalid bbox format. Expected: minLng,minLat,maxLng,maxLat' }, { status: 400 })
    }

    // Check if area is too large to prevent excessive data
    const [minLng, minLat, maxLng, maxLat] = bboxCoords
    const area = (maxLng - minLng) * (maxLat - minLat)
    
    if (area > 1) { // Roughly 111km x 111km
      return NextResponse.json({ 
        error: 'Requested area too large. Please zoom in for detailed census data.' 
      }, { status: 400 })
    }

    // In production, this would query actual census data sources
    // For now, we'll generate mock data or check if we have cached data
    const supabase = createSupabaseServerClient()
    
    // Try to get cached census data first
    const { data: cachedData, error: cacheError } = await supabase
      .from('census_data_cache')
      .select('*')
      .eq('bbox', bbox)
      .eq('level', level)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours cache
      .single()

    if (cachedData && !cacheError) {
      return NextResponse.json(cachedData.data)
    }

    // Generate or fetch new data
    let censusData = generateMockCensusData(bboxCoords, level)

    // Filter fields if specified
    if (fields) {
      censusData = censusData.map(item => ({
        ...item,
        properties: Object.fromEntries(
          Object.entries(item.properties).filter(([key]) => 
            fields.includes(key) || ['population', 'households'].includes(key) // Always include basic fields
          )
        )
      }))
    }

    // Cache the data
    await supabase
      .from('census_data_cache')
      .upsert({
        bbox,
        level,
        data: censusData,
        created_at: new Date().toISOString()
      })
      .catch(err => console.error('Failed to cache census data:', err))

    // Log the request for analytics
    await supabase
      .from('census_data_requests')
      .insert({
        bbox,
        level,
        fields: fields?.join(','),
        result_count: censusData.length,
        requested_at: new Date().toISOString()
      })
      .catch(err => console.error('Failed to log census request:', err))

    return NextResponse.json(censusData)

  } catch (error) {
    console.error('Error fetching census data:', error)
    return NextResponse.json({ error: 'Failed to fetch census data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { bbox, level, analysis_type, parameters } = body

    if (!bbox || !analysis_type) {
      return NextResponse.json({ 
        error: 'bbox and analysis_type are required' 
      }, { status: 400 })
    }

    // Perform custom analysis on census data
    const bboxCoords = bbox.split(',').map(Number)
    const censusData = generateMockCensusData(bboxCoords, level)

    let analysisResult = {}

    switch (analysis_type) {
      case 'demographic_summary':
        analysisResult = {
          total_population: censusData.reduce((sum, d) => sum + d.properties.population, 0),
          average_age: censusData.reduce((sum, d) => sum + d.properties.median_age, 0) / censusData.length,
          education_rate: censusData.reduce((sum, d) => sum + d.properties.education_bachelor_plus, 0) / censusData.length,
          diversity_index: Math.random() * 0.8 + 0.1 // Mock diversity calculation
        }
        break

      case 'economic_analysis':
        const incomes = censusData.map(d => d.properties.median_income)
        analysisResult = {
          median_income: incomes.sort((a, b) => a - b)[Math.floor(incomes.length / 2)],
          income_inequality: Math.max(...incomes) / Math.min(...incomes),
          unemployment_rate: censusData.reduce((sum, d) => sum + d.properties.unemployment_rate, 0) / censusData.length,
          poverty_rate: censusData.reduce((sum, d) => sum + d.properties.poverty_rate, 0) / censusData.length
        }
        break

      case 'housing_analysis':
        const housingValues = censusData.map(d => d.properties.housing_median_value)
        analysisResult = {
          median_housing_value: housingValues.sort((a, b) => a - b)[Math.floor(housingValues.length / 2)],
          affordability_ratio: censusData.reduce((sum, d) => sum + (d.properties.housing_median_value / d.properties.median_income), 0) / censusData.length,
          owner_occupied_rate: censusData.reduce((sum, d) => sum + d.properties.owner_occupied_housing, 0) / censusData.length
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
    }

    // Save analysis result
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('census_analysis_results')
      .insert({
        user_id: user.id,
        bbox,
        level,
        analysis_type,
        parameters,
        result: analysisResult,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving analysis:', saveError)
    }

    return NextResponse.json({
      analysis_id: savedAnalysis?.id,
      result: analysisResult,
      data_points: censusData.length,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error performing census analysis:', error)
    return NextResponse.json({ error: 'Failed to perform analysis' }, { status: 500 })
  }
}
