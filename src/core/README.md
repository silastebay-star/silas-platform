# SILAS Core Library

The core library contains all shared components, hooks, utilities, and services used across SILAS modules.

## 🧩 Architecture Principles

- **Framework-agnostic**: All core components should be reusable across modules
- **Single responsibility**: Each component/hook has one clear purpose
- **Consistent API**: Standardized props and return patterns
- **Type-safe**: Full TypeScript coverage for all exports

## 📁 Structure

```
/core
├── /components     # Shared UI components (Button, Modal, etc.)
├── /hooks         # Shared React hooks (useAuth, useSupabase, etc.)
├── /context       # Global React contexts (Theme, Auth, etc.)
├── /lib           # External service clients (Supabase, etc.)
├── /types         # Shared TypeScript types
├── /utils         # Pure utility functions
├── /styles        # Global styles and design tokens
└── index.ts       # Main exports
```

## 🎨 Design System

All core components follow the SILAS design system:
- Primary color: `#4C764C` (SILAS Green)
- Typography: Orbitron (headings) + Inter (body)
- Consistent spacing, shadows, and animations
- Mobile-first responsive design

## 🔧 Usage

Import from core using the barrel export:

```tsx
import { Button, Modal, useAuth, supabase } from '@/core';
```

## 📋 Component Standards

All core components must include:
- TypeScript interface for props
- Default props where appropriate
- JSDoc comments for complex props
- Storybook stories (when applicable)
- Unit tests for logic

## 🧪 Testing

Core components are tested with:
- Jest + React Testing Library
- 90%+ test coverage required
- Integration tests for hooks with external services

## 🚀 Adding New Core Components

1. Create component in appropriate subfolder
2. Add TypeScript types
3. Write unit tests
4. Update barrel export in `index.ts`
5. Document in this README
