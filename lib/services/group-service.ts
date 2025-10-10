/**
 * Group Service
 * Complete CRUD operations for groups with membership management
 */

import { createSupabaseClient, withSupabaseErrorHandling, SupabaseError, uploadFile, getPublicUrl } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export type GroupRole = 'member' | 'moderator' | 'admin'
export type PinCategory = 'community' | 'projects' | 'events' | 'economy' | 'environment' | 'safety' | 'faith' | 'data_ai'

export interface Group {
  id: string
  name: string
  slug: string
  description: string | null
  category: PinCategory
  avatar_url: string | null
  banner_url: string | null
  is_public: boolean
  is_verified: boolean
  member_count: number
  pin_count: number
  location: string | null
  website: string | null
  rules: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined data
  creator?: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
  }
  user_membership?: {
    role: GroupRole
    joined_at: string
  }
}

export interface GroupMembership {
  id: string
  group_id: string
  user_id: string
  role: GroupRole
  joined_at: string
  invited_by: string | null
  // Joined data
  user?: {
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
}

export interface CreateGroupData {
  name: string
  description?: string
  category: PinCategory
  is_public?: boolean
  location?: string
  website?: string
  rules?: string
  avatar?: File
  banner?: File
}

export interface UpdateGroupData {
  name?: string
  description?: string
  category?: PinCategory
  is_public?: boolean
  location?: string
  website?: string
  rules?: string
}

export interface GroupFilters {
  category?: PinCategory[]
  is_public?: boolean
  search?: string
  created_by?: string
  user_is_member?: boolean
}

class GroupService {
  private supabase = createSupabaseClient()

  // Create a new group
  async createGroup(data: CreateGroupData): Promise<Group> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Generate slug from name
      const slug = this.generateSlug(data.name)

      // Check if slug is already taken
      const { data: existingGroup } = await this.supabase
        .from('groups')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingGroup) {
        throw new SupabaseError('A group with this name already exists')
      }

      // Upload images if provided
      let avatarUrl: string | null = null
      let bannerUrl: string | null = null

      if (data.avatar) {
        avatarUrl = await this.uploadGroupImage(data.avatar, 'avatar', slug)
      }

      if (data.banner) {
        bannerUrl = await this.uploadGroupImage(data.banner, 'banner', slug)
      }

      const groupData = {
        name: data.name,
        slug,
        description: data.description || null,
        category: data.category,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        is_public: data.is_public ?? true,
        location: data.location || null,
        website: data.website || null,
        rules: data.rules || null,
        created_by: user.id
      }

      const { data: group, error } = await (this.supabase
        .from('groups') as any)
        .insert(groupData)
        .select(`
          *,
          creator:users!created_by(id, full_name, username, avatar_url)
        `)
        .single()

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      // Add creator as admin member
      await (this.supabase
        .from('group_memberships') as any)
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        })

      // Create activity entry
      await (this.supabase as any).rpc('create_activity', {
        user_id: user.id,
        activity_type: 'group_created',
        activity_data: {
          group_id: group.id,
          group_name: group.name,
          category: group.category
        }
      })

      return this.transformGroup(group)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to create group')
    }
  }

  // Get group by ID or slug
  async getGroup(identifier: string, userId?: string): Promise<Group | null> {
    try {
      let query = this.supabase
        .from('groups')
        .select(`
          *,
          creator:users!created_by(id, full_name, username, avatar_url)
        `)

      // Check if identifier is UUID or slug
      if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        query = query.eq('id', identifier)
      } else {
        query = query.eq('slug', identifier)
      }

      const { data: group, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Group not found
        }
        throw new SupabaseError(error.message, error.code)
      }

      // Get user membership if authenticated
      let userMembership = null
      if (userId) {
        const { data: membership } = await this.supabase
          .from('group_memberships')
          .select('role, joined_at')
          .eq('group_id', (group as any).id)
          .eq('user_id', userId)
          .single()

        userMembership = membership
      }

      return this.transformGroup({ ...(group as any), user_membership: userMembership })
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to get group')
    }
  }

  // Get groups with filters and pagination
  async getGroups(
    filters: GroupFilters = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ groups: Group[]; total: number; hasMore: boolean }> {
    try {
      const { page = 1, limit = 20 } = pagination
      const offset = (page - 1) * limit

      let query = this.supabase
        .from('groups')
        .select(`
          *,
          creator:users!created_by(id, full_name, username, avatar_url)
        `, { count: 'exact' })

      // Apply filters
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category)
      }

      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public)
      }

      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply ordering and pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: groups, error, count } = await query

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      const total = count || 0
      const hasMore = offset + limit < total

      return {
        groups: groups?.map(group => this.transformGroup(group)) || [],
        total,
        hasMore
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to get groups')
    }
  }

  // Update group
  async updateGroup(groupId: string, data: UpdateGroupData): Promise<Group> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Check if user can update this group
      const canUpdate = await this.userCanManageGroup(user.id, groupId)
      if (!canUpdate) {
        throw new SupabaseError('You do not have permission to update this group')
      }

      const updateData: any = { ...data }

      // Generate new slug if name is being updated
      if (data.name) {
        const slug = this.generateSlug(data.name)
        
        // Check if new slug is already taken
        const { data: existingGroup } = await this.supabase
          .from('groups')
          .select('id')
          .eq('slug', slug)
          .neq('id', groupId)
          .single()

        if (existingGroup) {
          throw new SupabaseError('A group with this name already exists')
        }

        updateData.slug = slug
      }

      const { data: group, error } = await (this.supabase
        .from('groups') as any)
        .update(updateData)
        .eq('id', groupId)
        .select(`
          *,
          creator:users!created_by(id, full_name, username, avatar_url)
        `)
        .single()

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      return this.transformGroup(group)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to update group')
    }
  }

  // Delete group
  async deleteGroup(groupId: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Check if user can delete this group
      const canDelete = await this.userCanManageGroup(user.id, groupId, 'admin')
      if (!canDelete) {
        throw new SupabaseError('You do not have permission to delete this group')
      }

      const { error } = await this.supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to delete group')
    }
  }

  // Join group
  async joinGroup(groupId: string): Promise<GroupMembership> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Check if group exists and is public
      const group = await this.getGroup(groupId)
      if (!group) {
        throw new SupabaseError('Group not found')
      }

      if (!group.is_public) {
        throw new SupabaseError('This group requires an invitation to join')
      }

      // Check if already a member
      const { data: existingMembership } = await this.supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

      if (existingMembership) {
        throw new SupabaseError('You are already a member of this group')
      }

      const { data: membership, error } = await (this.supabase
        .from('group_memberships') as any)
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        })
        .select(`
          *,
          user:users(id, full_name, username, avatar_url),
          group:groups(id, name, slug, avatar_url)
        `)
        .single()

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      // Create notification for group admins
      await this.notifyGroupAdmins(groupId, {
        type: 'group_joined',
        title: 'New member joined',
        message: `${user.email} joined the group`,
        data: { group_id: groupId, user_id: user.id }
      })

      return membership
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to join group')
    }
  }

  // Leave group
  async leaveGroup(groupId: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Check if user is the only admin
      const { data: admins } = await this.supabase
        .from('group_memberships')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('role', 'admin')

      if (admins && admins.length === 1 && (admins[0] as any).user_id === user.id) {
        throw new SupabaseError('You cannot leave the group as the only admin. Please promote another member to admin first.')
      }

      const { error } = await this.supabase
        .from('group_memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to leave group')
    }
  }

  // Get group members
  async getGroupMembers(
    groupId: string,
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ members: GroupMembership[]; total: number; hasMore: boolean }> {
    try {
      const { page = 1, limit = 20 } = pagination
      const offset = (page - 1) * limit

      const { data: members, error, count } = await this.supabase
        .from('group_memberships')
        .select(`
          *,
          user:users(id, full_name, username, avatar_url)
        `, { count: 'exact' })
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      const total = count || 0
      const hasMore = offset + limit < total

      return {
        members: members || [],
        total,
        hasMore
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to get group members')
    }
  }

  // Update member role
  async updateMemberRole(groupId: string, userId: string, role: GroupRole): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Check if user can manage this group
      const canManage = await this.userCanManageGroup(user.id, groupId)
      if (!canManage) {
        throw new SupabaseError('You do not have permission to manage this group')
      }

      const { error } = await (this.supabase
        .from('group_memberships') as any)
        .update({ role })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to update member role')
    }
  }

  // Helper methods
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
  }

  private async uploadGroupImage(file: File, type: 'avatar' | 'banner', slug: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${slug}-${type}-${Date.now()}.${fileExt}`
    const filePath = `groups/${fileName}`

    await uploadFile(this.supabase, 'group-images', filePath, file)
    return getPublicUrl(this.supabase, 'group-images', filePath)
  }

  private async userCanManageGroup(userId: string, groupId: string, requiredRole: GroupRole = 'moderator'): Promise<boolean> {
    // Check if user is admin/moderator
    const { data: user } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if ((user as any)?.role === 'admin' || (user as any)?.role === 'moderator') {
      return true
    }

    // Check group membership role
    const { data: membership } = await this.supabase
      .from('group_memberships')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (!membership) return false

    const roleHierarchy = { member: 0, moderator: 1, admin: 2 }
    return (roleHierarchy as any)[(membership as any).role] >= (roleHierarchy as any)[requiredRole]
  }

  private async notifyGroupAdmins(groupId: string, notification: any): Promise<void> {
    const { data: admins } = await this.supabase
      .from('group_memberships')
      .select('user_id')
      .eq('group_id', groupId)
      .in('role', ['admin', 'moderator'])

    if (admins) {
      for (const admin of admins) {
        await this.supabase.rpc('create_notification', {
          target_user_id: (admin as any).user_id,
          ...notification
        })
      }
    }
  }

  private transformGroup(group: any): Group {
    return {
      ...group,
      creator: group.creator,
      user_membership: group.user_membership
    }
  }
}

export const groupService = new GroupService()
export default groupService
