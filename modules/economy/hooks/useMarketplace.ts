/**
 * Hook for managing marketplace items
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/error-handling'
import { useFeedback } from '@/lib/user-feedback'
import type { 
  MarketplaceItem, 
  CreateMarketplaceItemData, 
  UpdateMarketplaceItemData, 
  MarketplaceFilters 
} from '../types'

export function useMarketplace(filters?: MarketplaceFilters) {
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const feedback = useFeedback()

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('marketplace_items')
        .select(`
          *,
          seller_profile:seller_id(id, name, avatar_url),
          business:business_id(id, name, verified)
        `, { count: 'exact' })

      // Apply filters
      if (filters?.category?.length) {
        query = query.in('category', filters.category)
      }
      if (filters?.price_min !== undefined) {
        query = query.gte('price', filters.price_min)
      }
      if (filters?.price_max !== undefined) {
        query = query.lte('price', filters.price_max)
      }
      if (filters?.condition?.length) {
        query = query.in('condition', filters.condition)
      }
      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      } else {
        // Default to available items only
        query = query.eq('status', 'available')
      }
      if (filters?.seller_id) {
        query = query.eq('seller_id', filters.seller_id)
      }
      if (filters?.business_id) {
        query = query.eq('business_id', filters.business_id)
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

      setItems(data || [])
      setTotalCount(count || 0)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch marketplace items'
      setError(errorMessage)
      handleError(err as Error, 'useMarketplace.fetchItems')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const createItem = useCallback(async (itemData: CreateMarketplaceItemData) => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        feedback.authRequired()
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('marketplace_items')
        .insert([{
          ...itemData,
          seller_id: user.id,
          status: 'available',
          currency: itemData.currency || 'GBP',
          images: itemData.images || [],
          tags: itemData.tags || [],
          delivery_options: itemData.delivery_options || []
        }])
        .select(`
          *,
          seller_profile:seller_id(id, name, avatar_url),
          business:business_id(id, name, verified)
        `)
        .single()

      if (error) throw error

      setItems(prev => [data, ...prev])
      
      feedback.success('Item listed successfully!', {
        description: `"${data.title}" is now available in the marketplace`
      })

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create marketplace item'
      handleError(err as Error, 'useMarketplace.createItem')
      feedback.error('Failed to list item', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const updateItem = useCallback(async (id: string, updates: UpdateMarketplaceItemData) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('marketplace_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          seller_profile:seller_id(id, name, avatar_url),
          business:business_id(id, name, verified)
        `)
        .single()

      if (error) throw error

      setItems(prev => prev.map(item => item.id === id ? data : item))
      
      feedback.success('Item updated successfully')
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item'
      handleError(err as Error, 'useMarketplace.updateItem')
      feedback.error('Failed to update item', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  const deleteItem = useCallback(async (id: string) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      setItems(prev => prev.filter(item => item.id !== id))
      feedback.success('Item removed from marketplace')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item'
      handleError(err as Error, 'useMarketplace.deleteItem')
      feedback.error('Failed to remove item', { description: errorMessage })
      throw err
    } finally {
      setLoading(false)
    }
  }, [feedback])

  useEffect(() => {
    fetchItems()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('marketplace_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'marketplace_items' },
        () => {
          fetchItems()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchItems])

  return {
    items,
    loading,
    error,
    totalCount,
    createItem,
    updateItem,
    deleteItem,
    refetch: fetchItems
  }
}
