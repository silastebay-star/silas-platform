/**
 * Authentication Service
 * Complete authentication system with Supabase Auth integration
 */

import { createSupabaseClient, createSupabaseAdminClient, SupabaseError, withSupabaseErrorHandling } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import { User, AuthError } from '@supabase/supabase-js'

export type UserRole = 'user' | 'moderator' | 'admin'

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  role: UserRole
  is_verified: boolean
  is_active: boolean
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SignUpData {
  email: string
  password: string
  full_name: string
  username?: string
}

export interface SignInData {
  email: string
  password: string
}

export type UpdateProfileData = Database['public']['Tables']['users']['Update']

export interface ResetPasswordData {
  email: string
}

export interface UpdatePasswordData {
  password: string
  newPassword: string
}

class AuthService {
  private supabase = createSupabaseClient()

  // Sign up new user
  async signUp(data: SignUpData): Promise<{ user: User | null; needsVerification: boolean }> {
    try {
      // Check if username is already taken
      if (data.username) {
        const { data: existingUser } = await this.supabase
          .from('users')
          .select('id')
          .eq('username', data.username)
          .single()
        
        if (existingUser) {
          throw new SupabaseError('Username is already taken')
        }
      }

      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            username: data.username
          }
        }
      })

      if (error) {
        throw new SupabaseError(error.message, error.name)
      }

      // Update user profile with additional data
      if (authData.user && data.username) {
        await this.updateProfile({ username: data.username })
      }

      return {
        user: authData.user,
        needsVerification: !authData.session
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to create account')
    }
  }

  // Sign in user
  async signIn(data: SignInData): Promise<User> {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        throw new SupabaseError(error.message, error.name)
      }

      if (!authData.user) {
        throw new SupabaseError('Authentication failed')
      }

      return authData.user
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to sign in')
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        throw new SupabaseError(error.message, error.name)
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to sign out')
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      return await this.getUserProfile(user.id)
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      return data
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileData): Promise<AuthUser> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      // Check if username is already taken (if updating username)
      if (data.username) {
        const { data: existingUser } = await this.supabase
          .from('users')
          .select('id')
          .eq('username', data.username)
          .neq('id', user.id)
          .single()
        
        if (existingUser) {
          throw new SupabaseError('Username is already taken')
        }
      }

      const { data: updatedUser, error } = await (this.supabase
        .from('users') as any)
        .update(data)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw new SupabaseError(error.message, error.code)
      }

      return updatedUser
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to update profile')
    }
  }

  // Reset password
  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        throw new SupabaseError(error.message, error.name)
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to send reset password email')
    }
  }

  // Update password
  async updatePassword(data: UpdatePasswordData): Promise<void> {
    try {
      // Verify current password by attempting to sign in
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user?.email) {
        throw new SupabaseError('User not authenticated')
      }

      // Re-authenticate with current password
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: user.email,
        password: data.password
      })

      if (signInError) {
        throw new SupabaseError('Current password is incorrect')
      }

      // Update to new password
      const { error } = await this.supabase.auth.updateUser({
        password: data.newPassword
      })

      if (error) {
        throw new SupabaseError(error.message, error.name)
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to update password')
    }
  }

  // Resend email verification
  async resendVerification(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user?.email) {
        throw new SupabaseError('User not authenticated')
      }

      const { error } = await this.supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) {
        throw new SupabaseError(error.message, error.name)
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to resend verification email')
    }
  }

  // Check if user has role
  hasRole(user: AuthUser | null, role: UserRole): boolean {
    if (!user) return false
    
    const roleHierarchy = { user: 0, moderator: 1, admin: 2 }
    return roleHierarchy[user.role] >= roleHierarchy[role]
  }

  // Check if user is admin
  isAdmin(user: AuthUser | null): boolean {
    return user?.role === 'admin'
  }

  // Check if user is moderator or admin
  isModerator(user: AuthUser | null): boolean {
    return user?.role === 'moderator' || user?.role === 'admin'
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userProfile = await this.getUserProfile(session.user.id)
        callback(userProfile)
      } else {
        callback(null)
      }
    })
  }

  // Upload avatar
  async uploadAvatar(file: File): Promise<string> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new SupabaseError(`Upload failed: ${uploadError.message}`)
      }

      const { data } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user profile with new avatar URL
      await this.updateProfile({ avatar_url: data.publicUrl })

      return data.publicUrl
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to upload avatar')
    }
  }

  // Delete avatar
  async deleteAvatar(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('User not authenticated')
      }

      const userProfile = await this.getUserProfile(user.id)
      
      if (userProfile?.avatar_url) {
        // Extract file path from URL
        const url = new URL(userProfile.avatar_url)
        const filePath = url.pathname.split('/').slice(-2).join('/')

        await this.supabase.storage
          .from('avatars')
          .remove([filePath])
      }

      // Update user profile to remove avatar URL
      await this.updateProfile({ avatar_url: null })
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Failed to delete avatar')
    }
  }
}

export const authService = new AuthService()
export default authService
