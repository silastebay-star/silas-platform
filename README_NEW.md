# 🗺️ SILAS Platform

**Stoneclough Initiative for Local & Autonomous Systems**

A faith-guided, data-informed community intelligence platform that empowers communities to vote, build, restore, and thrive through transparent collaboration.

![SILAS Platform](https://img.shields.io/badge/SILAS-Community%20Platform-4C764C?style=for-the-badge)
![Version](https://img.shields.io/badge/version-3.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

## 🎯 Overview

SILAS is a production-ready, modular community platform designed for Stoneclough village that brings together:

- **Interactive community mapping** with real-time pin management
- **Social collaboration** through comments, reactions, and sharing
- **Democratic funding** via community proposals and voting
- **Category-based organization** across 8 community pillars
- **AI-powered assistance** for community guidance
- **Mobile-first design** for accessibility

## ✨ Features

### 🗺️ **Interactive Community Map**
- Real-time pin creation and management
- Category-based filtering and clustering
- Spatial search with PostGIS integration
- Photo uploads and rich metadata
- Mobile-responsive pin dropping

### 🤝 **Social Collaboration**
- Threaded comments system
- Reaction system (like, love, support, pray, etc.)
- Social sharing across platforms
- Real-time activity feeds
- User interaction tracking

### 💰 **Community Fund**
- Democratic proposal system
- Community voting on fund allocation
- Stripe integration for subscriptions
- Transparent transaction ledger
- Real-time fund balance tracking

### 🏗️ **Modular Architecture**
- Clean separation of concerns
- Independent module development
- Scalable team collaboration
- Comprehensive TypeScript coverage
- Production-ready code quality

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite + TypeScript | Modern, fast development |
| **Styling** | Tailwind CSS + Shadcn/UI | Consistent, responsive design |
| **Backend** | Supabase (PostgreSQL + PostGIS) | Real-time database with spatial data |
| **Maps** | Mapbox GL JS | Interactive mapping |
| **State** | Zustand | Lightweight state management |
| **Auth** | Supabase Auth | Secure authentication |
| **Payments** | Stripe | Community fund subscriptions |
| **Deployment** | Vercel | Edge deployment |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account
- Mapbox account (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/silas-platform.git
cd silas-platform

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Setup

Create `.env.local` with your credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Mapbox for enhanced mapping
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Optional: Stripe for community fund
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## 📁 Project Structure

```
silas-platform/
├── src/
│   ├── core/                 # Shared components, hooks, utilities
│   │   ├── components/       # Button, Modal, Card, etc.
│   │   ├── hooks/           # useAuth, useSupabase, etc.
│   │   ├── lib/             # Supabase client, API helpers
│   │   ├── types/           # Shared TypeScript types
│   │   └── utils/           # Utility functions
│   ├── modules/             # Feature modules
│   │   ├── pins/            # Pin management system
│   │   ├── social/          # Social features
│   │   ├── fund/            # Community fund
│   │   ├── economy/         # Local business features
│   │   ├── environment/     # Environmental tracking
│   │   ├── events/          # Community events
│   │   ├── auth/            # Authentication
│   │   └── ai/              # AI copilot
│   ├── pages/               # Route pages
│   ├── router/              # App routing
│   └── styles/              # Global styles
├── supabase/
│   └── migrations/          # Database migrations
├── docs/                    # Documentation
└── public/                  # Static assets
```

## 🧩 Module System

SILAS uses a modular architecture where each feature is self-contained:

```tsx
// Clean imports from modules
import { PinCard, usePins } from '@/modules/pins';
import { CommentList, useComments } from '@/modules/social';
import { FundDashboard, useFundBalance } from '@/modules/fund';
import { Button, Modal } from '@/core';
```

Each module includes:
- **Components** - React components
- **Hooks** - Custom React hooks  
- **Services** - API integration
- **Types** - TypeScript definitions
- **Pages** - Route components

## 🎨 Design System

SILAS follows a consistent design system:

### Colors
- **Primary**: `#4C764C` (SILAS Green)
- **Categories**: Each pillar has its own color
- **Neutrals**: Gray scale for text and backgrounds

### Typography
- **Headings**: Orbitron (monospace)
- **Body**: Inter (sans-serif)

### Components
All components follow the SILAS design system with consistent spacing, shadows, and animations.

## 📊 Community Pillars

SILAS organizes community life around 8 core pillars:

1. **🔶 Faith & Fellowship** - Spiritual life and community bonds
2. **🔶 Projects & Infrastructure** - Building resilient infrastructure  
3. **🔶 Economy & Commerce** - Local business and entrepreneurship
4. **🔶 Environment & Sustainability** - Environmental protection
5. **🔶 Community & Social** - Social connections and events
6. **🔶 Heritage & Culture** - Historical preservation
7. **🔶 Wellbeing & Health** - Community health and wellness
8. **🔶 Governance & Civic** - Democratic participation

## 🚀 Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Production (Vercel)
```bash
# Deploy to Vercel
vercel deploy

# Or connect your GitHub repo to Vercel for automatic deployments
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting
5. Commit with conventional commits
6. Push and create a Pull Request

### Module Development
Each module can be developed independently:
- Follow the established module structure
- Include comprehensive TypeScript types
- Add unit tests for components and hooks
- Update module documentation

## 📚 Documentation

- [Development Guide](./docs/DEVELOPMENT.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Brand Guidelines](./docs/BRAND.md)

## 🔒 Security

- Row Level Security (RLS) with Supabase
- Secure authentication flows
- Input validation and sanitization
- HTTPS everywhere in production

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stoneclough Community** - For inspiration and feedback
- **Supabase** - For the amazing backend platform
- **Vercel** - For seamless deployment
- **Open Source Community** - For the incredible tools and libraries

---

**Built with ❤️ for the Stoneclough community**

For questions or support, please [open an issue](https://github.com/your-org/silas-platform/issues) or contact the development team.
