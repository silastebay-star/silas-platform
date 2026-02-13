/**
 * Authentication Context and Hooks
 * React context for managing authentication state across the application
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import authService, { AuthUser, SignUpData, SignInData, UpdateProfileData, ResetPasswordData, UpdatePasswordData } from './auth-service'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (data: SignUpData) => Promise<{ needsVerification: boolean }>
  signIn: (data: SignInData) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  resetPassword: (data: ResetPasswordData) => Promise<void>
  updatePassword: (data: UpdatePasswordData) => Promise<void>
  resendVerification: () => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  deleteAvatar: () => Promise<void>
  hasRole: (role: 'user' | 'moderator' | 'admin') => boolean
  isAdmin: boolean
  isModerator: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (data: SignUpData): Promise<{ needsVerification: boolean }> => {
    try {
      setLoading(true)
      const result = await authService.signUp(data)
      
      if (result.needsVerification) {
        toast.success('Account created! Please check your email to verify your account.')
      } else {
        toast.success('Account created successfully!')
        router.push('/onboarding')
      }
      
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: SignInData): Promise<void> => {
    try {
      setLoading(true)
      await authService.signIn(data)
      toast.success('Welcome back!')
      router.push('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true)
      await authService.signOut()
      setUser(null)
      toast.success('Signed out successfully')
      router.push('/auth/signin')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: UpdateProfileData): Promise<void> => {
    try {
      const updatedUser = await authService.updateProfile(data)
      setUser(updatedUser)
      toast.success('Profile updated successfully')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      toast.error(message)
      throw error
    }
  }

  const resetPassword = async (data: ResetPasswordData): Promise<void> => {
    try {
      await authService.resetPassword(data)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email'
      toast.error(message)
      throw error
    }
  }

  const updatePassword = async (data: UpdatePasswordData): Promise<void> => {
    try {
      await authService.updatePassword(data)
      toast.success('Password updated successfully')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password'
      toast.error(message)
      throw error
    }
  }

  const resendVerification = async (): Promise<void> => {
    try {
      await authService.resendVerification()
      toast.success('Verification email sent! Check your inbox.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send verification email'
      toast.error(message)
      throw error
    }
  }

  const uploadAvatar = async (file: File): Promise<string> => {
    try {
      const avatarUrl = await authService.uploadAvatar(file)
      toast.success('Avatar updated successfully')
      return avatarUrl
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload avatar'
      toast.error(message)
      throw error
    }
  }

  const deleteAvatar = async (): Promise<void> => {
    try {
      await authService.deleteAvatar()
      toast.success('Avatar removed successfully')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove avatar'
      toast.error(message)
      throw error
    }
  }

  const hasRole = (role: 'user' | 'moderator' | 'admin'): boolean => {
    return authService.hasRole(user, role)
  }

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    resendVerification,
    uploadAvatar,
    deleteAvatar,
    hasRole,
    isAdmin: authService.isAdmin(user),
    isModerator: authService.isModerator(user),
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for protected routes
export function useRequireAuth(redirectTo: string = '/auth/signin') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}

// Hook for role-based access
export function useRequireRole(role: 'user' | 'moderator' | 'admin', redirectTo: string = '/') {
  const { user, loading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !hasRole(role))) {
      router.push(redirectTo)
    }
  }, [user, loading, hasRole, role, router, redirectTo])

  return { user, loading, hasAccess: hasRole(role) }
}

// Hook for admin-only access
export function useRequireAdmin(redirectTo: string = '/') {
  return useRequireRole('admin', redirectTo)
}

// Hook for moderator access
export function useRequireModerator(redirectTo: string = '/') {
  return useRequireRole('moderator', redirectTo)
}

// Hook for guest-only routes (redirect if authenticated)
export function useGuestOnly(redirectTo: string = '/') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { loading }
}

// Hook for conditional rendering based on auth state
export function useAuthState() {
  const { user, loading, isAuthenticated, isAdmin, isModerator } = useAuth()

  return {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isModerator,
    isGuest: !isAuthenticated,
    isUser: isAuthenticated && !isModerator && !isAdmin
  }
}

export default AuthContext
