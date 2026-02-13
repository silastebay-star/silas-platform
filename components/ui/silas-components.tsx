/**
 * Unified SILAS Component Patterns
 * 
 * Standardized components that follow SILAS design system
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from './loading-states'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

// SILAS Card Component with consistent styling
interface SilasCardProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  hover?: boolean
  loading?: boolean
  error?: string
}

export function SilasCard({ 
  title, 
  description, 
  children, 
  className, 
  hover = true,
  loading = false,
  error 
}: SilasCardProps) {
  return (
    <Card className={cn(
      'bg-white rounded-lg shadow-md border border-gray-200',
      hover && 'hover:shadow-lg transition-shadow duration-200',
      className
    )}>
      {(title || description) && (
        <CardHeader className="pb-4">
          {title && (
            <CardTitle className="text-lg font-semibold text-gray-900 font-heading">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-gray-600">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2 text-red-600 py-4">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

// SILAS Button with consistent styling
interface SilasButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export function SilasButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  onClick
}: SilasButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200'
  
  const variantClasses = {
    primary: 'bg-silas-green text-white hover:bg-silas-green/90 focus:ring-2 focus:ring-silas-green/20',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-2 focus:ring-gray-200',
    outline: 'border border-silas-green text-silas-green hover:bg-silas-green hover:text-white focus:ring-2 focus:ring-silas-green/20',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <Button
      variant="default"
      size="default"
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (loading || disabled) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={loading || disabled}
      onClick={onClick}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </Button>
  )
}

// SILAS Status Badge
interface SilasStatusBadgeProps {
  status: 'active' | 'pending' | 'completed' | 'error' | 'warning' | 'info'
  children: React.ReactNode
  className?: string
}

export function SilasStatusBadge({ status, children, className }: SilasStatusBadgeProps) {
  const statusClasses = {
    active: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
    info: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <Badge
      variant="default"
      className={cn(
        'border font-medium',
        statusClasses[status],
        className
      )}
    >
      {children}
    </Badge>
  )
}

// SILAS Alert Component
interface SilasAlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  children: React.ReactNode
  className?: string
  dismissible?: boolean
  onDismiss?: () => void
}

export function SilasAlert({ 
  type, 
  title, 
  children, 
  className, 
  dismissible = false,
  onDismiss 
}: SilasAlertProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const IconComponent = icons[type]

  return (
    <div className={cn(
      'border rounded-lg p-4',
      typeClasses[type],
      className
    )}>
      <div className="flex items-start space-x-3">
        <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="text-current hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

// SILAS Empty State Component
interface SilasEmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function SilasEmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className 
}: SilasEmptyStateProps) {
  return (
    <div className={cn(
      'text-center py-12 px-4',
      className
    )}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="h-12 w-12 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 font-heading">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <SilasButton onClick={action.onClick}>
          {action.label}
        </SilasButton>
      )}
    </div>
  )
}

// SILAS Section Header
interface SilasSectionHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function SilasSectionHeader({ 
  title, 
  description, 
  action, 
  className 
}: SilasSectionHeaderProps) {
  return (
    <div className={cn(
      'flex items-center justify-between mb-6',
      className
    )}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-heading">
          {title}
        </h2>
        {description && (
          <p className="text-gray-600 mt-1">
            {description}
          </p>
        )}
      </div>
      {action && (
        <SilasButton onClick={action.onClick}>
          {action.label}
        </SilasButton>
      )}
    </div>
  )
}
