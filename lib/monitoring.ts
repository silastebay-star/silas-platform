/**
 * Performance monitoring and analytics for SILAS platform
 */

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === 'undefined') return

  // Track Core Web Vitals
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS(sendToAnalytics)
    onINP(sendToAnalytics)
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
  })
}

// Send metrics to analytics service
function sendToAnalytics(metric: any) {
  // In production, send to your analytics service
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', metric)
  }
  
  // Example: Send to Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      custom_map: { metric_id: 'custom_metric' },
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }
}

// Error tracking
export class ErrorTracker {
  static init() {
    if (typeof window === 'undefined') return

    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })
  }

  static logError(error: any) {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', error)
    }

    // In production, send to error tracking service
    // Example: Sentry, LogRocket, etc.
    try {
      // Send to your error tracking service
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error),
      }).catch(() => {
        // Silently fail if error reporting fails
      })
    } catch {
      // Silently fail
    }
  }

  static logCustomError(message: string, context?: any) {
    this.logError({
      type: 'custom',
      message,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    })
  }
}

// Performance tracking
export class PerformanceTracker {
  private static marks: Map<string, number> = new Map()

  static startTiming(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`)
      this.marks.set(name, performance.now())
    }
  }

  static endTiming(name: string) {
    if (typeof performance !== 'undefined' && this.marks.has(name)) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      const duration = performance.now() - this.marks.get(name)!
      this.marks.delete(name)

      // Log performance metric
      this.logPerformance(name, duration)
      
      return duration
    }
    return 0
  }

  static logPerformance(name: string, duration: number, metadata?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`, metadata)
    }

    // Send to analytics in production
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
        event_category: 'Performance',
        custom_map: metadata,
      })
    }
  }

  static measureMapLoad() {
    this.startTiming('map-load')
  }

  static measureMapLoadComplete() {
    return this.endTiming('map-load')
  }

  static measurePinLoad(count: number) {
    this.logPerformance('pins-loaded', performance.now(), { count })
  }

  static measureImageUpload(size: number) {
    this.startTiming('image-upload')
    return {
      complete: () => this.endTiming('image-upload'),
      metadata: { size }
    }
  }
}

// User analytics
export class UserAnalytics {
  static trackPageView(path: string) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: path,
      })
    }
  }

  static trackEvent(action: string, category: string, label?: string, value?: number) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value,
      })
    }
  }

  static trackPinCreated(category: string) {
    this.trackEvent('pin_created', 'engagement', category)
  }

  static trackPinViewed(category: string) {
    this.trackEvent('pin_viewed', 'engagement', category)
  }

  static trackCommentAdded() {
    this.trackEvent('comment_added', 'social')
  }

  static trackReactionAdded(type: string) {
    this.trackEvent('reaction_added', 'social', type)
  }

  static trackSearch(query: string, results: number) {
    this.trackEvent('search', 'discovery', query, results)
  }

  static trackImageUpload(count: number) {
    this.trackEvent('image_upload', 'content', undefined, count)
  }
}

// Accessibility monitoring
export class AccessibilityMonitor {
  static init() {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return

    // Check for common accessibility issues
    this.checkColorContrast()
    this.checkFocusManagement()
    this.checkAriaLabels()
  }

  private static checkColorContrast() {
    // Basic color contrast checking
    const elements = document.querySelectorAll('*')
    elements.forEach((element) => {
      const styles = window.getComputedStyle(element)
      const color = styles.color
      const backgroundColor = styles.backgroundColor
      
      // Log potential contrast issues (simplified check)
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        // In a real implementation, you'd calculate actual contrast ratios
        // and warn about WCAG violations
      }
    })
  }

  private static checkFocusManagement() {
    // Check for focusable elements without visible focus indicators
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    focusableElements.forEach((element) => {
      element.addEventListener('focus', () => {
        const styles = window.getComputedStyle(element)
        if (styles.outline === 'none' && !styles.boxShadow.includes('inset')) {
          console.warn('Element may not have visible focus indicator:', element)
        }
      })
    })
  }

  private static checkAriaLabels() {
    // Check for interactive elements without accessible names
    const interactiveElements = document.querySelectorAll('button, [role="button"], input, select, textarea')
    
    interactiveElements.forEach((element) => {
      const hasLabel = element.getAttribute('aria-label') ||
                      element.getAttribute('aria-labelledby') ||
                      element.querySelector('label') ||
                      element.textContent?.trim()
      
      if (!hasLabel) {
        console.warn('Interactive element may not have accessible name:', element)
      }
    })
  }
}

// Initialize monitoring
export function initializeMonitoring() {
  if (typeof window === 'undefined') return

  trackWebVitals()
  ErrorTracker.init()
  AccessibilityMonitor.init()
}

// All exports are already declared above
