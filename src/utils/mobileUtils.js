// Mobile utility functions for enhanced mobile experience

/**
 * Haptic feedback for mobile devices
 */
export const hapticFeedback = {
  // Light tap feedback
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  },

  // Medium feedback for button presses
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  },

  // Strong feedback for important actions
  strong: () => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  },

  // Success pattern
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  // Error pattern
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  },

  // Long press feedback
  longPress: () => {
    if (navigator.vibrate) {
      navigator.vibrate(150);
    }
  }
};

/**
 * Mobile device detection
 */
export const deviceDetection = {
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  },

  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  isAndroid: () => {
    return /Android/.test(navigator.userAgent);
  },

  isTouchDevice: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  getScreenSize: () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: window.devicePixelRatio || 1
    };
  }
};

/**
 * Touch gesture utilities
 */
export const touchUtils = {
  // Calculate distance between two touch points
  getDistance: (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Calculate angle between two touch points
  getAngle: (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  },

  // Check if touch moved beyond threshold
  hasMoved: (startTouch, currentTouch, threshold = 10) => {
    const dx = Math.abs(currentTouch.clientX - startTouch.clientX);
    const dy = Math.abs(currentTouch.clientY - startTouch.clientY);
    return dx > threshold || dy > threshold;
  },

  // Get touch center point for multi-touch
  getCenter: (touches) => {
    let x = 0, y = 0;
    for (let touch of touches) {
      x += touch.clientX;
      y += touch.clientY;
    }
    return {
      x: x / touches.length,
      y: y / touches.length
    };
  }
};

/**
 * Mobile camera utilities
 */
export const cameraUtils = {
  // Check camera availability
  isAvailable: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      return false;
    }
  },

  // Get available cameras
  getCameras: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      return [];
    }
  },

  // Check if device has multiple cameras
  hasMultipleCameras: async () => {
    const cameras = await cameraUtils.getCameras();
    return cameras.length > 1;
  },

  // Get optimal camera constraints for mobile
  getConstraints: (facingMode = 'environment') => {
    return {
      video: {
        facingMode: facingMode,
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 30, max: 30 }
      },
      audio: false
    };
  }
};

/**
 * Mobile location utilities
 */
export const locationUtils = {
  // Check geolocation availability
  isAvailable: () => {
    return 'geolocation' in navigator;
  },

  // Get optimal location options for mobile
  getOptions: (highAccuracy = true) => {
    return {
      enableHighAccuracy: highAccuracy,
      timeout: highAccuracy ? 15000 : 10000,
      maximumAge: highAccuracy ? 30000 : 60000
    };
  },

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  },

  // Format accuracy for display
  formatAccuracy: (accuracy) => {
    if (accuracy <= 5) return 'Excellent';
    if (accuracy <= 10) return 'Good';
    if (accuracy <= 50) return 'Fair';
    return 'Poor';
  }
};

/**
 * Mobile performance utilities
 */
export const performanceUtils = {
  // Throttle function for touch events
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Debounce function for input events
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Request animation frame with fallback
  requestAnimFrame: (() => {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           function(callback) {
             window.setTimeout(callback, 1000 / 60);
           };
  })()
};

/**
 * Mobile storage utilities
 */
export const storageUtils = {
  // Check if localStorage is available
  isLocalStorageAvailable: () => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Safe localStorage operations
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
      return false;
    }
  },

  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
      return defaultValue;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Failed to remove from localStorage:', e);
      return false;
    }
  }
};

export default {
  hapticFeedback,
  deviceDetection,
  touchUtils,
  cameraUtils,
  locationUtils,
  performanceUtils,
  storageUtils
};
