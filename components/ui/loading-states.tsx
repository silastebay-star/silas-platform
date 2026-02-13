/**
 * Unified Loading States Components for SILAS Platform
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, MapPin, Users, Calendar, DollarSign } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin text-silas-green',
        sizeClasses[size],
        className
      )} 
    />
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="bg-gray-200 rounded-lg p-6 space-y-4">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
      </div>
    </div>
  )
}

interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export function LoadingSkeleton({ lines = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={cn(
            'h-3 bg-gray-200 rounded',
            i === 0 && 'w-3/4',
            i === 1 && 'w-1/2',
            i === 2 && 'w-2/3',
            i > 2 && 'w-full'
          )}
        />
      ))}
    </div>
  )
}

interface LoadingPageProps {
  title?: string
  description?: string
  icon?: 'map' | 'users' | 'calendar' | 'fund'
}

export function LoadingPage({ 
  title = 'Loading...', 
  description = 'Please wait while we load your content',
  icon = 'map'
}: LoadingPageProps) {
  const icons = {
    map: MapPin,
    users: Users,
    calendar: Calendar,
    fund: DollarSign
  }

  const IconComponent = icons[icon]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="flex justify-center">
          <div className="relative">
            <IconComponent className="h-16 w-16 text-silas-green/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 font-heading">
            {title}
          </h2>
          <p className="text-gray-600">
            {description}
          </p>
        </div>

        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-silas-green rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ 
  isVisible, 
  message = 'Loading...', 
  className 
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed inset-0 bg-black/50 flex items-center justify-center z-50',
      className
    )}>
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4">
        <div className="flex items-center space-x-3">
          <LoadingSpinner />
          <span className="text-gray-900 font-medium">{message}</span>
        </div>
      </div>
    </div>
  )
}

interface LoadingButtonProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export function LoadingButton({ 
  isLoading, 
  children, 
  className, 
  disabled,
  onClick 
}: LoadingButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium',
        'bg-silas-green text-white hover:bg-silas-green/90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
      disabled={isLoading || disabled}
      onClick={onClick}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  )
}

// Hook for managing loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState)

  const startLoading = () => setIsLoading(true)
  const stopLoading = () => setIsLoading(false)
  
  const withLoading = async <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      startLoading()
      return await asyncFn()
    } catch (error) {
      console.error('Error in withLoading:', error)
      return null
    } finally {
      stopLoading()
    }
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading
  }
}
