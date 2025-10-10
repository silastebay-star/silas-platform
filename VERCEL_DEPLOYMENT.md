# SILAS Platform - Vercel Deployment Guide

## Quick Deployment Steps

### 1. Prerequisites
- GitHub repository with the SILAS Platform code
- Vercel account (free tier works for testing)
- Supabase project set up
- Mapbox account for mapping features

### 2. Deploy to Vercel

#### Option A: Automatic Deployment (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `silastebay-star/silas-platform`
4. Vercel will automatically detect it's a Next.js project
5. Configure environment variables (see step 3)
6. Click "Deploy"

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# For production deployment
vercel --prod
```

### 3. Required Environment Variables

Set these in your Vercel project dashboard under Settings > Environment Variables:

#### Essential Variables (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_access_token
```

#### Optional Variables
```
NEXT_PUBLIC_MAPBOX_STYLE=mapbox://styles/mapbox/streets-v12
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_CENSUS_DATA=true
OPENAI_API_KEY=your_openai_key (for AI features)
```

### 4. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations:
   ```bash
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```
3. Enable Row Level Security (RLS) on all tables
4. Set up authentication providers if needed

### 5. Mapbox Setup

1. Create account at [mapbox.com](https://mapbox.com)
2. Get your access token from the dashboard
3. Add the token to Vercel environment variables

### 6. Custom Domain (Optional)

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. SSL certificates are automatically provisioned

### 7. Troubleshooting

#### Common Issues:

**Build Fails with "Module not found"**
- Check that all dependencies are in package.json
- Ensure TypeScript types are properly configured

**Environment Variables Not Working**
- Make sure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new environment variables

**Supabase Connection Issues**
- Verify your Supabase URL and keys are correct
- Check that your Supabase project is not paused

**Mapbox Not Loading**
- Verify your Mapbox token is valid
- Check browser console for API errors

#### Build Logs
Check build logs in Vercel dashboard under Deployments for detailed error information.

### 8. Performance Optimization

The platform includes several optimizations:
- Automatic image optimization
- Static generation where possible
- Edge functions for API routes
- Comprehensive caching headers

### 9. Monitoring

After deployment, monitor:
- Vercel Analytics (automatic)
- Function execution logs
- Error tracking in dashboard
- Performance metrics

### 10. Updates

To update the deployment:
1. Push changes to your GitHub repository
2. Vercel will automatically redeploy
3. Or use `vercel --prod` for manual deployment

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally with `npm run dev`
4. Check Supabase connection

---

**Deployment URL**: Your app will be available at `https://your-project.vercel.app`

The SILAS Platform is now ready for production use! 🚀
