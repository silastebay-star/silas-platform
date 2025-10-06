# SILAS Database Setup

## Quick Setup

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/cbjonqcvjheotxolfmti

2. Click **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy and paste the entire contents of `schema.sql`

5. Click **Run** to execute the schema

## What Gets Created

### Tables

**profiles** - User profiles (extends auth.users)
- id, email, name, avatar_url, bio
- Automatically created when user signs up

**pins** - All map pins (businesses, projects, events, groups)
- id, type, name, description, layer, location
- Supports spatial queries with PostGIS

**reactions** - User engagement (support, join, endorse)
- id, pin_id, user_id, type
- One reaction per type per user per pin

**comments** - Pin discussions
- id, pin_id, user_id, text, timestamps
- Ordered by created_at

**events** - Calendar events
- id, title, description, start_date, layer
- Can be linked to pins

### Functions

**get_this_week_events()** - Returns upcoming events for calendar widget

**get_pin_with_stats(pin_id)** - Returns pin with reaction/comment counts

### Security

All tables have Row Level Security (RLS) enabled:
- Everyone can read (SELECT)
- Only authenticated users can create
- Users can only update/delete their own content

## Testing the Setup

After running the schema, test with these queries:

```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check sample events
SELECT * FROM public.events;

-- Test this week's events function
SELECT * FROM get_this_week_events();
```

## Next Steps

1. Enable email authentication in Supabase dashboard
2. Test user signup/login
3. Create first pin from the app
4. Verify data appears in database

## Troubleshooting

**Error: "permission denied for schema public"**
- Make sure you're logged in as the project owner
- Check that RLS policies are enabled

**Error: "extension uuid-ossp does not exist"**
- Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

**Error: "geography type not found"**
- PostGIS should be enabled by default in Supabase
- If not, contact Supabase support
