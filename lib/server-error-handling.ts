/**
 * Server-side Error Handling System for SILAS Platform
 */

export interface ServerError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  context?: string
}

export function handleServerError(error: Error | string, context?: string): ServerError {
  const serverError: ServerError = {
    code: error instanceof Error ? error.name : 'UNKNOWN_SERVER_ERROR',
    message: error instanceof Error ? error.message : error,
    timestamp: new Date().toISOString(),
    context,
    details: error instanceof Error ? { stack: error.stack } : undefined
  }

  console.error('[SILAS Server Error]', serverError)

  // In a production environment, you might integrate with a server-side monitoring service here
  // e.g., Sentry.captureException(error, { extra: { context } })

  return serverError
}
