/**
 * Accessibility utilities for SILAS platform
 */

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = []

  /**
   * Trap focus within a container element
   */
  static trapFocus(container: HTMLElement) {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * Save current focus and restore it later
   */
  static saveFocus() {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement) {
      this.focusStack.push(activeElement)
    }
  }

  /**
   * Restore previously saved focus
   */
  static restoreFocus() {
    const element = this.focusStack.pop()
    if (element && element.focus) {
      element.focus()
    }
  }

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[]
  }

  /**
   * Move focus to the next focusable element
   */
  static focusNext(container?: HTMLElement) {
    const focusableElements = this.getFocusableElements(container || document.body)
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
    const nextIndex = (currentIndex + 1) % focusableElements.length
    focusableElements[nextIndex]?.focus()
  }

  /**
   * Move focus to the previous focusable element
   */
  static focusPrevious(container?: HTMLElement) {
    const focusableElements = this.getFocusableElements(container || document.body)
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
    const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
    focusableElements[prevIndex]?.focus()
  }
}

// Screen reader utilities
export class ScreenReader {
  /**
   * Announce a message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = message

    document.body.appendChild(announcer)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }

  /**
   * Create a visually hidden element for screen readers
   */
  static createVisuallyHidden(text: string): HTMLElement {
    const element = document.createElement('span')
    element.className = 'sr-only'
    element.textContent = text
    return element
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation for a list of elements
   */
  static handleArrowKeys(
    elements: HTMLElement[],
    currentIndex: number,
    key: string,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ): number {
    let newIndex = currentIndex

    if (orientation === 'vertical') {
      if (key === 'ArrowDown') {
        newIndex = (currentIndex + 1) % elements.length
      } else if (key === 'ArrowUp') {
        newIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1
      }
    } else {
      if (key === 'ArrowRight') {
        newIndex = (currentIndex + 1) % elements.length
      } else if (key === 'ArrowLeft') {
        newIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1
      }
    }

    if (newIndex !== currentIndex) {
      elements[newIndex]?.focus()
    }

    return newIndex
  }

  /**
   * Handle Home/End key navigation
   */
  static handleHomeEnd(elements: HTMLElement[], key: string): number {
    if (key === 'Home') {
      elements[0]?.focus()
      return 0
    } else if (key === 'End') {
      const lastIndex = elements.length - 1
      elements[lastIndex]?.focus()
      return lastIndex
    }
    return -1
  }
}

// Color contrast utilities
export class ColorContrast {
  /**
   * Calculate relative luminance of a color
   */
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const lum1 = this.getLuminance(...color1)
    const lum2 = this.getLuminance(...color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)
  }

  /**
   * Check if color combination meets WCAG AA standards
   */
  static meetsWCAG_AA(color1: [number, number, number], color2: [number, number, number]): boolean {
    return this.getContrastRatio(color1, color2) >= 4.5
  }

  /**
   * Check if color combination meets WCAG AAA standards
   */
  static meetsWCAG_AAA(color1: [number, number, number], color2: [number, number, number]): boolean {
    return this.getContrastRatio(color1, color2) >= 7
  }
}

// ARIA utilities
export class AriaUtils {
  /**
   * Generate a unique ID for ARIA relationships
   */
  static generateId(prefix: string = 'aria'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Set up ARIA describedby relationship
   */
  static setDescribedBy(element: HTMLElement, descriptionId: string) {
    const existingIds = element.getAttribute('aria-describedby')
    const newIds = existingIds ? `${existingIds} ${descriptionId}` : descriptionId
    element.setAttribute('aria-describedby', newIds)
  }

  /**
   * Set up ARIA labelledby relationship
   */
  static setLabelledBy(element: HTMLElement, labelId: string) {
    element.setAttribute('aria-labelledby', labelId)
  }

  /**
   * Set ARIA expanded state
   */
  static setExpanded(element: HTMLElement, expanded: boolean) {
    element.setAttribute('aria-expanded', expanded.toString())
  }

  /**
   * Set ARIA selected state
   */
  static setSelected(element: HTMLElement, selected: boolean) {
    element.setAttribute('aria-selected', selected.toString())
  }

  /**
   * Set ARIA pressed state for toggle buttons
   */
  static setPressed(element: HTMLElement, pressed: boolean) {
    element.setAttribute('aria-pressed', pressed.toString())
  }

  /**
   * Set ARIA current state
   */
  static setCurrent(element: HTMLElement, current: string | boolean) {
    if (typeof current === 'boolean') {
      element.setAttribute('aria-current', current ? 'true' : 'false')
    } else {
      element.setAttribute('aria-current', current)
    }
  }
}

// Reduced motion utilities
export class MotionUtils {
  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Apply animation only if user doesn't prefer reduced motion
   */
  static conditionalAnimation(element: HTMLElement, animationClass: string) {
    if (!this.prefersReducedMotion()) {
      element.classList.add(animationClass)
    }
  }

  /**
   * Set up a media query listener for reduced motion preference
   */
  static onReducedMotionChange(callback: (prefersReduced: boolean) => void) {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    callback(mediaQuery.matches)
    mediaQuery.addEventListener('change', (e) => callback(e.matches))
    return () => mediaQuery.removeEventListener('change', (e) => callback(e.matches))
  }
}

// All utilities are already exported above with their class declarations
