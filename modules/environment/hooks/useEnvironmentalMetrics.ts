/**
 * Hook for managing environmental metrics
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/error-handling'
import { useFeedback } from '@/lib/user-feedback'
import type { 
  EnvironmentalMetric, 
  CreateEnvironmentalMetricData, 
  UpdateEnvironmentalMetricData, 
  EnvironmentalFilters,
  EnvironmentMetrics 
} from '../types'

export function useEnvironmentalMetrics(filters?: EnvironmentalFilters) {
  const [metrics, setMetrics] = useState<EnvironmentalMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [environmentMetrics, setEnvironmentMetrics] = useState<EnvironmentMetrics | null>(null)
  const feedback = useFeedback()

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('environmental_metrics')
        .select(`
          *,
          category_info:environmental_categories!inner(id, name, color, icon, unit, target_value, target_direction)
        `, { count: 'exact' })

      // Apply filters
      if (filters?.metric_type?.length) {
        query = query.in('metric_type', filters.metric_type)
      }
      if (filters?.verified !== undefined) {
        query = query.eq('verified', filters.verified)
      }
      if (filters?.quality_score_min) {
        query = query.gte('quality_score', filters.quality_score_min)
      }
      if (filters?.date_from) {
        query = query.gte('recorded_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('recorded_at', filters.date_to)
      }
      if (filters?.source?.length) {
        query = query.in('source', filters.source)
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'recorded_at'
      const sortOrder = filters?.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      // Enhance metrics with computed fields
      const enhancedMetrics = (data || []).map(enhanceMetric)
      
      setMetrics(enhancedMetrics)
      setTotalCount(count || 0)

      // Fetch environment metrics if no filters applied (for dashboard)
      if (!filters || Object.keys(filters).length === 0) {
        await fetchEnvironmentMetrics()
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch environmental metrics'
      setError(errorMessage)
      handleError(err as Error, 'useEnvironmentalMetrics.fetchMetrics')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchEnvironmentMetrics = useCallback(async () => {
    try {
      // Get environment statistics
      const { data: envStats, error: statsError } = await supabase
        .rpc('get_environment_metrics')

      if (statsError) {
        console.warn('Failed to fetch environment metrics:', statsError)
        return
      }

      setEnvironmentMetrics(envStats)
    } catch (err) {
      console.warn('Error fetching environment metrics:', err)
    }
  }, [])

  const createMetric = useCallback(async (metricData: CreateEnvironmentalMetricData) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('environmental_metrics')
        .insert([{
          ...metricData,
          verified: false,
          location: metricData.latitude && metricData.longitude 
            ? `POINT(${metricData.longitude} ${metricData.latitude})`
            : null
        }])
        .select(`
          *,
          category_info:environmental_categories!inner(id, name, color, icon, unit, target_value, target_direction)
        `)
        .single()

      if (error) throw error

      const enhancedMetric = enhanceMetric(data)
      setMetrics(prev => [enhancedMetric, ...prev])
      
      feedback.success('Environmental metric recorded successfully!', {
        description: `${data.metric_type}: ${data.value} ${data.unit}`
      })

      return enhancedMetric
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record metric'
      handleError(err as Error, 'useEnvironmentalMetrics.createMetric')
      feedback.error('Failed to record metric', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const updateMetric = useCallback(async (id: string, updates: UpdateEnvironmentalMetricData) => {
    try {
      setLoading(true)

      const updateData: any = { ...updates }
      if (updates.latitude && updates.longitude) {
        updateData.location = `POINT(${updates.longitude} ${updates.latitude})`
      }

      const { data, error } = await supabase
        .from('environmental_metrics')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          category_info:environmental_categories!inner(id, name, color, icon, unit, target_value, target_direction)
        `)
        .single()

      if (error) throw error

      const enhancedMetric = enhanceMetric(data)
      setMetrics(prev => prev.map(m => m.id === id ? enhancedMetric : m))
      
      feedback.success('Metric updated successfully')
      return enhancedMetric
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update metric'
      handleError(err as Error, 'useEnvironmentalMetrics.updateMetric')
      feedback.error('Failed to update metric', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const deleteMetric = useCallback(async (id: string) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('environmental_metrics')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMetrics(prev => prev.filter(m => m.id !== id))
      feedback.success('Metric deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete metric'
      handleError(err as Error, 'useEnvironmentalMetrics.deleteMetric')
      feedback.error('Failed to delete metric', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  useEffect(() => {
    fetchMetrics()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('environmental_metrics_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'environmental_metrics' },
        () => {
          fetchMetrics()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchMetrics])

  return {
    metrics,
    loading,
    error,
    totalCount,
    environmentMetrics,
    createMetric,
    updateMetric,
    deleteMetric,
    refetch: fetchMetrics
  }
}

// Helper function to enhance metrics with computed fields
function enhanceMetric(metric: any): EnvironmentalMetric {
  const categoryInfo = metric.category_info
  let trend: 'improving' | 'declining' | 'stable' = 'stable'
  let comparisonToTarget: 'above' | 'below' | 'on_target' = 'on_target'
  
  if (categoryInfo?.target_value && categoryInfo?.target_direction) {
    const targetValue = categoryInfo.target_value
    const currentValue = metric.value
    const direction = categoryInfo.target_direction
    
    if (direction === 'increase') {
      comparisonToTarget = currentValue >= targetValue ? 'on_target' : 'below'
    } else if (direction === 'decrease') {
      comparisonToTarget = currentValue <= targetValue ? 'on_target' : 'above'
    } else {
      const tolerance = targetValue * 0.1 // 10% tolerance
      comparisonToTarget = Math.abs(currentValue - targetValue) <= tolerance ? 'on_target' : 
        currentValue > targetValue ? 'above' : 'below'
    }
  }
  
  return {
    ...metric,
    trend,
    comparison_to_target: comparisonToTarget
  }
}
