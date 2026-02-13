# Navigation and Layout System Guide

This guide covers the enhanced navigation and layout system for the SILAS platform, including floating sidebar navigation, floating action buttons, consistent page layouts, and navigation state management.

## Overview

The new system provides:
- **Centralized Navigation State Management** with persistence
- **Enhanced Floating Sidebar** with animations and contextual content
- **Improved Floating Action Buttons** with context-aware actions
- **Consistent Page Layout System** with unified spacing and typography
- **Advanced Navigation Features** including breadcrumbs, keyboard shortcuts, and history

## Core Components

### 1. Navigation State Management (`store/navigation.ts`)

Centralized Zustand store for all navigation-related state:

```typescript
import { useNavigationStore, useSidebarState, useSearchState } from '@/store/navigation'

// Basic usage
const { currentView, setCurrentView } = useNavigationStore()
const { state, toggle, setState } = useSidebarState()
const { query, setQuery, addToHistory } = useSearchState()
```

**Key Features:**
- Persistent sidebar state and preferences
- Search history and recent searches
- Navigation history with back/forward support
- Modal state management
- UI preferences (theme, reduced motion, etc.)

### 2. Enhanced Floating Sidebar (`components/navigation/EnhancedFloatingSidebar.tsx`)

Responsive sidebar with animations and contextual content:

```typescript
import EnhancedFloatingSidebar from '@/components/navigation/EnhancedFloatingSidebar'

<EnhancedFloatingSidebar
  onAddPin={() => console.log('Add pin')}
  className="custom-styles"
/>
```

**Features:**
- Auto-hide on mobile when not pinned
- Navigation history with back/forward buttons
- Contextual quick actions
- Smooth animations with Framer Motion
- Pin/unpin functionality

### 3. Enhanced Floating Widgets (`components/ui/FloatingWidgets.tsx`)

Context-aware floating action buttons and widgets:

```typescript
import { FloatingWidgets, FloatingActionButton } from '@/components/ui/FloatingWidgets'

<FloatingWidgets
  onAddPin={() => console.log('Add pin')}
  onOpenChat={() => console.log('Open chat')}
  onShowNotifications={() => console.log('Show notifications')}
/>

// Individual button
<FloatingActionButton
  icon={Plus}
  label="Add Item"
  onClick={() => {}}
  color="primary"
  size="lg"
  badge={3}
  pulse={true}
/>
```

**Features:**
- Context-aware actions based on current page
- Expandable action groups
- Animated tooltips and badges
- Responsive behavior
- Customizable colors and sizes

### 4. Page Layout System (`components/layout/PageLayout.tsx`)

Consistent layout components with unified spacing:

```typescript
import { PageLayout, PageHeader, PageContent, PageSection } from '@/components/layout/PageLayout'

<PageLayout>
  <PageHeader
    title="Page Title"
    subtitle="Page subtitle"
    description="Page description"
    badge="Beta"
    actions={<Button>Action</Button>}
    breadcrumbs={[
      { label: 'Home', href: '/', icon: Home },
      { label: 'Current', href: '/current' }
    ]}
  />
  
  <PageContent maxWidth="lg" padding="lg">
    <PageSection
      title="Section Title"
      description="Section description"
      collapsible={true}
      headerActions={<Button>Section Action</Button>}
    >
      Section content
    </PageSection>
  </PageContent>
</PageLayout>
```

### 5. Advanced Navigation Features (`components/navigation/NavigationFeatures.tsx`)

Breadcrumbs, keyboard shortcuts, and navigation history:

```typescript
import { 
  Breadcrumbs, 
  NavigationHistory, 
  KeyboardShortcuts, 
  PageTransition,
  CommandPalette 
} from '@/components/navigation/NavigationFeatures'

// Auto-generated breadcrumbs
<Breadcrumbs showHome={true} />

// Custom breadcrumbs
<Breadcrumbs items={[
  { label: 'Home', href: '/', icon: Home },
  { label: 'Dashboard', href: '/dashboard' }
]} />

// Navigation history controls
<NavigationHistory />

// Page transitions
<PageTransition>
  <YourPageContent />
</PageTransition>

// Command palette
<CommandPalette
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

### 6. Unified Layout System (`components/layout/UnifiedLayout.tsx`)

Complete layout system that brings everything together:

```typescript
import UnifiedLayout, { DashboardLayout, ContentLayout, MapLayout } from '@/components/layout/UnifiedLayout'

// Full customization
<UnifiedLayout
  pageTitle="Custom Page"
  pageSubtitle="Subtitle"
  pageDescription="Description"
  pageBadge="Beta"
  pageActions={<Button>Action</Button>}
  breadcrumbItems={breadcrumbs}
  showFloatingNav={true}
  showSidebar={true}
  showFloatingWidgets={true}
  contentMaxWidth="lg"
  onAddPin={() => {}}
  onOpenChat={() => {}}
>
  <YourContent />
</UnifiedLayout>

// Pre-configured layouts
<DashboardLayout pageTitle="Dashboard">
  <DashboardContent />
</DashboardLayout>

<ContentLayout pageTitle="Article">
  <ArticleContent />
</ContentLayout>

<MapLayout>
  <MapComponent />
</MapLayout>
```

## Usage Patterns

### Dashboard Pages

```typescript
export default function DashboardPage() {
  return (
    <DashboardLayout
      pageTitle="Community Dashboard"
      pageSubtitle="Overview of community activity"
      pageBadge="Live"
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard', href: '/dashboard' }
      ]}
      pageActions={
        <Button onClick={() => console.log('Export data')}>
          Export Data
        </Button>
      }
    >
      <PageSection title="Statistics">
        <StatsGrid />
      </PageSection>
      
      <PageSection title="Recent Activity">
        <ActivityFeed />
      </PageSection>
    </DashboardLayout>
  )
}
```

### Content Pages

```typescript
export default function ArticlePage() {
  return (
    <ContentLayout
      pageTitle="Community Guidelines"
      pageSubtitle="How to participate effectively"
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: 'Community', href: '/community' },
        { label: 'Guidelines', href: '/community/guidelines' }
      ]}
    >
      <div className="prose max-w-none">
        <ArticleContent />
      </div>
    </ContentLayout>
  )
}
```

### Map Pages

```typescript
export default function MapPage() {
  return (
    <MapLayout
      onAddPin={() => openAddPinModal()}
      onOpenChat={() => openChatWidget()}
    >
      <InteractiveMap />
    </MapLayout>
  )
}
```

## Keyboard Shortcuts

The system includes built-in keyboard shortcuts:

- `Cmd/Ctrl + K` - Open search/command palette
- `A` - Add new pin
- `H` - Go to home
- `M` - Go to map
- `F` - Go to fund
- `Cmd/Ctrl + S` - Open settings
- `?` - Show keyboard shortcuts
- `Escape` - Close modals/clear filters

## Customization

### Theme and Preferences

```typescript
import { useNavigationStore } from '@/store/navigation'

const { preferences, updatePreferences } = useNavigationStore()

// Update preferences
updatePreferences({
  theme: 'dark',
  reducedMotion: true,
  compactMode: false,
  floatingWidgetsEnabled: true
})
```

### Layout Modes

```typescript
const { layoutMode, setLayoutMode } = useNavigationStore()

// Switch between layout modes
setLayoutMode('floating') // Floating sidebar
setLayoutMode('sidebar')  // Fixed sidebar
setLayoutMode('minimal')  // Minimal UI
```

## Best Practices

1. **Use appropriate layout components** for different page types
2. **Provide meaningful breadcrumbs** for deep navigation
3. **Include contextual actions** in page headers
4. **Use consistent spacing** with the PageContent component
5. **Implement keyboard shortcuts** for power users
6. **Respect user preferences** for animations and widgets
7. **Test responsive behavior** across different screen sizes

## Migration Guide

To migrate existing pages to the new system:

1. Replace existing layout components with `UnifiedLayout` or its variants
2. Update navigation state management to use the new store
3. Replace custom floating elements with the enhanced widgets
4. Add breadcrumbs and page headers where appropriate
5. Implement keyboard shortcuts for key actions

## Examples

See `app/example-page.tsx` for complete examples of:
- Dashboard layout with stats and activity feeds
- Content layout with collapsible sections
- Map layout with floating controls
- Custom layout with full configuration options
