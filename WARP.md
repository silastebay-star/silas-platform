# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project identity
- Name: silas-platform
- Stack: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + shadcn/ui + Radix + Zustand
- Mapping: Mapbox GL JS
- Backend: Supabase (Postgres) via supabase-js
- Package manager: pnpm

Core commands
- Install
```bash path=null start=null
pnpm install
```
- Develop (Turbopack; opens on http://localhost:3000 by default)
```bash path=null start=null
pnpm dev
```
- Build and run production
```bash path=null start=null
pnpm build
pnpm start
```
- Lint, format, and type-check
```bash path=null start=null
pnpm lint
pnpm format
pnpm type-check
```
- Clean build artifacts
```bash path=null start=null
pnpm clean
```
- Tests
```bash path=null start=null
# No test runner is configured. The current script is a stub that exits 0:
pnpm test
```

Environment configuration
- Define these in .env.local for local dev (see .env.example) and in your deployment environment (see DEPLOYMENT.md):
  - NEXT_PUBLIC_MAPBOX_TOKEN
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Optional (server-side only): SUPABASE_SERVICE_ROLE_KEY
- Next config forwards env vars and sets image domains:
```js path=/home/stoneclough/silas-platform/next.config.js start=1
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    domains: [
      'images.unsplash.com',
      'supabase.co',
      'your-supabase-project.supabase.co'
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
}

export default nextConfig
```
- If the map UI renders a “Mapbox Token Required” message, set NEXT_PUBLIC_MAPBOX_TOKEN.

High-level architecture
- App shell and theming (Next.js App Router)
  - Global layout sets fonts (Inter, Orbitron) and theme provider; page metadata and viewport are centralized.
```ts path=/home/stoneclough/silas-platform/app/layout.tsx start=16
export const metadata: Metadata = {
  title: 'SILAS - Stoneclough Initiative for Local & Autonomous Systems',
  description: 'A faith-guided, data-informed community intelligence platform that empowers communities to vote, build, restore, and thrive through transparent collaboration.',
  keywords: ['community', 'mapping', 'local', 'stoneclough', 'collaboration', 'faith'],
  authors: [{ name: 'SILAS Community' }],
  openGraph: {
    title: 'SILAS Community Platform',
    description: 'Interactive community mapping and collaboration platform for Stoneclough',
    type: 'website',
    locale: 'en_GB',
  },
}
```
- Landing experience
  - app/page.tsx presents the platform and directs users to the map at /map and community features.
```ts path=/home/stoneclough/silas-platform/app/page.tsx start=31
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Link href="/map">
    <Button variant="default" size="lg" className="bg-white text-silas-green hover:bg-gray-100">
      <MapPin className="w-5 h-5 mr-2" />
      Explore Community Map
    </Button>
  </Link>
  <Link href="/community">
    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-silas-green">
      Join Community
    </Button>
  </Link>
</div>
```
- Map subsystem (center of the product)
  - Location: components/map/MapView.tsx (+ AddPinModal.tsx and PinDetail.tsx)
  - Responsibilities:
    - Initializes Mapbox GL with navigation and geolocation controls
    - Renders category-colored, animated markers for pins
    - Right-click context menu to create pins via AddPinModal
    - Reads and writes pins through the centralized store
    - Requires NEXT_PUBLIC_MAPBOX_TOKEN at runtime
```ts path=/home/stoneclough/silas-platform/components/map/MapView.tsx start=38
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
if (!mapboxToken) {
  console.warn('Mapbox token not found')
  return
}
mapboxgl.accessToken = mapboxToken
map.current = new mapboxgl.Map({
  container: mapContainer.current,
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-2.3769, 53.5526],
  zoom: 14,
})
```
```ts path=/home/stoneclough/silas-platform/components/map/AddPinModal.tsx start=114
<Select
  value={formData.type}
  onValueChange={(value: CategoryKey) => setFormData(prev => ({ ...prev, type: value }))}
>
  <SelectTrigger className="mt-1">
    <SelectValue placeholder="Select pin type" />
  </SelectTrigger>
  <SelectContent>
    {CATEGORIES.filter(cat => cat.key !== 'issues').map((category) => (
      <SelectItem key={category.key} value={category.key}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
          <span className="text-lg mr-2">{category.icon}</span>
          <span>{category.label}</span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```
- State and data flow (Pins as the core object)
  - Store: store/pins.ts (Zustand)
    - Keeps pin list, selection, loading/error state
    - Actions: addPin, updatePin, deletePin, fetchPins
    - Enforces a 3-meter proximity rule when adding pins to avoid overlap
    - Integrates with Supabase (table: pins)
```ts path=/home/stoneclough/silas-platform/store/pins.ts start=66
// Check proximity (3m rule)
const { pins } = get()
const tooClose = pins.some(p => {
  const distance = Math.sqrt(
    Math.pow((p.lat - newPin.lat) * 111000, 2) + 
    Math.pow((p.lng - newPin.lng) * 111000 * Math.cos(newPin.lat * Math.PI / 180), 2)
  )
  return distance < 3
})
if (tooClose) {
  set({ error: 'Pin too close to existing pin (3m minimum)', isLoading: false })
  return null
}
```
```ts path=/home/stoneclough/silas-platform/store/pins.ts start=171
const { data, error } = await supabase
  .from('pins')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
```
- Categories module (drives pin types, colors, and labeling)
  - Centralized definitions for category taxonomy and colors used by the map and UI.
```ts path=/home/stoneclough/silas-platform/config/categories.ts start=21
export const CATEGORIES: Category[] = [
  { key: 'community', label: 'Community & Groups', color: '#6B8E6B', ... },
  { key: 'faith', label: 'Faith & Reflection', color: '#3A5D3A', ... },
  { key: 'projects', label: 'Projects & Initiatives', color: '#4C764C', ... },
  { key: 'economy', label: 'Economy & Commerce', color: '#4C6F76', ... },
  { key: 'events', label: 'Events & Experiences', color: '#8CBFA5', ... },
  { key: 'data_ai', label: 'Data, AI & Insight', color: '#5E6E6E', ... },
  { key: 'issues', label: 'Issues & Response', color: '#C97340', ... },
]
```
- Supabase client and schema typing
  - Browser client instantiated from NEXT_PUBLIC_* vars
  - Local TypeScript definitions for public tables (pins, comments, likes)
```ts path=/home/stoneclough/silas-platform/lib/supabase.ts start=1
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```
- UI layer
  - Tailwind + shadcn/ui + Radix for composable UI primitives and consistent theming (components/ui)

Deployment
- See DEPLOYMENT.md for the Vercel button flow and required environment variables. Core commands:
```bash path=/home/stoneclough/silas-platform/DEPLOYMENT.md start=77
# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

Caveats and notes
- Documentation drift:
  - README.md and README_NEW.md contain Vite-oriented instructions and structures; the live codebase uses Next.js 15 (App Router) with .next artifacts and next scripts in package.json. Prefer the commands listed above over Vite/port 5173 references.
  - A vite.config.js and dist/ folder exist but are legacy artifacts and are not used by the current Next build pipeline.
- Map style: An env var NEXT_PUBLIC_MAPBOX_STYLE exists in .env.example, but MapView.tsx currently uses the default 'mapbox://styles/mapbox/streets-v12'. If you intend to make the style configurable, wire MapView to read NEXT_PUBLIC_MAPBOX_STYLE.
- Tests: No testing framework is configured yet; pnpm test is a placeholder.
- Database: Supabase migrations are present under supabase/migrations. Ensure your Supabase project has the pins/comments/likes tables and Row Level Security policies aligned with the app’s expectations.
