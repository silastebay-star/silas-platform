/**
 * Pin Service
 * Complete CRUD operations for pins with backend integration
 */

import { createSupabaseClient, withSupabaseErrorHandling, SupabaseError, uploadFile, getPublicUrl } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export type PinCategory = 'community' | 'projects' | 'events' | 'economy' | 'environment' | 'safety' | 'faith' | 'data_ai'
export type PinStatus = 'active' | 'pending' | 'archived' | 'flagged'

export interface Pin {
  id: string
  title: string
  description: string | null
  category: PinCategory
  status: PinStatus
  location: { lat: number; lng: number }
  address: string | null
  images: string[]
  tags: string[]
  metadata: Record<string, any>
  like_count: number
  comment_count: number
  view_count: number
  is_featured: boolean
  expires_at: string | null
  created_by: string | null
  group_id: string | null
  created_at: string
  updated_at: string
  // Joined data
  creator?: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
  }
  group?: {
    id: string
    name: string
    slug: string
    avatar_url: string | null
  }
  user_has_liked?: boolean
}

export interface CreatePinData {
  title: string
  description?: string
  category: PinCategory
  location: { lat: number; lng: number }
  address?: string
  images?: File[]
  tags?: string[]
  metadata?: Record<string, any>
  expires_at?: string
  group_id?: string
}

export interface UpdatePinData {
  title?: string
  description?: string
  category?: PinCategory
  location?: { lat: number; lng: number }
  address?: string
  tags?: string[]
  metadata?: Record<string, any>
  expires_at?: string
  status?: PinStatus
}

export interface PinFilters {
  category?: PinCategory[]
  status?: PinStatus[]
  group_id?: string
  created_by?: string
  search?: string
  tags?: string[]
  location?: {
    center: { lat: number; lng: number }
    radius: number // in kilometers
  }
  date_range?: {
    start: string
    end: string
  }
}

export interface PaginationOptions {
  page?: number
  limit?: number
  order_by?: 'created_at' | 'updated_at' | 'like_count' | 'comment_count' | 'view_count'
  ascending?: boolean
}

class PinService {
  private supabase = createSupabaseClient()

  // Create a new pin
  async createPin(data: CreatePinData): Promise<Pin> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Upload images if provided
      let imageUrls: string[] = []
      if (data.images && data.images.length > 0) {
        imageUrls = await this.uploadPinImages(data.images)
      }

      // Validate location is within allowed boundaries (example: UK bounds)
      if (!this.isLocationValid(data.location)) {
        throw new SupabaseError('Pin location is outside allowed boundaries')
      }

      // Check for nearby pins to prevent spam
      const nearbyPins = await this.getNearbyPins(data.location, 0.1) // 100m radius
      if (nearbyPins.length > 5) {
        throw new SupabaseError('Too many pins in this area. Please choose a different location.')
      }

      const pinData = {
        title: data.title,
        description: data.description || null,
        category: data.category,
        location: `POINT(${data.location.lng} ${data.location.lat})`,
        address: data.address || null,
        images: imageUrls,
        tags: data.tags || [],
        metadata: data.metadata || {},
        expires_at: data.expires_at || null,
        group_id: data.group_id || null,
        created_by: user.id
      }

      const { data: pin, error } = await (this.supabase
        .from('pins') as any)
        .insert(pinData)
        .select(`
          *,
          creator:users!created_by(id, full_name, username, avatar_url),
          group:groups(id, name, slug, avatar_url)
        `)
        .single()

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      // Create activity entry
      await (this.supabase as any).rpc('create_activity', {
        user_id: user.id,
        activity_type: 'pin_created',
        activity_data: {
          pin_id: pin.id,
          pin_title: pin.title,
          category: pin.category
        }
      })

      return this.transformPin(pin)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to create pin')
    }
  }

  // Get pin by ID
  async getPin(id: string, userId?: string): Promise<Pin | null> {
    try {
      let query = this.supabase
        .from('pins')
        .select(`
          *,
          creator:users!created_by(id, full_name, username, avatar_url),
          group:groups(id, name, slug, avatar_url)
        `)
        .eq('id', id)

      // Add user-specific data if authenticated
      if (userId) {
        query = (query as any).select(`
          *,
          creator:users!created_by(id, full_name, username, avatar_url),
          group:groups(id, name, slug, avatar_url),
          user_has_liked:pin_likes!inner(user_id)
        `)
      }

      const { data: pin, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Pin not found
        }
        throw new SupabaseError(error.message, error.code)
      }

      // Increment view count
      await this.incrementViewCount(id)

      return this.transformPin(pin)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to get pin')
    }
  }

  // Get pins with filters and pagination
  async getPins(
    filters: PinFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ pins: Pin[]; total: number; hasMore: boolean }> {
    try {
      const { page = 1, limit = 20, order_by = 'created_at', ascending = false } = pagination
      const offset = (page - 1) * limit

      let query = this.supabase
        .from('pins')
        .select(`
          *,
          creator:users!created_by(id, full_name, username, avatar_url),
          group:groups(id, name, slug, avatar_url)
        `, { count: 'exact' })

      // Apply filters
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category)
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', 'active') // Default to active pins
      }

      if (filters.group_id) {
        query = query.eq('group_id', filters.group_id)
      }

      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end)
      }

      // Apply location filter if provided
      if (filters.location) {
        // Use PostGIS function for spatial queries
        query = (query as any).rpc('pins_within_radius', {
          center_lat: filters.location.center.lat,
          center_lng: filters.location.center.lng,
          radius_km: filters.location.radius
        })
      }

      // Apply ordering and pagination
      query = query
        .order(order_by, { ascending })
        .range(offset, offset + limit - 1)

      const { data: pins, error, count } = await query

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      const total = count || 0
      const hasMore = offset + limit < total

      return {
        pins: pins?.map(pin => this.transformPin(pin)) || [],
        total,
        hasMore
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to get pins')
    }
  }

  // Update pin
  async updatePin(id: string, data: UpdatePinData): Promise<Pin> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Check if user can update this pin
      const existingPin = await this.getPin(id)
      if (!existingPin) {
        throw new SupabaseError('Pin not found')
      }

      const canUpdate = existingPin.created_by === user.id || 
                       await this.userCanModeratePin(user.id, existingPin)

      if (!canUpdate) {
        throw new SupabaseError('You do not have permission to update this pin')
      }

      const updateData: any = { ...data }

      // Handle location update
      if (data.location) {
        if (!this.isLocationValid(data.location)) {
          throw new SupabaseError('Pin location is outside allowed boundaries')
        }
        updateData.location = `POINT(${data.location.lng} ${data.location.lat})`
      }

      const { data: pin, error } = await (this.supabase
        .from('pins') as any)
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          creator:users!created_by(id, full_name, username, avatar_url),
          group:groups(id, name, slug, avatar_url)
        `)
        .single()

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      return this.transformPin(pin)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to update pin')
    }
  }

  // Delete pin
  async deletePin(id: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Check if user can delete this pin
      const existingPin = await this.getPin(id)
      if (!existingPin) {
        throw new SupabaseError('Pin not found')
      }

      const canDelete = existingPin.created_by === user.id || 
                       await this.userCanModeratePin(user.id, existingPin)

      if (!canDelete) {
        throw new SupabaseError('You do not have permission to delete this pin')
      }

      // Delete associated images
      if (existingPin.images.length > 0) {
        await this.deletePinImages(existingPin.images)
      }

      const { error } = await this.supabase
        .from('pins')
        .delete()
        .eq('id', id)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to delete pin')
    }
  }

  // Like/unlike pin
  async togglePinLike(pinId: string): Promise<{ liked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Check if already liked
      const { data: existingLike } = await this.supabase
        .from('pin_likes')
        .select('id')
        .eq('pin_id', pinId)
        .eq('user_id', user.id)
        .single()

      if (existingLike) {
        // Unlike
        const { error } = await this.supabase
          .from('pin_likes')
          .delete()
          .eq('pin_id', pinId)
          .eq('user_id', user.id)

        if (error) {
          throw new SupabaseError(error.message, error.code)
        }

        // Get updated like count
        const { data: pin } = await this.supabase
          .from('pins')
          .select('like_count')
          .eq('id', pinId)
          .single()

        return { liked: false, likeCount: (pin as any)?.like_count || 0 }
      } else {
        // Like
        const { error } = await (this.supabase
          .from('pin_likes') as any)
          .insert({ pin_id: pinId, user_id: user.id })

        if (error) {
          throw new SupabaseError(error.message, error.code)
        }

        // Get updated like count
        const { data: pin } = await this.supabase
          .from('pins')
          .select('like_count')
          .eq('id', pinId)
          .single()

        // Create notification for pin creator
        const pinData = await this.getPin(pinId)
        if (pinData && pinData.created_by && pinData.created_by !== user.id) {
          await (this.supabase as any).rpc('create_notification', {
            target_user_id: pinData.created_by,
            notification_type: 'pin_liked',
            title: 'Someone liked your pin',
            message: `Your pin "${pinData.title}" received a new like`,
            data: { pin_id: pinId, liker_id: user.id }
          })
        }

        return { liked: true, likeCount: (pin as any)?.like_count || 0 }
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to toggle pin like')
    }
  }

  // Helper methods
  private async uploadPinImages(files: File[]): Promise<string[]> {
    const urls: string[] = []
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `pins/${fileName}`

      await uploadFile(this.supabase, 'pin-images', filePath, file)
      const publicUrl = getPublicUrl(this.supabase, 'pin-images', filePath)
      urls.push(publicUrl)
    }

    return urls
  }

  private async deletePinImages(imageUrls: string[]): Promise<void> {
    const filePaths = imageUrls.map(url => {
      const urlObj = new URL(url)
      return urlObj.pathname.split('/').slice(-2).join('/')
    })

    await this.supabase.storage
      .from('pin-images')
      .remove(filePaths)
  }

  private isLocationValid(location: { lat: number; lng: number }): boolean {
    // Example: Check if location is within UK bounds
    const UK_BOUNDS = {
      north: 60.9,
      south: 49.8,
      east: 2.0,
      west: -8.2
    }

    return location.lat >= UK_BOUNDS.south && 
           location.lat <= UK_BOUNDS.north &&
           location.lng >= UK_BOUNDS.west && 
           location.lng <= UK_BOUNDS.east
  }

  private async getNearbyPins(location: { lat: number; lng: number }, radiusKm: number): Promise<Pin[]> {
    const { data } = await (this.supabase as any).rpc('pins_within_radius', {
      center_lat: location.lat,
      center_lng: location.lng,
      radius_km: radiusKm
    })

    return data || []
  }

  private async userCanModeratePin(userId: string, pin: Pin): Promise<boolean> {
    // Check if user is admin/moderator or group moderator
    const { data: user } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if ((user as any)?.role === 'admin' || (user as any)?.role === 'moderator') {
      return true
    }

    // Check if user is group moderator for this pin's group
    if (pin.group_id) {
      const { data: membership } = await this.supabase
        .from('group_memberships')
        .select('role')
        .eq('group_id', pin.group_id)
        .eq('user_id', userId)
        .single()

      return (membership as any)?.role === 'admin' || (membership as any)?.role === 'moderator'
    }

    return false
  }

  private async incrementViewCount(pinId: string): Promise<void> {
    await (this.supabase
      .from('pins') as any)
      .update({ view_count: 1 } as any)
      .eq('id', pinId)
  }

  private transformPin(pin: any): Pin {
    // Transform PostGIS location to lat/lng
    let location = { lat: 0, lng: 0 }
    if (pin.location) {
      // Parse PostGIS POINT format
      const match = pin.location.match(/POINT\(([^)]+)\)/)
      if (match) {
        const [lng, lat] = match[1].split(' ').map(Number)
        location = { lat, lng }
      }
    }

    return {
      ...pin,
      location,
      creator: pin.creator,
      group: pin.group,
      user_has_liked: !!pin.user_has_liked
    }
  }
}

export const pinService = new PinService()
export default pinService
