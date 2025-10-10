/**
 * Unified Error Handling System for SILAS Platform
 */

import { toast } from 'sonner'

export interface SilasError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  context?: string
}

export class SilasErrorHandler {
  private static instance: SilasErrorHandler
  private errorLog: SilasError[] = []

  static getInstance(): SilasErrorHandler {
    if (!SilasErrorHandler.instance) {
      SilasErrorHandler.instance = new SilasErrorHandler()
    }
    return SilasErrorHandler.instance
  }

  /**
   * Handle and log errors with consistent formatting
   */
  handleError(error: Error | string, context?: string, showToast = true): SilasError {
    const silasError: SilasError = {
      code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString(),
      context,
      details: error instanceof Error ? { stack: error.stack } : undefined
    }

    // Log error
    this.errorLog.push(silasError)
    console.error('[SILAS Error]', silasError)

    // Show user-friendly toast notification
    if (showToast) {
      this.showErrorToast(silasError)
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(silasError)
    }

    return silasError
  }

  /**
   * Show user-friendly error toast
   */
  private showErrorToast(error: SilasError) {
    const userMessage = this.getUserFriendlyMessage(error)
    toast.error(userMessage, {
      description: error.context ? `Context: ${error.context}` : undefined,
      duration: 5000,
    })
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyMessage(error: SilasError): string {
    const messageMap: Record<string, string> = {
      'NetworkError': 'Connection issue. Please check your internet and try again.',
      'ValidationError': 'Please check your input and try again.',
      'AuthenticationError': 'Please sign in to continue.',
      'AuthorizationError': 'You don\'t have permission to perform this action.',
      'NotFoundError': 'The requested item could not be found.',
      'RateLimitError': 'Too many requests. Please wait a moment and try again.',
      'DatabaseError': 'A database error occurred. Please try again later.',
      'FileUploadError': 'File upload failed. Please try again.',
      'GeolocationError': 'Location access is required for this feature.',
    }

    return messageMap[error.code] || 'An unexpected error occurred. Please try again.'
  }

  /**
   * Send error to monitoring service
   */
  private async sendToMonitoring(error: SilasError) {
    try {
      // In production, send to your monitoring service (Sentry, LogRocket, etc.)
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error),
      })
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError)
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 10): SilasError[] {
    return this.errorLog.slice(-limit)
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = []
  }
}

// Convenience functions
export const errorHandler = SilasErrorHandler.getInstance()

export function handleError(error: Error | string, context?: string, showToast = true): SilasError {
  return errorHandler.handleError(error, context, showToast)
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  context?: string,
  showToast = true
): Promise<T | null> {
  return promise.catch((error) => {
    handleError(error, context, showToast)
    return null
  })
}

// React hook for error handling
export function useErrorHandler() {
  return {
    handleError: (error: Error | string, context?: string, showToast = true) =>
      handleError(error, context, showToast),
    handleAsyncError: <T>(promise: Promise<T>, context?: string, showToast = true) =>
      handleAsyncError(promise, context, showToast),
    getRecentErrors: () => errorHandler.getRecentErrors(),
    clearErrors: () => errorHandler.clearErrorLog(),
  }
}
