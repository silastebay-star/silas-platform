import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const comparisonSchema = z.object({
  areas: z.array(z.object({
    id: z.string(),
    name: z.string(),
    bbox: z.string()
  })).min(2).max(5),
  metrics: z.array(z.string()).min(1),
  level: z.enum(['tract', 'block', 'county']).default('tract'),
  comparison_type: z.enum(['absolute', 'relative', 'percentile']).default('absolute')
})

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const body = await request.json()
    const { areas, metrics, level, comparison_type } = comparisonSchema.parse(body)

    // Fetch data for each area
    const areaData: { [key: string]: any } = {}
    
    for (const area of areas) {
      try {
        const censusResponse = await fetch(`${request.url.replace('/comparison', '/data')}?bbox=${area.bbox}&level=${level}`)
        if (censusResponse.ok) {
          const data = await censusResponse.json()
          areaData[area.id] = {
            ...area,
            data,
            aggregated: aggregateAreaData(data, metrics)
          }
        }
      } catch (error) {
        console.error(`Error fetching data for area ${area.id}:`, error)
        areaData[area.id] = {
          ...area,
          data: [],
          aggregated: {},
          error: 'Failed to fetch data'
        }
      }
    }

    // Perform comparison analysis
    const comparison = performComparison(areaData, metrics, comparison_type)
    const rankings = calculateRankings(areaData, metrics)
    const insights = generateComparisonInsights(areaData, metrics)

    // Save comparison request
    await supabase
      .from('census_comparison_requests')
      .insert({
        areas: areas.map(a => ({ id: a.id, name: a.name })),
        metrics,
        level,
        comparison_type,
        result_summary: comparison.summary,
        requested_at: new Date().toISOString()
      })
      .catch(err => console.error('Failed to log comparison request:', err))

    return NextResponse.json({
      comparison,
      rankings,
      insights,
      metadata: {
        areas_compared: areas.length,
        metrics_analyzed: metrics.length,
        comparison_type,
        level,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error performing census comparison:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request parameters', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to perform comparison' }, { status: 500 })
  }
}

function aggregateAreaData(data: any[], metrics: string[]): { [key: string]: number } {
  const aggregated: { [key: string]: number } = {}
  
  metrics.forEach(metric => {
    const values = data.map(item => item.properties[metric]).filter(v => v != null)
    if (values.length > 0) {
      aggregated[metric] = values.reduce((sum, val) => sum + val, 0) / values.length
    }
  })

  // Add derived metrics
  aggregated.total_population = data.reduce((sum, item) => sum + (item.properties.population || 0), 0)
  aggregated.area_count = data.length

  return aggregated
}

function performComparison(areaData: { [key: string]: any }, metrics: string[], type: string) {
  const comparison: { [key: string]: any } = {
    by_metric: {},
    summary: {}
  }

  metrics.forEach(metric => {
    const metricComparison: { [key: string]: any } = {}
    const values: { [key: string]: number } = {}

    // Collect values for this metric
    Object.entries(areaData).forEach(([areaId, area]) => {
      if (area.aggregated[metric] != null) {
        values[areaId] = area.aggregated[metric]
      }
    })

    const valueArray = Object.values(values)
    if (valueArray.length === 0) {
      metricComparison.error = 'No data available'
      comparison.by_metric[metric] = metricComparison
      return
    }

    const min = Math.min(...valueArray)
    const max = Math.max(...valueArray)
    const avg = valueArray.reduce((sum, val) => sum + val, 0) / valueArray.length

    switch (type) {
      case 'absolute':
        Object.entries(values).forEach(([areaId, value]) => {
          metricComparison[areaId] = {
            value,
            difference_from_avg: value - avg,
            difference_from_min: value - min,
            difference_from_max: value - max
          }
        })
        break

      case 'relative':
        Object.entries(values).forEach(([areaId, value]) => {
          metricComparison[areaId] = {
            value,
            relative_to_avg: avg > 0 ? ((value - avg) / avg) * 100 : 0,
            relative_to_min: min > 0 ? ((value - min) / min) * 100 : 0,
            relative_to_max: max > 0 ? ((value - max) / max) * 100 : 0
          }
        })
        break

      case 'percentile':
        const sorted = valueArray.sort((a, b) => a - b)
        Object.entries(values).forEach(([areaId, value]) => {
          const rank = sorted.findIndex(v => v >= value) + 1
          const percentile = (rank / sorted.length) * 100
          metricComparison[areaId] = {
            value,
            percentile,
            rank: rank,
            total_areas: sorted.length
          }
        })
        break
    }

    metricComparison.statistics = { min, max, avg, range: max - min }
    comparison.by_metric[metric] = metricComparison
  })

  // Generate summary
  comparison.summary = {
    total_areas: Object.keys(areaData).length,
    metrics_compared: metrics.length,
    comparison_type: type
  }

  return comparison
}

function calculateRankings(areaData: { [key: string]: any }, metrics: string[]) {
  const rankings: { [key: string]: any } = {}

  metrics.forEach(metric => {
    const areaValues = Object.entries(areaData)
      .map(([areaId, area]) => ({
        areaId,
        name: area.name,
        value: area.aggregated[metric]
      }))
      .filter(item => item.value != null)
      .sort((a, b) => b.value - a.value) // Descending order

    rankings[metric] = areaValues.map((item, index) => ({
      ...item,
      rank: index + 1,
      percentile: ((areaValues.length - index) / areaValues.length) * 100
    }))
  })

  // Calculate overall ranking (average of all metric rankings)
  const overallRankings: { [key: string]: { total_rank: number, avg_percentile: number } } = {}
  
  Object.keys(areaData).forEach(areaId => {
    let totalRank = 0
    let totalPercentile = 0
    let validMetrics = 0

    metrics.forEach(metric => {
      const ranking = rankings[metric]?.find((r: any) => r.areaId === areaId)
      if (ranking) {
        totalRank += ranking.rank
        totalPercentile += ranking.percentile
        validMetrics++
      }
    })

    if (validMetrics > 0) {
      overallRankings[areaId] = {
        total_rank: totalRank / validMetrics,
        avg_percentile: totalPercentile / validMetrics
      }
    }
  })

  rankings.overall = Object.entries(overallRankings)
    .map(([areaId, ranking]) => ({
      areaId,
      name: areaData[areaId].name,
      avg_rank: ranking.total_rank,
      avg_percentile: ranking.avg_percentile
    }))
    .sort((a, b) => a.avg_rank - b.avg_rank)

  return rankings
}

function generateComparisonInsights(areaData: { [key: string]: any }, metrics: string[]) {
  const insights: any[] = []

  // Find the area with highest population
  const populationData = Object.entries(areaData)
    .map(([areaId, area]) => ({ areaId, name: area.name, population: area.aggregated.total_population }))
    .filter(item => item.population > 0)
    .sort((a, b) => b.population - a.population)

  if (populationData.length > 0) {
    insights.push({
      type: 'population_leader',
      title: 'Largest Population',
      description: `${populationData[0].name} has the largest population with ${populationData[0].population.toLocaleString()} residents.`,
      area_id: populationData[0].areaId
    })
  }

  // Find areas with significant differences
  metrics.forEach(metric => {
    const values = Object.entries(areaData)
      .map(([areaId, area]) => ({ areaId, name: area.name, value: area.aggregated[metric] }))
      .filter(item => item.value != null)

    if (values.length >= 2) {
      const sorted = [...values].sort((a, b) => b.value - a.value)
      const highest = sorted[0]
      const lowest = sorted[sorted.length - 1]
      
      if (highest.value > 0 && lowest.value >= 0) {
        const ratio = highest.value / lowest.value
        if (ratio > 2) { // Significant difference
          insights.push({
            type: 'significant_difference',
            metric,
            title: `Large ${metric.replace('_', ' ')} Gap`,
            description: `${highest.name} has ${ratio.toFixed(1)}x higher ${metric.replace('_', ' ')} than ${lowest.name}.`,
            highest_area: highest.areaId,
            lowest_area: lowest.areaId,
            ratio
          })
        }
      }
    }
  })

  // Find areas that consistently rank high or low
  const consistentPerformers = findConsistentPerformers(areaData, metrics)
  insights.push(...consistentPerformers)

  return insights
}

function findConsistentPerformers(areaData: { [key: string]: any }, metrics: string[]) {
  const insights: any[] = []
  const areaPerformance: { [key: string]: number[] } = {}

  // Calculate percentile for each area in each metric
  metrics.forEach(metric => {
    const values = Object.entries(areaData)
      .map(([areaId, area]) => ({ areaId, value: area.aggregated[metric] }))
      .filter(item => item.value != null)
      .sort((a, b) => a.value - b.value)

    values.forEach((item, index) => {
      const percentile = (index / (values.length - 1)) * 100
      if (!areaPerformance[item.areaId]) areaPerformance[item.areaId] = []
      areaPerformance[item.areaId].push(percentile)
    })
  })

  // Find consistently high or low performers
  Object.entries(areaPerformance).forEach(([areaId, percentiles]) => {
    const avgPercentile = percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length
    const area = areaData[areaId]

    if (avgPercentile >= 80) {
      insights.push({
        type: 'consistent_high_performer',
        title: 'Consistent High Performer',
        description: `${area.name} ranks in the top 20% across most metrics.`,
        area_id: areaId,
        avg_percentile: avgPercentile
      })
    } else if (avgPercentile <= 20) {
      insights.push({
        type: 'consistent_low_performer',
        title: 'Area Needing Attention',
        description: `${area.name} ranks in the bottom 20% across most metrics.`,
        area_id: areaId,
        avg_percentile: avgPercentile
      })
    }
  })

  return insights
}
