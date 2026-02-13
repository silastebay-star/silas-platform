/**
 * Hook for managing sustainability projects
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/error-handling'
import { useFeedback } from '@/lib/user-feedback'
import type { 
  SustainabilityProject, 
  CreateSustainabilityProjectData, 
  UpdateSustainabilityProjectData, 
  ProjectFilters 
} from '../types'

export function useSustainabilityProjects(filters?: ProjectFilters) {
  const [projects, setProjects] = useState<SustainabilityProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const feedback = useFeedback()

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('sustainability_projects')
        .select(`
          *,
          creator_profile:created_by(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address),
          participants:project_participants(
            id,
            role,
            contribution_hours,
            user_profile:user_id(id, name, avatar_url)
          )
        `, { count: 'exact' })

      // Apply filters
      if (filters?.category?.length) {
        query = query.in('category', filters.category)
      }
      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      }
      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority)
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by)
      }
      if (filters?.start_date_from) {
        query = query.gte('start_date', filters.start_date_from)
      }
      if (filters?.start_date_to) {
        query = query.lte('start_date', filters.start_date_to)
      }
      if (filters?.budget_min) {
        query = query.gte('budget', filters.budget_min)
      }
      if (filters?.budget_max) {
        query = query.lte('budget', filters.budget_max)
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'created_at'
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

      // Enhance projects with computed fields
      const enhancedProjects = (data || []).map(enhanceProject)
      
      setProjects(enhancedProjects)
      setTotalCount(count || 0)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sustainability projects'
      setError(errorMessage)
      handleError(err as Error, 'useSustainabilityProjects.fetchProjects')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const createProject = useCallback(async (projectData: CreateSustainabilityProjectData) => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        feedback.authRequired()
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('sustainability_projects')
        .insert([{
          ...projectData,
          created_by: user.id,
          status: 'planning',
          participants_count: 1, // Creator is first participant
          location: projectData.latitude && projectData.longitude 
            ? `POINT(${projectData.longitude} ${projectData.latitude})`
            : null
        }])
        .select(`
          *,
          creator_profile:created_by(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address),
          participants:project_participants(
            id,
            role,
            contribution_hours,
            user_profile:user_id(id, name, avatar_url)
          )
        `)
        .single()

      if (error) throw error

      // Add creator as project leader
      await supabase
        .from('project_participants')
        .insert([{
          project_id: data.id,
          user_id: user.id,
          role: 'leader'
        }])

      const enhancedProject = enhanceProject(data)
      setProjects(prev => [enhancedProject, ...prev])
      
      feedback.success('Sustainability project created successfully!', {
        description: `"${data.title}" is now ready for community participation`
      })

      return enhancedProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project'
      handleError(err as Error, 'useSustainabilityProjects.createProject')
      feedback.error('Failed to create project', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const updateProject = useCallback(async (id: string, updates: UpdateSustainabilityProjectData) => {
    try {
      setLoading(true)

      const updateData: any = { 
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      if (updates.latitude && updates.longitude) {
        updateData.location = `POINT(${updates.longitude} ${updates.latitude})`
      }

      const { data, error } = await supabase
        .from('sustainability_projects')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          creator_profile:created_by(id, name, avatar_url),
          pin_location:pins(id, title, latitude, longitude, address),
          participants:project_participants(
            id,
            role,
            contribution_hours,
            user_profile:user_id(id, name, avatar_url)
          )
        `)
        .single()

      if (error) throw error

      const enhancedProject = enhanceProject(data)
      setProjects(prev => prev.map(p => p.id === id ? enhancedProject : p))
      
      feedback.success('Project updated successfully')
      return enhancedProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project'
      handleError(err as Error, 'useSustainabilityProjects.updateProject')
      feedback.error('Failed to update project', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const deleteProject = useCallback(async (id: string) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('sustainability_projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProjects(prev => prev.filter(p => p.id !== id))
      feedback.success('Project deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project'
      handleError(err as Error, 'useSustainabilityProjects.deleteProject')
      feedback.error('Failed to delete project', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const joinProject = useCallback(async (projectId: string, role: 'participant' | 'volunteer' = 'participant') => {
    try {
      setLoading(true)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        feedback.authRequired()
        throw new Error('Authentication required')
      }

      // Add user as participant
      const { error: participantError } = await supabase
        .from('project_participants')
        .insert([{
          project_id: projectId,
          user_id: user.id,
          role
        }])

      if (participantError) throw participantError

      // Update participant count
      const { error: updateError } = await supabase
        .rpc('increment_project_participants', { project_id: projectId })

      if (updateError) throw updateError

      feedback.success('Successfully joined project!')
      await fetchProjects() // Refresh to get updated data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join project'
      handleError(err as Error, 'useSustainabilityProjects.joinProject')
      feedback.error('Failed to join project', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback, fetchProjects])

  useEffect(() => {
    fetchProjects()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('sustainability_projects_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sustainability_projects' },
        () => {
          fetchProjects()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'project_participants' },
        () => {
          fetchProjects()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProjects])

  return {
    projects,
    loading,
    error,
    totalCount,
    createProject,
    updateProject,
    deleteProject,
    joinProject,
    refetch: fetchProjects
  }
}

// Helper function to enhance projects with computed fields
function enhanceProject(project: any): SustainabilityProject {
  const now = new Date()
  const startDate = project.start_date ? new Date(project.start_date) : null
  const endDate = project.end_date ? new Date(project.end_date) : null
  
  let progressPercentage = 0
  let daysRemaining = 0
  let isOverdue = false
  let budgetUtilization = 0
  
  if (startDate && endDate) {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    progressPercentage = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100)
    daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    isOverdue = now > endDate && project.status !== 'completed'
  }
  
  // Mock budget utilization calculation
  if (project.budget && project.status !== 'planning') {
    budgetUtilization = Math.min(progressPercentage * 0.8, 100) // Assume 80% correlation with progress
  }
  
  return {
    ...project,
    progress_percentage: progressPercentage,
    days_remaining: daysRemaining,
    is_overdue: isOverdue,
    budget_utilization: budgetUtilization
  }
}
