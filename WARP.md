# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Commands
```bash
# Start development server (Vite on port 5173)
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint

# Preview production build
pnpm run preview
```

### Backend Services
```bash
# Start the Copilot server (Express.js on port 3001)
cd server && npm start

# Start embedding service (FastAPI on port 8000)
cd embed_service && python main.py

# Index documents for AI search
python scripts/index_documents.py
```

### Database Management
```bash
# Apply database schema (run in Supabase SQL editor)
# Execute database.sql and migrations/*.sql files

# Apply AI documents migration for Copilot
# Execute migrations/003_ai_documents.sql
```

### Testing Individual Components
- Test specific components by importing them in the main `App.jsx`
- Use browser dev tools to inspect map interactions and data loading
- Check network tab for API calls to Supabase and backend services

## Architecture Overview

### Frontend Architecture (React + Vite)
This is a **single-page application** built with React 19, using Vite as the build tool. The architecture follows a **component-based pattern** with a single main application component that manages all state and rendering.

**Key Architectural Decisions:**
- **Monolithic App Component**: All application logic, state management, and UI rendering is centralized in `src/App.jsx` (~2000+ lines)
- **Inline Data Management**: Events, directory items, and community data are defined as JavaScript arrays within the component
- **Mixed Rendering Patterns**: Combines map-based interactions (Mapbox GL JS) with traditional form-based UI components

### Backend Architecture (Multi-Service)
The backend consists of **three separate services** that work together:

1. **Express.js Copilot Server** (`server/`)
   - Handles AI chat queries and streaming responses
   - Connects to PostgreSQL for data retrieval
   - Interfaces with local LLM endpoints (Ollama/llama.cpp)

2. **FastAPI Embedding Service** (`embed_service/`)
   - Provides text embedding generation using SentenceTransformers
   - Used for semantic search and RAG functionality
   - Lightweight service for vector operations

3. **Supabase Database** (PostgreSQL + PostGIS)
   - Primary data store with spatial capabilities
   - Row Level Security (RLS) for multi-tenant access
   - Real-time subscriptions and authentication

### Data Flow Architecture

**Map Data Pipeline:**
```
KML Boundary Files → toGeoJSON → Turf.js → Mapbox GL JS
CSV Data → Papa Parse → React State → Map Markers
```

**AI/Copilot Pipeline:**
```
User Query → Embedding Service → Vector Search (pgvector) → LLM → Streaming Response
```

**Database Schema Layers:**
- **Pins**: Core map features with PostGIS point geometry
- **Feedback**: User reactions (likes, votes, endorsements)  
- **Comments**: Threaded discussions on pins
- **Projects**: Progress tracking for Works layer
- **Proposals**: Governance voting for Circle layer
- **Data Points**: KPI metrics for Pulse layer

### Key Integrations

**Mapbox GL JS Integration:**
- Uses custom Mapbox style: `mapbox://styles/silastebay/cmgaznfkx000f01qu43308dzx`
- Implements clustering for point density management
- Boundary enforcement using Turf.js spatial operations
- Layer-based filtering with custom color schemes per community layer

**Supabase Integration:**
- Client-side SDK for real-time data operations
- Helper functions in `src/lib/supabase.js` abstract database operations
- RLS policies enforce community-based access control

**AI/LLM Integration:**
- Local LLM hosting (Ollama recommended) for privacy and cost control
- RAG implementation using pgvector for semantic search
- Streaming responses for better UX during model inference

## Project Structure Insights

### Component Organization
- **Monolithic Pattern**: Most UI logic lives in `App.jsx` rather than being split into smaller components
- **shadcn/ui**: Uses Radix UI primitives with custom styling via Tailwind CSS
- **Single Modal Pattern**: `CopilotModal.jsx` is the only extracted complex component

### Data Management Strategy
- **No Global State Management**: Uses React's built-in state instead of Redux/Zustand
- **Local Data Arrays**: Events, directory items defined inline rather than in external configs
- **Real-time via Supabase**: Database changes trigger UI updates through Supabase subscriptions

### Styling Approach
- **Tailwind CSS 4.x**: Modern utility-first styling with custom design system
- **Consistent Color Palette**: Green theme (`#4c764c`) throughout the application
- **Responsive Design**: Mobile-first approach with interactive touch controls

## Development Guidelines

### Working with the Monolithic App Component
- **State Management**: All application state is managed in `App.jsx` - look for `useState` calls to understand data flow
- **Event Handlers**: Most user interactions are handled by functions defined within the main component
- **Layer System**: The app uses a layer-based filtering system - when adding features, ensure they work with the `LAYER_CONFIG` object
- **Map Integration**: Map-related logic is tightly coupled with the UI state - changes to map features often require updates to multiple parts of the component

### Database Development Patterns
- **PostGIS Usage**: Spatial queries use PostGIS functions like `ST_MakePoint()` - prefer these over manual coordinate handling  
- **UUID Primary Keys**: All tables use UUID primary keys with `gen_random_uuid()`
- **JSONB Metadata**: Flexible data is stored in JSONB columns rather than creating additional tables
- **RLS First**: Always implement Row Level Security policies when adding new tables

### AI/Copilot Development
- **Embedding Consistency**: Use the same embedding model (`all-MiniLM-L6-v2`) across indexing and query time
- **Context Length Management**: Keep RAG context under 10,000 tokens to avoid model context limits
- **Streaming Implementation**: Always implement streaming for LLM responses to improve perceived performance
- **Citation Requirements**: Ensure all AI responses include source citations with `[source: filename]` format

### Security Considerations
- **Environment Variables**: Sensitive tokens (Mapbox, Supabase) should use `VITE_` prefix for client-side access
- **API Keys**: Never commit API keys - use environment variables and `.env.local` files
- **RLS Policies**: Database access is controlled through Supabase RLS - test policies thoroughly
- **CORS Configuration**: Backend services need proper CORS setup for cross-origin requests

### Performance Optimization Notes
- **Bundle Size**: Current production build is large (~1.8MB) due to Mapbox GL JS - consider lazy loading
- **Map Performance**: Use clustering for datasets with >100 points
- **Database Indexing**: Spatial queries require proper indexes - use `GIST` indexes for PostGIS columns
- **Embedding Caching**: Cache embeddings to avoid re-computation on every deployment

### Common Development Pitfalls
- **Mapbox Token Limits**: Free tier has usage limits - monitor via Mapbox dashboard
- **PostGIS Coordinate Order**: PostGIS uses [longitude, latitude] order, opposite of some other systems
- **State Updates**: Large component makes debugging state changes difficult - use React DevTools
- **Service Dependencies**: AI features require all three backend services to be running simultaneously
