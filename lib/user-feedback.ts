/**
 * Unified User Feedback System for SILAS Platform
 */

import { toast } from 'sonner'
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type FeedbackType = 'success' | 'error' | 'warning' | 'info'

export interface FeedbackOptions {
  title?: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
}

export class SilasFeedback {
  private static instance: SilasFeedback

  static getInstance(): SilasFeedback {
    if (!SilasFeedback.instance) {
      SilasFeedback.instance = new SilasFeedback()
    }
    return SilasFeedback.instance
  }

  /**
   * Show success feedback
   */
  success(message: string, options?: FeedbackOptions) {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  /**
   * Show error feedback
   */
  error(message: string, options?: FeedbackOptions) {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  /**
   * Show warning feedback
   */
  warning(message: string, options?: FeedbackOptions) {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  /**
   * Show info feedback
   */
  info(message: string, options?: FeedbackOptions) {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  /**
   * Show loading feedback with promise
   */
  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ): Promise<T> {
    toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
    return promise
  }

  /**
   * Show contextual feedback for common SILAS actions
   */
  pinCreated(pinTitle: string) {
    this.success('Pin created successfully!', {
      description: `"${pinTitle}" has been added to the map`,
      action: {
        label: 'View',
        onClick: () => {
          // Navigate to pin or show pin detail
        }
      }
    })
  }

  pinUpdated(pinTitle: string) {
    this.success('Pin updated!', {
      description: `"${pinTitle}" has been updated`,
    })
  }

  pinDeleted() {
    this.success('Pin deleted', {
      description: 'The pin has been removed from the map',
    })
  }

  commentAdded() {
    this.success('Comment added!', {
      description: 'Your comment has been posted',
    })
  }

  reactionAdded(type: string) {
    this.success(`${type} added!`, {
      description: 'Your reaction has been recorded',
      duration: 2000,
    })
  }

  authRequired() {
    this.warning('Sign in required', {
      description: 'Please sign in to perform this action',
      action: {
        label: 'Sign In',
        onClick: () => {
          // Open auth modal or navigate to sign in
        }
      }
    })
  }

  permissionDenied() {
    this.error('Permission denied', {
      description: 'You don\'t have permission to perform this action',
    })
  }

  networkError() {
    this.error('Connection error', {
      description: 'Please check your internet connection and try again',
      action: {
        label: 'Retry',
        onClick: () => {
          // Retry the failed action
        }
      }
    })
  }

  locationRequired() {
    this.warning('Location access required', {
      description: 'Please enable location access to use this feature',
      action: {
        label: 'Enable',
        onClick: () => {
          // Request location permission
        }
      }
    })
  }

  fileUploadSuccess(fileName: string) {
    this.success('File uploaded!', {
      description: `"${fileName}" has been uploaded successfully`,
    })
  }

  fileUploadError(fileName: string, reason?: string) {
    this.error('Upload failed', {
      description: `Failed to upload "${fileName}"${reason ? `: ${reason}` : ''}`,
    })
  }

  formValidationError(field?: string) {
    this.error('Please check your input', {
      description: field ? `There's an issue with the ${field} field` : 'Some fields need attention',
    })
  }

  dataLoadError(context?: string) {
    this.error('Failed to load data', {
      description: context ? `Unable to load ${context}` : 'Please try refreshing the page',
      action: {
        label: 'Refresh',
        onClick: () => window.location.reload()
      }
    })
  }

  featureComingSoon(feature: string) {
    this.info(`${feature} coming soon!`, {
      description: 'This feature is currently in development',
    })
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    toast.dismiss()
  }
}

// Convenience instance
export const feedback = SilasFeedback.getInstance()

// React hook for user feedback
export function useFeedback() {
  return {
    success: (message: string, options?: FeedbackOptions) => feedback.success(message, options),
    error: (message: string, options?: FeedbackOptions) => feedback.error(message, options),
    warning: (message: string, options?: FeedbackOptions) => feedback.warning(message, options),
    info: (message: string, options?: FeedbackOptions) => feedback.info(message, options),
    promise: <T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) =>
      feedback.promise(promise, messages),
    
    // Contextual feedback methods
    pinCreated: (title: string) => feedback.pinCreated(title),
    pinUpdated: (title: string) => feedback.pinUpdated(title),
    pinDeleted: () => feedback.pinDeleted(),
    commentAdded: () => feedback.commentAdded(),
    reactionAdded: (type: string) => feedback.reactionAdded(type),
    authRequired: () => feedback.authRequired(),
    permissionDenied: () => feedback.permissionDenied(),
    networkError: () => feedback.networkError(),
    locationRequired: () => feedback.locationRequired(),
    fileUploadSuccess: (fileName: string) => feedback.fileUploadSuccess(fileName),
    fileUploadError: (fileName: string, reason?: string) => feedback.fileUploadError(fileName, reason),
    formValidationError: (field?: string) => feedback.formValidationError(field),
    dataLoadError: (context?: string) => feedback.dataLoadError(context),
    featureComingSoon: (feature: string) => feedback.featureComingSoon(feature),
    
    dismissAll: () => feedback.dismissAll(),
  }
}
