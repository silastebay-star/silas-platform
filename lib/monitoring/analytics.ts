/**
 * Analytics and Monitoring Configuration
 * Comprehensive tracking for performance, user behavior, and system health
 */

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// User Analytics Interface
interface UserEvent {
  event: string
  properties?: Record<string, any>
  user_id?: string
  timestamp?: string
}

interface PageView {
  page: string
  title?: string
  referrer?: string
  user_id?: string
  session_id?: string
}

interface PerformanceMetric {
  metric: string
  value: number
  unit: string
  context?: Record<string, any>
}

// Analytics Service Class
class AnalyticsService {
  private isEnabled: boolean
  private userId?: string
  private sessionId: string

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production'
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  // Track page views
  trackPageView(page: string, title?: string) {
    if (!this.isEnabled) return

    const pageView: PageView = {
      page,
      title,
      referrer: document.referrer,
      user_id: this.userId,
      session_id: this.sessionId
    }

    // Send to multiple analytics providers
    this.sendToVercel('pageview', pageView)
    this.sendToMixpanel('Page View', pageView)
    this.sendToSupabase('page_views', pageView)
  }

  // Track user events
  trackEvent(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return

    const userEvent: UserEvent = {
      event,
      properties: {
        ...properties,
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      },
      user_id: this.userId
    }

    this.sendToVercel('event', userEvent)
    this.sendToMixpanel(event, userEvent.properties)
    this.sendToSupabase('user_events', userEvent)
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string, context?: Record<string, any>) {
    if (!this.isEnabled) return

    const performanceMetric: PerformanceMetric = {
      metric,
      value,
      unit,
      context: {
        ...context,
        user_id: this.userId,
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      }
    }

    this.sendToSupabase('performance_metrics', performanceMetric)
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    if (!this.isEnabled) return

    const errorEvent = {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context: {
        ...context,
        user_id: this.userId,
        session_id: this.sessionId,
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    }

    this.sendToSupabase('error_logs', errorEvent)
    
    // Also send to Sentry if configured
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: context })
    }
  }

  // Send data to different providers
  private sendToVercel(type: string, data: any) {
    // Vercel Analytics automatically tracks page views
    // Custom events can be sent via their API
  }

  private sendToMixpanel(event: string, properties: any) {
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(event, properties)
    }
  }

  private async sendToSupabase(table: string, data: any) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, data })
      })
    } catch (error) {
      console.error('Failed to send analytics to Supabase:', error)
    }
  }
}

// Performance Monitoring
class PerformanceMonitor {
  private analytics: AnalyticsService

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics
  }

  // Monitor Core Web Vitals
  monitorWebVitals() {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.analytics.trackPerformance('LCP', entry.startTime, 'ms', {
          element: (entry as any).element?.tagName
        })
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.analytics.trackPerformance('FID', (entry as any).processingStart - entry.startTime, 'ms')
      }
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          this.analytics.trackPerformance('CLS', (entry as any).value, 'score')
        }
      }
    }).observe({ entryTypes: ['layout-shift'] })
  }

  // Monitor API performance
  monitorAPIPerformance(endpoint: string, startTime: number, endTime: number, status: number) {
    const duration = endTime - startTime
    this.analytics.trackPerformance('API_Response_Time', duration, 'ms', {
      endpoint,
      status,
      success: status >= 200 && status < 300
    })
  }

  // Monitor database query performance
  monitorDatabasePerformance(query: string, duration: number, recordCount?: number) {
    this.analytics.trackPerformance('Database_Query_Time', duration, 'ms', {
      query_type: query.split(' ')[0].toUpperCase(),
      record_count: recordCount
    })
  }
}

// User Behavior Tracking
class BehaviorTracker {
  private analytics: AnalyticsService

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics
  }

  // Track pin interactions
  trackPinInteraction(action: string, pinId: string, category?: string) {
    this.analytics.trackEvent('Pin Interaction', {
      action,
      pin_id: pinId,
      category
    })
  }

  // Track project interactions
  trackProjectInteraction(action: string, projectId: string, projectType?: string) {
    this.analytics.trackEvent('Project Interaction', {
      action,
      project_id: projectId,
      project_type: projectType
    })
  }

  // Track voting behavior
  trackVotingBehavior(action: string, proposalId: string, voteType?: string) {
    this.analytics.trackEvent('Voting Behavior', {
      action,
      proposal_id: proposalId,
      vote_type: voteType
    })
  }

  // Track search behavior
  trackSearchBehavior(query: string, results: number, filters?: Record<string, any>) {
    this.analytics.trackEvent('Search', {
      query,
      results_count: results,
      filters
    })
  }

  // Track feature usage
  trackFeatureUsage(feature: string, action: string, context?: Record<string, any>) {
    this.analytics.trackEvent('Feature Usage', {
      feature,
      action,
      ...context
    })
  }
}

// System Health Monitoring
class HealthMonitor {
  private analytics: AnalyticsService

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics
  }

  // Monitor system health
  async checkSystemHealth() {
    try {
      const healthCheck = await fetch('/api/health')
      const health = await healthCheck.json()
      
      this.analytics.trackEvent('System Health Check', {
        status: health.status,
        database: health.database,
        response_time: health.response_time
      })

      return health
    } catch (error) {
      this.analytics.trackError(error as Error, { context: 'health_check' })
      return { status: 'unhealthy', error: (error as Error).message }
    }
  }

  // Monitor resource usage
  monitorResourceUsage() {
    if (typeof window === 'undefined') return

    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.analytics.trackPerformance('Memory_Usage', memory.usedJSHeapSize, 'bytes', {
        total_heap: memory.totalJSHeapSize,
        heap_limit: memory.jsHeapSizeLimit
      })
    }

    // Connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.analytics.trackEvent('Connection Quality', {
        effective_type: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      })
    }
  }
}

// Initialize analytics
const analytics = new AnalyticsService()
const performanceMonitor = new PerformanceMonitor(analytics)
const behaviorTracker = new BehaviorTracker(analytics)
const healthMonitor = new HealthMonitor(analytics)

// React component for analytics providers
export function AnalyticsProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
      <SpeedInsights />
    </>
  )
}

// Hook for using analytics in components
export function useAnalytics() {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackEvent: analytics.trackEvent.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    trackPinInteraction: behaviorTracker.trackPinInteraction.bind(behaviorTracker),
    trackProjectInteraction: behaviorTracker.trackProjectInteraction.bind(behaviorTracker),
    trackVotingBehavior: behaviorTracker.trackVotingBehavior.bind(behaviorTracker),
    trackSearchBehavior: behaviorTracker.trackSearchBehavior.bind(behaviorTracker),
    trackFeatureUsage: behaviorTracker.trackFeatureUsage.bind(behaviorTracker)
  }
}

// Initialize monitoring on app start
export function initializeMonitoring() {
  if (typeof window !== 'undefined') {
    // Start performance monitoring
    performanceMonitor.monitorWebVitals()
    
    // Monitor resource usage periodically
    setInterval(() => {
      healthMonitor.monitorResourceUsage()
    }, 60000) // Every minute

    // Check system health periodically
    setInterval(() => {
      healthMonitor.checkSystemHealth()
    }, 300000) // Every 5 minutes

    // Global error handler
    window.addEventListener('error', (event) => {
      analytics.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      analytics.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      })
    })
  }
}

export { analytics, performanceMonitor, behaviorTracker, healthMonitor }
