# Pins Module

The Pins module manages all map pin functionality including creation, display, clustering, and interaction.

## 🎯 Purpose

- Create and manage community pins on the map
- Handle pin clustering and map overlays
- Manage pin photos and metadata
- Provide pin search and filtering
- Handle pin social interactions

## 🏗️ Architecture

```
/pins
├── /components     # Pin-specific UI components
├── /hooks         # Pin-related React hooks
├── /services      # Pin API and data services
├── /types         # Pin TypeScript types
├── /pages         # Pin-specific pages/views
├── /utils         # Pin utility functions
└── index.ts       # Module exports
```

## 🧩 Key Components

- **PinCard**: Display pin information in cards
- **PinForm**: Create/edit pin form
- **PinMapLayer**: Map layer for pin rendering
- **PinCluster**: Handle pin clustering on map
- **PinDetail**: Detailed pin view modal

## 🔗 Dependencies

- Core components (Button, Modal, etc.)
- Map library (Mapbox GL)
- Supabase for data persistence
- Social module for interactions

## 📊 Data Flow

1. User creates pin via PinForm
2. Pin data saved to Supabase
3. Map updates with new pin
4. Real-time updates via Supabase subscriptions

## 🧪 Testing

- Unit tests for components
- Integration tests for API calls
- E2E tests for pin creation flow

## 🚀 Usage

```tsx
import { PinCard, usePins, PinForm } from '@/modules/pins';

const MyComponent = () => {
  const { pins, loading } = usePins();
  
  return (
    <div>
      {pins.map(pin => (
        <PinCard key={pin.id} pin={pin} />
      ))}
    </div>
  );
};
```
