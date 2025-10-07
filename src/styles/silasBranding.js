// SILAS Branding System - Consistent design across all components
export const SILAS_BRANDING = {
  // Core Brand Colors
  colors: {
    primary: '#2563EB', // SILAS Blue
    primaryDark: '#1D4ED8',
    primaryLight: '#3B82F6',
    secondary: '#7C3AED', // SILAS Purple
    secondaryDark: '#6D28D9',
    secondaryLight: '#8B5CF6',
    accent: '#10B981', // SILAS Green
    accentDark: '#059669',
    accentLight: '#34D399',
    
    // SILAS Category Framework v2.0 Colors
    faith: '#8B5CF6', // Faith & Fellowship - Purple (spiritual, hopeful)
    commerce: '#10B981', // Commerce & Trade - Green (prosperity, growth)
    works: '#F59E0B', // Works & Infrastructure - Orange (construction, energy)
    circle: '#EF4444', // Circle & Community - Red (connection, warmth)
    mind: '#3B82F6', // Mind & Learning - Blue (knowledge, wisdom)
    pulse: '#EC4899', // Pulse & Wellness - Pink (health, vitality)

    // Enhanced category variations
    faithLight: '#A78BFA',
    faithDark: '#7C3AED',
    commerceLight: '#34D399',
    commerceDark: '#059669',
    worksLight: '#FBBF24',
    worksDark: '#D97706',
    circleLight: '#F87171',
    circleDark: '#DC2626',
    mindLight: '#60A5FA',
    mindDark: '#2563EB',
    pulseLight: '#F472B6',
    pulseDark: '#DB2777',

    // Neutral Colors
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827'
    },
    
    // Status Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },

  // Typography
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    }
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    silas: '0 20px 40px -12px rgba(37, 99, 235, 0.25)' // SILAS branded shadow
  },

  // Animations
  animations: {
    transition: {
      fast: '150ms ease-in-out',
      normal: '300ms ease-in-out',
      slow: '500ms ease-in-out'
    },
    bounce: 'bounce 1s infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    spin: 'spin 1s linear infinite'
  },

  // Component Styles
  components: {
    button: {
      primary: {
        background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
        hover: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
        text: '#FFFFFF',
        shadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)'
      },
      secondary: {
        background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
        hover: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
        text: '#FFFFFF',
        shadow: '0 4px 14px 0 rgba(124, 58, 237, 0.39)'
      },
      accent: {
        background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        hover: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        text: '#FFFFFF',
        shadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)'
      }
    },
    
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      shadow: '0 20px 40px -12px rgba(0, 0, 0, 0.1)',
      borderRadius: '1rem'
    },

    panel: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
      backdrop: 'blur(20px)',
      border: '1px solid rgba(37, 99, 235, 0.1)',
      shadow: '0 25px 50px -12px rgba(37, 99, 235, 0.15)',
      borderRadius: '1.5rem'
    },

    floatingButton: {
      background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
      hover: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
      shadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
      borderRadius: '50%'
    }
  },

  // Brand Assets
  assets: {
    logo: {
      primary: '/assets/silas-logo.png',
      white: '/assets/silas-logo-white.png',
      icon: '/assets/silas-icon.png'
    },
    patterns: {
      subtle: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%232563EB" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      grid: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%232563EB" fill-opacity="0.03"%3E%3Cpath d="M0 0h40v40H0z"/%3E%3Cpath d="M0 20h40v1H0zM20 0v40h1V0z"/%3E%3C/g%3E%3C/svg%3E")'
    }
  }
};

// Utility functions for consistent styling
export const getSilasColor = (colorPath) => {
  const keys = colorPath.split('.');
  let value = SILAS_BRANDING.colors;
  
  for (const key of keys) {
    value = value[key];
    if (!value) return SILAS_BRANDING.colors.primary;
  }
  
  return value;
};

export const getSilasGradient = (type = 'primary') => {
  return SILAS_BRANDING.components.button[type]?.background || SILAS_BRANDING.components.button.primary.background;
};

export const getSilasShadow = (type = 'md') => {
  return SILAS_BRANDING.shadows[type] || SILAS_BRANDING.shadows.md;
};

export const getCategoryColor = (category) => {
  const categoryKey = category?.toLowerCase();
  return SILAS_BRANDING.colors[categoryKey] || SILAS_BRANDING.colors.primary;
};

export const getCategoryGradient = (category) => {
  const color = getCategoryColor(category);
  return `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`;
};

// CSS-in-JS helper for styled components
export const silasTheme = {
  ...SILAS_BRANDING,
  // Helper methods
  color: getSilasColor,
  gradient: getSilasGradient,
  shadow: getSilasShadow,
  categoryColor: getCategoryColor,
  categoryGradient: getCategoryGradient
};

export default SILAS_BRANDING;
