# SILAS Platform - Production Deployment Guide

## Overview
This guide covers the complete production deployment setup for the SILAS community collaboration platform, including Supabase configuration, Vercel deployment, and environment management.

## Prerequisites
- Vercel account with team/pro plan
- Supabase account with production project
- Domain name configured
- SSL certificates
- Environment variables prepared

## 1. Supabase Production Setup

### 1.1 Create Production Project
```bash
# Create new Supabase project for production
npx supabase projects create silas-production --org-id YOUR_ORG_ID

# Link local project to production
npx supabase link --project-ref YOUR_PRODUCTION_REF
```

### 1.2 Database Configuration
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
```

### 1.3 Run Production Migrations
```bash
# Deploy all migrations to production
npx supabase db push --linked

# Verify migration status
npx supabase migration list --linked
```

### 1.4 Configure Row Level Security
```sql
-- Enable RLS on all tables
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
-- ... (enable for all tables)

-- Create production-ready policies
-- See supabase/policies/ directory for complete policies
```

### 1.5 Set Up Database Indexes
```sql
-- Performance indexes for production
CREATE INDEX CONCURRENTLY idx_pins_location ON pins USING GIST (location);
CREATE INDEX CONCURRENTLY idx_pins_created_at ON pins (created_at DESC);
CREATE INDEX CONCURRENTLY idx_pins_category ON pins (category);
CREATE INDEX CONCURRENTLY idx_pins_status ON pins (status);

CREATE INDEX CONCURRENTLY idx_users_email ON users (email);
CREATE INDEX CONCURRENTLY idx_users_username ON users (username);

CREATE INDEX CONCURRENTLY idx_comments_pin_id ON comments (pin_id);
CREATE INDEX CONCURRENTLY idx_comments_created_at ON comments (created_at DESC);

CREATE INDEX CONCURRENTLY idx_votes_pin_id ON votes (pin_id);
CREATE INDEX CONCURRENTLY idx_votes_user_id ON votes (user_id);

-- Geographic indexes for census data
CREATE INDEX CONCURRENTLY idx_census_data_bbox ON census_data_cache (bbox);
CREATE INDEX CONCURRENTLY idx_environmental_metrics_location ON environmental_metrics USING GIST (location);
```

### 1.6 Configure Supabase Settings
```javascript
// supabase/config.toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323

[auth]
enabled = true
site_url = "https://silas.community"
additional_redirect_urls = ["https://app.silas.community"]
jwt_expiry = 3600
enable_signup = true
enable_confirmations = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

[auth.sms]
enable_signup = false

[storage]
enabled = true
file_size_limit = "50MB"
```

## 2. Vercel Production Deployment

### 2.1 Project Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["lhr1"],
  "framework": "nextjs"
}
```

### 2.2 Environment Variables
```bash
# Production environment variables for Vercel
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App configuration
NEXT_PUBLIC_APP_URL=https://silas.community
NEXT_PUBLIC_APP_NAME="SILAS Platform"
NEXT_PUBLIC_APP_DESCRIPTION="Community Collaboration Platform"

# Feature flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_CENSUS_DATA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# External services
OPENAI_API_KEY=your-openai-key
MAPBOX_ACCESS_TOKEN=your-mapbox-token
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Email configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-key

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=your-mixpanel-token

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
WEBHOOK_SECRET=your-webhook-secret

# Rate limiting
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 2.3 Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set up custom domain
vercel domains add silas.community
vercel domains add app.silas.community
```

### 2.4 Configure DNS
```
# DNS Records for silas.community
A     @     76.76.19.61
CNAME www   silas.community
CNAME app   cname.vercel-dns.com

# SSL/TLS Configuration
- Enable "Always Use HTTPS"
- Set SSL/TLS encryption mode to "Full (strict)"
- Enable HSTS
```

## 3. Performance Optimization

### 3.1 Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: ['your-project.supabase.co', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif']
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

### 3.2 Caching Strategy
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  async set(key: string, value: any, ttl = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }
}
```

## 4. Monitoring and Analytics

### 4.1 Error Tracking
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
# sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
})
```

### 4.2 Performance Monitoring
```typescript
// lib/analytics.ts
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export function AnalyticsProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
      <SpeedInsights />
    </>
  )
}
```

### 4.3 Health Checks
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    
    // Test database connection
    const { data, error } = await supabase
      .from('pins')
      .select('count')
      .limit(1)
      .single()

    if (error) throw error

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 })
  }
}
```

## 5. Security Configuration

### 5.1 Content Security Policy
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'none'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## 6. Backup and Recovery

### 6.1 Database Backups
```bash
# Set up automated backups in Supabase dashboard
# Configure point-in-time recovery
# Set up cross-region replication if needed
```

### 6.2 File Storage Backups
```bash
# Configure Supabase Storage backup policies
# Set up automated file backup to external storage
```

## 7. Launch Checklist

### Pre-Launch
- [ ] All migrations deployed successfully
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] DNS records configured
- [ ] Performance testing completed
- [ ] Security audit passed
- [ ] Backup systems configured
- [ ] Monitoring systems active

### Launch
- [ ] Deploy to production
- [ ] Verify all functionality
- [ ] Test user registration/login
- [ ] Test core features (pins, projects, voting)
- [ ] Test mobile responsiveness
- [ ] Verify analytics tracking
- [ ] Test error handling

### Post-Launch
- [ ] Monitor performance metrics
- [ ] Check error rates
- [ ] Verify user feedback
- [ ] Monitor database performance
- [ ] Check security logs
- [ ] Update documentation

## 8. Maintenance

### Regular Tasks
- Weekly: Review performance metrics
- Monthly: Security audit
- Quarterly: Dependency updates
- Annually: Full system review

### Emergency Procedures
- Database rollback procedures
- Emergency contact list
- Incident response plan
- Communication templates

---

**Production URL**: https://silas.community
**Admin Dashboard**: https://app.silas.community/admin
**Status Page**: https://status.silas.community
