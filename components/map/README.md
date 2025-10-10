# SILAS Map Components

This directory contains the core map interface components for the SILAS community platform. These components provide a production-ready, map-first experience with real-time updates, clustering, and comprehensive pin management.

## Architecture Overview

The map system is built on **Mapbox GL JS** and follows a layered architecture:

1. **MapRoot** - Main container and orchestrator
2. **PinLayer** - Handles pin rendering and clustering
3. **PinMarker** - Individual pin components
4. **PinPreviewTooltip** - Guest user preview system
5. **Real-time hooks** - Live data synchronization

## Components

### MapRoot

The primary map component that initializes Mapbox GL JS and orchestrates all map interactions.

**Props:**
```typescript
interface MapRootProps {
  activeCategory?: CategoryKey
  filters?: MapFilters
  onPinSelect: (pin: Pin) => void
  onPinHover?: (pin: Pin | null) => void
  onMapMove?: (viewState: MapViewState) => void
  className?: string
  style?: React.CSSProperties
}
```

**Features:**
- Mapbox GL JS initialization with Stoneclough village defaults
- Real-time pin data fetching with bounding box optimization
- Category-aware filtering
- Navigation and geolocate controls
- Error handling and performance monitoring
- Accessibility compliance (WCAG 2.1 AA)

**Usage:**
```tsx
<MapRoot
  activeCategory="community"
  filters={{
    categories: ['community', 'events'],
    status: ['published'],
    author_type: []
  }}
  onPinSelect={(pin) => console.log('Selected:', pin)}
  onPinHover={(pin) => console.log('Hovered:', pin)}
  onMapMove={(viewState) => console.log('Map moved:', viewState)}
/>
```

### PinLayer

Handles the rendering of pins as Mapbox GL layers with advanced clustering and styling.

**Props:**
```typescript
interface PinLayerProps {
  map: mapboxgl.Map
  pins: Pin[]
  selectedPinId?: string
  hoveredPinId?: string
  filters: MapFilters
  onPinClick: (pin: Pin) => void
  onPinHover: (pin: Pin | null, event?: MouseEvent) => void
  showClustering?: boolean
  clusterRadius?: number
}
```

**Features:**
- Category-aware clustering with intelligent color coding
- Feature-state driven interactions (no React re-renders)
- Status badges for draft/proposed pins
- Multi-category indicators
- Project relationship visualization
- Performance-optimized GeoJSON rendering

**Layer Structure:**
- `clusters` - Cluster circles with category-based colors
- `cluster-count` - Cluster count labels
- `unclustered-pins` - Individual pin circles
- `pin-badges` - Status indicators for draft/proposed pins

### PinMarker

React component for individual pin rendering (used outside of map layers).

**Props:**
```typescript
interface PinMarkerProps {
  pin: Pin
  isSelected?: boolean
  isHovered?: boolean
  onClick: (pin: Pin) => void
  onHover: (pin: Pin | null) => void
  size?: 'small' | 'medium' | 'large'
  showBadge?: boolean
}
```

**Features:**
- Category-specific icons and colors
- Status badges and indicators
- Multi-category support
- Project relationship indicators
- Hover and selection states
- Accessibility enhancements

### PinPreviewTooltip

Guest user preview system with authentication gating.

**Props:**
```typescript
interface PinPreviewTooltipProps {
  pin: Pin
  position: { x: number; y: number }
  isVisible: boolean
  onClose: () => void
  onSignInClick: () => void
}
```

**Features:**
- Lightweight pin preview for unauthenticated users
- Smart positioning to stay within viewport
- Authentication call-to-action
- Mobile-optimized variant
- Portal-based rendering

## Hooks

### useRealtimePins

Comprehensive hook for real-time pin data management.

**Features:**
- Real-time Supabase subscriptions
- Optimistic updates for immediate UI feedback
- Bounding box and filter-based queries
- Error handling and retry logic
- Performance monitoring

**Usage:**
```tsx
const {
  pins,
  loading,
  error,
  refetch,
  addOptimisticPin,
  updateOptimisticPin,
  removeOptimisticPin
} = useRealtimePins({
  filters: mapFilters,
  boundingBox: currentBounds,
  onPinAdded: (pin) => console.log('New pin:', pin),
  onPinUpdated: (pin) => console.log('Updated pin:', pin),
  onPinDeleted: (pinId) => console.log('Deleted pin:', pinId)
})
```

### useRealtimePin

Hook for single pin real-time updates.

**Usage:**
```tsx
const { pin, loading, error, refetch } = useRealtimePin(pinId)
```

## Performance Optimizations

### 1. Feature-State Driven Interactions
- Uses Mapbox GL feature states instead of React re-renders
- Hover and selection states managed at the map level
- Eliminates expensive DOM updates

### 2. Intelligent Clustering
- Category-aware clustering with dominant category detection
- Configurable cluster radius and zoom levels
- Efficient cluster expansion on click

### 3. Optimistic Updates
- Immediate UI feedback for user actions
- Automatic reconciliation with server state
- Graceful error handling and rollback

### 4. Bounding Box Queries
- Only fetches pins within current viewport
- Automatic re-fetching on map movement
- Configurable query limits

### 5. Memoization and Caching
- Memoized GeoJSON conversion
- Pin lookup maps for O(1) access
- Stable callback references

## Accessibility Features

### WCAG 2.1 AA Compliance
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

### Keyboard Navigation
- Tab navigation through interactive elements
- Enter/Space activation for pins
- Escape key to close tooltips
- Arrow keys for cluster navigation

### Screen Reader Support
- Descriptive labels for all interactive elements
- Live region announcements for state changes
- Alternative text for visual indicators
- Semantic HTML structure

## Testing

### Unit Tests
- Component rendering and props
- Event handling and callbacks
- State management and updates
- Error conditions and edge cases

### Integration Tests
- Mapbox GL JS integration
- Real-time subscription handling
- Filter and query logic
- Performance benchmarks

### Accessibility Tests
- Keyboard navigation flows
- Screen reader compatibility
- Color contrast validation
- Focus management

## Configuration

### Environment Variables
```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
NEXT_PUBLIC_MAPBOX_STYLE=mapbox://styles/mapbox/streets-v12
```

### Default Settings
```typescript
// Stoneclough village coordinates
const DEFAULT_VIEW_STATE = {
  longitude: -2.4833,
  latitude: 53.5500,
  zoom: 15,
  bearing: 0,
  pitch: 0
}

// Performance settings
const DEFAULT_CLUSTER_RADIUS = 50
const DEFAULT_MAX_ZOOM = 20
const DEFAULT_MIN_ZOOM = 10
const DEFAULT_PIN_LIMIT = 1000
```

## Error Handling

### Graceful Degradation
- Fallback when Mapbox token is missing
- Error boundaries for component failures
- Retry logic for network failures
- User-friendly error messages

### Monitoring Integration
- Performance tracking with Web Vitals
- Error logging with context
- Real-time monitoring dashboards
- Alerting for critical failures

## Browser Support

### Modern Browsers
- Chrome 80+
- Firefox 78+
- Safari 13+
- Edge 80+

### Mobile Support
- iOS Safari 13+
- Chrome Mobile 80+
- Samsung Internet 12+

### WebGL Requirements
- WebGL 1.0 support required for Mapbox GL JS
- Hardware acceleration recommended
- Fallback messaging for unsupported browsers

## Contributing

### Development Setup
1. Install dependencies: `pnpm install`
2. Set environment variables
3. Run tests: `pnpm test`
4. Start development server: `pnpm dev`

### Code Standards
- TypeScript strict mode
- ESLint + Prettier formatting
- Jest unit tests for all components
- Accessibility testing with axe-core

### Performance Guidelines
- Minimize React re-renders
- Use feature states for map interactions
- Implement proper memoization
- Monitor bundle size impact
