import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Mock environmental data - in production, this would connect to real sensors/APIs
function generateEnvironmentalMetrics(lat?: number, lng?: number) {
  const baseMetrics = [
    {
      id: 'air-quality-index',
      name: 'Air Quality Index',
      value: Math.round(Math.random() * 100 + 20),
      unit: 'AQI',
      target: 50,
      trend: Math.random() > 0.5 ? 'improving' : 'stable',
      last_updated: new Date().toISOString(),
      source: 'Local Air Quality Monitor',
      category: 'air'
    },
    {
      id: 'pm25-concentration',
      name: 'PM2.5 Concentration',
      value: Math.round(Math.random() * 25 + 5),
      unit: 'μg/m³',
      target: 15,
      trend: Math.random() > 0.3 ? 'improving' : 'declining',
      last_updated: new Date().toISOString(),
      source: 'Environmental Sensor Network',
      category: 'air'
    },
    {
      id: 'water-quality',
      name: 'Water Quality Index',
      value: Math.round(Math.random() * 40 + 60),
      unit: 'WQI',
      target: 80,
      trend: 'stable',
      last_updated: new Date().toISOString(),
      source: 'Water Treatment Plant',
      category: 'water'
    },
    {
      id: 'renewable-energy',
      name: 'Renewable Energy Usage',
      value: Math.round(Math.random() * 30 + 50),
      unit: '%',
      target: 80,
      trend: 'improving',
      last_updated: new Date().toISOString(),
      source: 'Energy Grid Monitor',
      category: 'energy'
    },
    {
      id: 'waste-diversion',
      name: 'Waste Diversion Rate',
      value: Math.round(Math.random() * 20 + 70),
      unit: '%',
      target: 85,
      trend: 'improving',
      last_updated: new Date().toISOString(),
      source: 'Waste Management System',
      category: 'waste'
    },
    {
      id: 'carbon-emissions',
      name: 'Carbon Emissions',
      value: Math.round(Math.random() * 5 + 8),
      unit: 'tCO₂e/capita',
      target: 6,
      trend: 'declining',
      last_updated: new Date().toISOString(),
      source: 'Carbon Tracking System',
      category: 'carbon'
    },
    {
      id: 'tree-coverage',
      name: 'Tree Coverage',
      value: Math.round(Math.random() * 15 + 25),
      unit: '%',
      target: 40,
      trend: 'improving',
      last_updated: new Date().toISOString(),
      source: 'Satellite Imagery Analysis',
      category: 'biodiversity'
    },
    {
      id: 'noise-level',
      name: 'Average Noise Level',
      value: Math.round(Math.random() * 20 + 45),
      unit: 'dB',
      target: 55,
      trend: 'stable',
      last_updated: new Date().toISOString(),
      source: 'Noise Monitoring Network',
      category: 'air'
    }
  ]

  // Adjust values based on location if provided
  if (lat && lng) {
    // Simulate location-based variations
    const locationFactor = Math.sin(lat * 0.1) * Math.cos(lng * 0.1)
    baseMetrics.forEach(metric => {
      metric.value = Math.max(0, Math.round(metric.value + (locationFactor * 10)))
    })
  }

  return baseMetrics
}

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined
  const category = searchParams.get('category')
  const timeframe = searchParams.get('timeframe') || '24h'

  try {
    // In production, this would query real environmental data sources
    // For now, we'll check if we have cached data and generate mock data
    
    const cacheKey = `env_metrics_${lat}_${lng}_${category}_${timeframe}`
    
    // Try to get cached data
    const { data: cachedData } = await supabase
      .from('environmental_data_cache')
      .select('data, created_at')
      .eq('cache_key', cacheKey)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // 1 hour cache
      .single()

    if (cachedData) {
      return NextResponse.json(cachedData.data)
    }

    // Generate new data
    let metrics = generateEnvironmentalMetrics(lat, lng)

    // Filter by category if specified
    if (category) {
      metrics = metrics.filter(metric => metric.category === category)
    }

    // Cache the data
    await supabase
      .from('environmental_data_cache')
      .upsert({
        cache_key: cacheKey,
        data: metrics,
        location: lat && lng ? `POINT(${lng} ${lat})` : null,
        created_at: new Date().toISOString()
      })
      .catch(err => console.error('Failed to cache environmental data:', err))

    // Log the request
    await supabase
      .from('environmental_data_requests')
      .insert({
        location: lat && lng ? `POINT(${lng} ${lat})` : null,
        category,
        timeframe,
        metrics_count: metrics.length,
        requested_at: new Date().toISOString()
      })
      .catch(err => console.error('Failed to log environmental request:', err))

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Error fetching environmental metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch environmental metrics' }, { status: 500 })
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
    const { metric_id, value, location, source, notes } = body

    if (!metric_id || value === undefined) {
      return NextResponse.json({ 
        error: 'metric_id and value are required' 
      }, { status: 400 })
    }

    // Record user-submitted environmental data
    const { data: submission, error } = await supabase
      .from('environmental_submissions')
      .insert([{
        user_id: user.id,
        metric_id,
        value,
        location: location ? `POINT(${location.lng} ${location.lat})` : null,
        source: source || 'User Submission',
        notes,
        status: 'pending_verification',
        submitted_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error submitting environmental data:', error)
      return NextResponse.json({ error: 'Failed to submit data' }, { status: 500 })
    }

    // Create notification for environmental moderators
    const { data: moderators } = await supabase
      .from('users')
      .select('id')
      .or('role.eq.admin,role.eq.environmental_moderator')

    if (moderators) {
      const notifications = moderators.map(mod => ({
        user_id: mod.id,
        type: 'environmental_data_submission',
        title: 'New Environmental Data Submission',
        message: `User submitted data for ${metric_id}`,
        data: {
          submission_id: submission.id,
          metric_id,
          submitter_id: user.id
        }
      }))

      await supabase
        .from('notifications')
        .insert(notifications)
        .catch(err => console.error('Failed to send notifications:', err))
    }

    return NextResponse.json({
      submission_id: submission.id,
      status: 'submitted',
      message: 'Data submitted for verification'
    }, { status: 201 })

  } catch (error) {
    console.error('Error submitting environmental data:', error)
    return NextResponse.json({ error: 'Failed to submit data' }, { status: 500 })
  }
}
