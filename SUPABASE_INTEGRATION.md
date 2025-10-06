# SILAS Supabase Integration Guide

## Quick Start

### 1. Set Up Database

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/cbjonqcvjheotxolfmti/sql

2. Copy and paste the entire `database/schema.sql` file

3. Click **Run** to create all tables

### 2. Enable Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)

### 3. Test the Integration

The app is now ready with:
- User authentication (signup/login)
- Pin creation saved to database
- Comments and reactions persist
- Real-time event calendar

## What's Integrated

### Authentication ✅
- Sign up with email/password
- Log in/out
- User profiles automatically created
- Protected actions (must be logged in)

### Pin Management ✅
- Create pins (business, project, event, group)
- Pins saved to database
- Load pins from database on map
- Filter by layer

### Engagement ✅
- Support, Join, Endorse buttons
- Reactions saved to database
- Comment system with timestamps
- User attribution

### Calendar ✅
- Events loaded from database
- This week's events displayed
- Auto-updates

## Files Created

- `src/lib/supabase.js` - Supabase client
- `database/schema.sql` - Complete database schema
- `database/README.md` - Setup instructions
- `src/App-with-supabase.jsx` - Integrated app (rename to App.jsx to use)

## To Deploy

1. Run the SQL schema in Supabase
2. Rename `App-with-supabase.jsx` to `App.jsx`
3. Build and deploy: `pnpm run build`
4. Test authentication and pin creation

## Next Steps

- Add user profiles page
- Implement real-time subscriptions
- Add image uploads
- Create admin dashboard
- Add notifications

