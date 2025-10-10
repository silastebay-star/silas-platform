# Map-Centric Interface Guide

This guide covers the new map-centric interface architecture for the SILAS platform, where the interactive map serves as the primary interface with all functionality accessible through floating overlay panels.

## Overview

The map-centric interface transforms the traditional page-based navigation into a spatial, map-first experience where:

- **The map is always visible** and serves as the primary interface
- **All features are accessible** through floating overlay panels
- **Spatial context is maintained** while accessing different platform features
- **Multiple panels can be open simultaneously** for enhanced productivity
- **Panel interactions don't interrupt** the map experience

## Architecture Components

### 1. Panel Management System (`store/panels.ts`)

Centralized state management for all floating panels:

```typescript
import { usePanelStore, usePanelActions, PanelType } from '@/store/panels'

// Open a panel
const { openPanel } = usePanelActions()
openPanel('community') // Returns panel ID

// Panel state management
const panels = usePanelStore(state => state.panels)
const openPanels = usePanelStore(state => state.getOpenPanels())
```

**Key Features:**
- Panel positioning and collision detection
- Z-index management for layering
- State persistence across sessions
- Multi-instance support for certain panel types
- Automatic positioning to avoid overlaps

### 2. Floating Header Navigation (`components/navigation/FloatingHeader.tsx`)

Compact floating navigation that provides access to all panels:

```typescript
import FloatingHeader from '@/components/navigation/FloatingHeader'

<FloatingHeader 
  onAddPin={() => console.log('Add pin')}
  className="custom-styles"
/>
```

**Features:**
- Panel menu with descriptions and shortcuts
- Search functionality with command palette
- Notifications and user menu
- Minimized panels bar
- Panel management controls (arrange, minimize all)

### 3. Floating Panel System (`components/panels/FloatingPanel.tsx`)

Resizable, movable, minimizable overlay panels:

```typescript
import FloatingPanel from '@/components/panels/FloatingPanel'

<FloatingPanel id="panel-id">
  <YourPanelContent />
</FloatingPanel>
```

**Panel Controls:**
- **Drag to move** - Click and drag the header
- **Resize handles** - Drag corners and edges to resize
- **Minimize** - Click minimize button or use shortcuts
- **Maximize** - Click maximize button for full-screen
- **Close** - Click X button or use Escape key

### 4. Panel Content Components (`components/panels/PanelContent.tsx`)

Pre-built content components for different panel types:

```typescript
import { 
  CommunityPanelContent,
  FundPanelContent,
  ChatPanelContent,
  SettingsPanelContent,
  SearchPanelContent 
} from '@/components/panels/PanelContent'
```

### 5. Map-Centric Layout (`components/layout/MapCentricLayout.tsx`)

Primary layout component that orchestrates the entire interface:

```typescript
import MapCentricLayout, { 
  CommunityMapLayout, 
  DevelopmentMapLayout 
} from '@/components/layout/MapCentricLayout'

<MapCentricLayout
  showFloatingHeader={true}
  showFloatingWidgets={true}
  onAddPin={() => console.log('Add pin')}
>
  <YourMapComponent />
</MapCentricLayout>
```

## Usage Patterns

### Basic Implementation

```typescript
import { CommunityMapLayout } from '@/components/layout/MapCentricLayout'
import InteractiveMap from '@/components/map/InteractiveMap'

export default function MapPage() {
  return (
    <CommunityMapLayout onAddPin={handleAddPin}>
      <InteractiveMap />
    </CommunityMapLayout>
  )
}
```

### Opening Panels Programmatically

```typescript
import { usePanelStore } from '@/store/panels'

function MapComponent() {
  const { openPanel } = usePanelStore()
  
  const handlePinClick = (pinType: string) => {
    switch (pinType) {
      case 'community':
        openPanel('community')
        break
      case 'funding':
        openPanel('fund')
        break
      case 'event':
        openPanel('events')
        break
    }
  }
  
  return (
    <div onClick={() => handlePinClick('community')}>
      Community Pin
    </div>
  )
}
```

### Route-Based Panel Opening

```typescript
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { usePanelStore } from '@/store/panels'

function RouteHandler() {
  const pathname = usePathname()
  const { openPanel } = usePanelStore()
  
  useEffect(() => {
    // Open panels based on route
    if (pathname.startsWith('/community')) {
      openPanel('community')
    } else if (pathname.startsWith('/fund')) {
      openPanel('fund')
    }
  }, [pathname, openPanel])
  
  return null
}
```

### Custom Panel Content

```typescript
import FloatingPanel from '@/components/panels/FloatingPanel'

function CustomPanelContent() {
  return (
    <div className="p-4">
      <h2>Custom Panel</h2>
      <p>Your custom content here</p>
    </div>
  )
}

// Register custom panel
const customPanelId = openPanel('custom', {
  title: 'Custom Panel',
  position: { x: 100, y: 100, width: 400, height: 300 }
})
```

## Panel Types and Configuration

### Available Panel Types

- **`community`** - Community discussions and updates
- **`fund`** - Community funding projects
- **`events`** - Community events and calendar
- **`economy`** - Local business directory
- **`environment`** - Sustainability initiatives
- **`ai`** - AI copilot and insights
- **`settings`** - Application settings
- **`profile`** - User profile management
- **`notifications`** - Notification center
- **`search`** - Search interface
- **`chat`** - Community chat

### Panel Configuration Options

```typescript
interface PanelConfig {
  title: string
  position: { x: number, y: number, width: number, height: number }
  isResizable: boolean
  isMovable: boolean
  isMinimizable: boolean
  isMaximizable: boolean
  minWidth: number
  minHeight: number
  maxWidth?: number
  maxHeight?: number
  isModal: boolean // Blocks map interaction
  allowMultiple: boolean // Allow multiple instances
}
```

## Keyboard Shortcuts

### Global Shortcuts
- `Alt + C` - Open Community panel
- `Alt + F` - Open Fund panel
- `Alt + E` - Open Events panel
- `Alt + T` - Open Chat panel
- `Alt + S` - Open Search panel

### Panel Management
- `Ctrl/Cmd + M` - Minimize all panels
- `Ctrl/Cmd + Shift + A` - Arrange all panels
- `Ctrl/Cmd + Escape` - Close all panels

### Quick Panel Access
- `Ctrl/Cmd + 1` - Open Community panel
- `Ctrl/Cmd + 2` - Open Fund panel
- `Ctrl/Cmd + 3` - Open Events panel
- `Ctrl/Cmd + 4` - Open Chat panel
- `Ctrl/Cmd + ,` - Open Settings panel

## Best Practices

### Panel Design
1. **Keep content focused** - Each panel should have a clear, specific purpose
2. **Design for resizing** - Content should adapt to different panel sizes
3. **Use consistent layouts** - Follow established patterns for headers, content, and actions
4. **Provide clear navigation** - Include breadcrumbs and clear section headers

### User Experience
1. **Maintain map visibility** - Avoid blocking the map unnecessarily
2. **Use appropriate panel sizes** - Start with sensible default sizes
3. **Provide visual feedback** - Show active panels and states clearly
4. **Support keyboard navigation** - Implement comprehensive keyboard shortcuts

### Performance
1. **Lazy load panel content** - Only load content when panels are opened
2. **Optimize panel rendering** - Use React.memo and proper dependencies
3. **Manage panel state efficiently** - Clean up unused panels
4. **Limit simultaneous panels** - Consider UX impact of too many open panels

## Migration from Traditional Pages

### Step 1: Identify Page Content
```typescript
// Before: Traditional page
export default function CommunityPage() {
  return (
    <Layout>
      <CommunityContent />
    </Layout>
  )
}

// After: Panel content component
export function CommunityPanelContent() {
  return <CommunityContent />
}
```

### Step 2: Update Navigation
```typescript
// Before: Link to page
<Link href="/community">Community</Link>

// After: Open panel
<button onClick={() => openPanel('community')}>
  Community
</button>
```

### Step 3: Handle Routes
```typescript
// Route handler to open panels based on URL
useEffect(() => {
  if (pathname === '/community') {
    openPanel('community')
  }
}, [pathname])
```

## Development Tools

### Panel Debugger
Enable development mode to see panel debug information:

```typescript
<MapCentricLayout showPanelDebugger={true}>
  <YourMap />
</MapCentricLayout>
```

### Panel State Inspection
```typescript
// Get all panel states
const panels = usePanelStore(state => state.panels)
console.log('Current panels:', panels)

// Get specific panel
const communityPanel = usePanelStore(state => 
  state.getPanelsByType('community')[0]
)
```

## Examples

See `app/map-centric-example.tsx` for complete examples including:
- Basic map-centric interface
- Development mode with debug info
- Custom welcome overlay
- Route-based panel opening
- Interactive map with clickable pins

The map-centric interface provides a revolutionary way to interact with community data while maintaining spatial context and enabling efficient multitasking through floating panels.
