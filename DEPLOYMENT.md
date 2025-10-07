# 🚀 SILAS Platform Deployment Guide

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/silastebay-star/silas-platform&branch=branch-2)

## 📋 Environment Variables Setup

**CRITICAL**: Set these exact environment variables in your Vercel dashboard:

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cbjonqcvjheotxolfmti.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiam9ucWN2amhlb3R4b2xmbXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODYzMjIsImV4cCI6MjA3NTI2MjMyMn0.N6JNdUPgUJmzfrqkeD6qvnd19VFn92vK8wKOesYqGIs

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdmOXhmMW4wNHplMmxzY2Rzd2lkcWt3In0.0AHptZ2vtFbg8ejWKN2l1w
NEXT_PUBLIC_MAPBOX_STYLE=mapbox://styles/silastebay/cmgff34w9000v01pebcy24k4l
```

### Optional (Server-side only)
```bash
# Service role key for admin operations (keep secure)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiam9ucWN2amhlb3R4b2xmbXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4NjMyMiwiZXhwIjoyMDc1MjYyMzIyfQ.7kbLatb94mMZa081WvvZDrTQO28ohHIfGjaU_uAiRRM
```

## 🔧 Vercel Setup Steps

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/silastebay-star/silas-platform.git
   cd silas-platform
   git checkout branch-2
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `branch-2` branch

3. **Configure Environment Variables**
   - In Vercel dashboard: Settings → Environment Variables
   - Add each variable above with exact names and values
   - Set for: Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at `https://your-project.vercel.app`

## 🛠️ Local Development

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

## 🔍 Troubleshooting

### Common Issues

1. **Map not loading**: Check `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly
2. **Database errors**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Build failures**: Ensure all environment variables use `NEXT_PUBLIC_` prefix

### Build Commands

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## 📊 Performance

- **Bundle Size**: ~625KB for map page
- **First Load**: ~105KB shared
- **Build Time**: ~10-15 seconds
- **Static Generation**: All pages pre-rendered

## 🔒 Security Notes

- All public environment variables are prefixed with `NEXT_PUBLIC_`
- Service role key should only be used server-side
- Supabase RLS policies protect data access
- Mapbox token is restricted to specific domains

## 📱 Features Included

- ✅ Interactive community mapping
- ✅ Real-time pin creation and updates
- ✅ Category-based filtering
- ✅ Responsive design
- ✅ Dark/light theme support
- ✅ Supabase authentication ready
- ✅ TypeScript support
- ✅ Optimized for performance

## 🌐 Live Demo

Once deployed, your platform will include:
- Landing page with community overview
- Interactive map with pin management
- Category-based content organization
- Real-time data synchronization

---

**Need help?** Check the main README.md for detailed documentation.
