# SILAS Component Documentation

This document provides comprehensive documentation for all SILAS platform components, including usage examples, accessibility guidelines, and best practices.

## Table of Contents

1. [Layout Components](#layout-components)
2. [Navigation Components](#navigation-components)
3. [Map Components](#map-components)
4. [Social Components](#social-components)
5. [UI Components](#ui-components)
6. [Accessibility Guidelines](#accessibility-guidelines)

## Layout Components

### AppLayout

The main application layout component that provides the overall structure and navigation.

**Props:**
- `children`: React.ReactNode | Function - Content to render or render function with props

**Features:**
- Integrated navigation (sidebar + top bar)
- URL state management for filters and view modes
- Keyboard shortcuts (⌘K search, A add pin, 1-3 view switching)
- Responsive design with mobile support

**Usage:**
```tsx
<AppLayout>
  {({ filteredPins, showAddPinModal, setShowAddPinModal }) => (
    <MapView 
      filteredPins={filteredPins}
      showAddPinModal={showAddPinModal}
      setShowAddPinModal={setShowAddPinModal}
    />
  )}
</AppLayout>
```

**Accessibility:**
- Focus management for modal states
- Keyboard navigation support
- Screen reader announcements for state changes
- Skip links for main content

## Navigation Components

### LeftSidebar

Collapsible sidebar with category filters, saved views, and quick stats.

**Props:**
- `isCollapsed`: boolean - Whether sidebar is collapsed
- `onToggleCollapse`: () => void - Toggle collapse handler
- `selectedCategories`: CategoryKey[] - Active category filters
- `onCategoryToggle`: (category: CategoryKey) => void - Category toggle handler
- `onClearFilters`: () => void - Clear all filters handler

**Features:**
- Category filtering with visual indicators
- Search functionality
- Saved views management
- Quick statistics display
- Responsive collapse behavior

**Accessibility:**
- ARIA labels for all interactive elements
- Keyboard navigation with arrow keys
- Focus management on collapse/expand
- Screen reader support for filter states

### TopNavbar

Main navigation bar with search, view modes, and user actions.

**Props:**
- `currentView`: 'map' | 'social' | 'data' - Active view mode
- `onViewChange`: (view) => void - View change handler
- `onAddPin`: () => void - Add pin action handler
- `searchQuery`: string - Current search query
- `onSearchChange`: (query: string) => void - Search change handler

**Features:**
- Global search with keyboard shortcut (⌘K)
- View mode toggle (Map/Social/Data)
- AI assistant integration
- Notifications system
- User profile menu

**Accessibility:**
- Keyboard shortcuts with visual indicators
- ARIA labels for all controls
- Focus management for dropdowns
- High contrast mode support

## Map Components

### MapView

Main map component with Mapbox GL integration and pin management.

**Props:**
- `filteredPins`: Pin[] - Pins to display on map
- `showAddPinModal`: boolean - Whether add pin modal is open
- `setShowAddPinModal`: (show: boolean) => void - Modal state handler

**Features:**
- High-performance GeoJSON rendering
- Category-aware clustering
- Hover previews with feature-state
- Right-click to add pins
- Optimized re-rendering

**Accessibility:**
- Keyboard navigation for map controls
- Screen reader descriptions for pins
- Focus management for interactive elements
- Alternative text for map imagery

### PinDrawer

Comprehensive pin details drawer with tabs and social features.

**Props:**
- `pin`: Pin | null - Pin to display
- `isOpen`: boolean - Whether drawer is open
- `onClose`: () => void - Close handler

**Features:**
- Tabbed interface (Overview, Media, Discussion, Activity)
- Social interactions (comments, reactions)
- Pin management actions
- Media gallery with lightbox
- Responsive design

**Accessibility:**
- Tab navigation with arrow keys
- Focus trapping when open
- ARIA labels for all sections
- Keyboard shortcuts for actions

## Social Components

### Comments

Threaded comment system with moderation features.

**Props:**
- `pinId`: string - Pin ID for comments

**Features:**
- Threaded discussions with replies
- Optimistic UI updates
- Real-time synchronization
- Moderation controls
- Rich text support

**Accessibility:**
- Semantic HTML structure
- ARIA labels for comment threads
- Keyboard navigation for replies
- Screen reader support for timestamps

### Reactions

Rich emoji-based reaction system.

**Props:**
- `pinId`: string - Pin ID for reactions
- `showAddButton`: boolean - Whether to show add reaction button
- `size`: 'sm' | 'md' | 'lg' - Size variant

**Features:**
- Multiple reaction types (like, love, support, pray, celebrate, concern)
- Real-time updates
- Optimistic UI
- Reaction picker interface

**Accessibility:**
- ARIA labels for reaction buttons
- Keyboard navigation for picker
- Screen reader announcements for changes
- High contrast mode support

## UI Components

### Button

Standardized button component with variants and accessibility.

**Variants:**
- `default`: Primary action button
- `outline`: Secondary action button
- `ghost`: Minimal button style
- `destructive`: Dangerous actions

**Sizes:**
- `sm`: Small button (32px height)
- `md`: Medium button (40px height)
- `lg`: Large button (48px height)

**Accessibility:**
- Minimum 44px touch target
- Focus indicators
- ARIA labels when needed
- Loading and disabled states

### Input

Form input component with validation and accessibility.

**Features:**
- Built-in validation states
- Error and success styling
- Label association
- Placeholder text

**Accessibility:**
- Proper label association
- Error message announcements
- Focus management
- Required field indicators

## Accessibility Guidelines

### General Principles

1. **Keyboard Navigation**
   - All interactive elements must be keyboard accessible
   - Logical tab order throughout the application
   - Visible focus indicators on all focusable elements
   - Escape key to close modals and dropdowns

2. **Screen Reader Support**
   - Semantic HTML structure
   - ARIA labels and descriptions where needed
   - Live regions for dynamic content updates
   - Alternative text for images and icons

3. **Color and Contrast**
   - Minimum 4.5:1 contrast ratio for normal text
   - Minimum 3:1 contrast ratio for large text
   - Color is not the only way to convey information
   - Support for high contrast mode

4. **Motion and Animation**
   - Respect `prefers-reduced-motion` setting
   - Provide alternatives to motion-based interactions
   - Keep animations under 5 seconds
   - Allow users to pause or disable animations

### Component-Specific Guidelines

#### Interactive Elements
- Minimum 44px touch target size
- Clear hover and focus states
- Descriptive labels and ARIA attributes
- Consistent interaction patterns

#### Forms
- Associate labels with form controls
- Provide clear error messages
- Use fieldsets for grouped controls
- Indicate required fields clearly

#### Navigation
- Consistent navigation structure
- Skip links for main content
- Breadcrumbs for deep navigation
- Clear current page indicators

#### Dynamic Content
- Use ARIA live regions for updates
- Provide loading states and progress indicators
- Handle focus management for route changes
- Announce important state changes

### Testing Checklist

- [ ] Keyboard navigation works throughout
- [ ] Screen reader can access all content
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible
- [ ] Motion respects user preferences
- [ ] Touch targets are minimum 44px
- [ ] Error messages are descriptive
- [ ] Loading states are announced

### Tools and Resources

- **axe-core**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation
- **Lighthouse**: Performance and accessibility audits
- **NVDA/JAWS**: Screen reader testing
- **Keyboard testing**: Tab, arrow keys, Enter, Escape
- **Color contrast analyzers**: WebAIM, Colour Contrast Analyser

For more detailed accessibility information, refer to the [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) and the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/).
