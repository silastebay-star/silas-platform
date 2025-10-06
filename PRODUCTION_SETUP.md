# SILAS Platform Production Setup Guide

## 🚀 Complete Production Deployment Checklist

### **1. Database Setup (Supabase)**

#### **A. Create Supabase Project**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key
3. Go to SQL Editor in Supabase dashboard

#### **B. Run Database Migrations**
Execute these SQL files in order:

1. **Main Schema** (`database.sql`):
```sql
-- Copy and paste the entire contents of database.sql
-- This creates: pins, feedback, comments, activities, projects, proposals, data_points tables
```

2. **Enhanced Features** (`supabase/migrations/20250106_enhance_pin_system.sql`):
```sql
-- Copy and paste the entire contents of the migration file
-- This adds: pin_proposals, pin_block_cells, project_pins, pin_photos, issue_flags tables
```

#### **C. Verify Tables Created**
Check that these tables exist in your Supabase database:
- ✅ pins
- ✅ feedback  
- ✅ comments
- ✅ activities
- ✅ projects
- ✅ proposals
- ✅ data_points
- ✅ pin_proposals
- ✅ pin_block_cells
- ✅ project_pins
- ✅ pin_photos
- ✅ issue_flags

### **2. Environment Variables**

#### **A. Local Development (.env)**
Create `.env` file in project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_MAPBOX_TOKEN=pk.your-mapbox-token-here
VITE_MAPBOX_STYLE=mapbox://styles/your-username/your-style-id
```

#### **B. Vercel Production**
Set these environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` 
- `VITE_MAPBOX_TOKEN`
- `VITE_MAPBOX_STYLE`

### **3. Mapbox Setup**

#### **A. Create Mapbox Account**
1. Go to [mapbox.com](https://mapbox.com) and create account
2. Get your access token from the dashboard
3. Create a custom map style (optional) or use default

#### **B. Configure Map Style**
- Default style: `mapbox://styles/mapbox/streets-v11`
- Custom style: `mapbox://styles/your-username/your-style-id`

### **4. Feature Verification Checklist**

#### **A. Core Pin System** ✅
- [ ] Right-click to create pins
- [ ] Pin creation form with all fields
- [ ] Pin display on map with clustering
- [ ] Pin details modal with actions
- [ ] Layer filtering (Faith, Economy, Works, etc.)
- [ ] Social feed integration

#### **B. Enhanced Pin Features** ✅
- [ ] Priority levels (normal, high, urgent)
- [ ] Issue pin toggle and creation
- [ ] Bulk pin creation modal
- [ ] Mobile quick pin with geolocation
- [ ] Pin metadata storage

#### **C. Admin System** ✅
- [ ] Admin panel access
- [ ] Pin proposal management
- [ ] Issue flag tracking
- [ ] Community metrics dashboard
- [ ] Approval/rejection workflow

#### **D. Database Integration** ✅
- [ ] Real-time pin creation and retrieval
- [ ] Feedback and comment systems
- [ ] Activity logging
- [ ] Metrics calculation
- [ ] Issue flag management

### **5. Testing Procedures**

#### **A. Basic Functionality**
1. **Pin Creation**: Right-click map → Create pin → Verify in database
2. **Pin Display**: Refresh page → Pins load from database
3. **Feedback**: Click pin actions → Verify feedback recorded
4. **Comments**: Add comment → Verify in database

#### **B. Enhanced Features**
1. **Bulk Pins**: Right-click → "Create Multiple Pins" → Configure grid → Create
2. **Mobile Quick Pin**: Open on mobile → Tap + button → Create pin with location
3. **Issue Pins**: Create pin → Check "This is reporting an issue" → Verify issue flag
4. **Admin Panel**: Click Admin button → Verify real data loads

#### **C. Performance Testing**
1. **Large Dataset**: Create 100+ pins → Verify map performance
2. **Clustering**: Zoom in/out → Verify pin clustering works
3. **Mobile Performance**: Test on actual mobile devices

### **6. Production Deployment**

#### **A. Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### **B. Domain Setup**
1. Configure custom domain in Vercel
2. Update CORS settings in Supabase if needed
3. Test all functionality on production domain

### **7. Monitoring & Maintenance**

#### **A. Database Monitoring**
- Monitor Supabase dashboard for usage
- Set up alerts for high usage
- Regular database backups

#### **B. Error Tracking**
- Monitor browser console for errors
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor Vercel function logs

#### **C. Performance Monitoring**
- Monitor Core Web Vitals
- Track map loading times
- Monitor API response times

### **8. Security Checklist**

#### **A. Database Security**
- ✅ Row Level Security (RLS) enabled
- ✅ Proper read/write policies
- ✅ Anonymous access controlled
- [ ] Rate limiting configured

#### **B. API Security**
- ✅ Environment variables secured
- ✅ No sensitive data in client code
- [ ] API rate limiting
- [ ] Input validation

### **9. Backup & Recovery**

#### **A. Database Backups**
- Supabase automatic backups enabled
- Export schema and data regularly
- Test restore procedures

#### **B. Code Backups**
- Git repository with all code
- Environment variables documented
- Deployment procedures documented

### **10. Go-Live Checklist**

- [ ] All environment variables set
- [ ] Database fully migrated and tested
- [ ] All features tested in production
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Backup procedures tested
- [ ] Documentation complete
- [ ] Team trained on admin features

## 🎯 **Production Ready!**

Once all items are checked, the SILAS platform is ready for community use with:
- Full pin creation and management system
- Real-time database integration
- Mobile-optimized experience
- Comprehensive admin tools
- Scalable architecture
- Security best practices

## 📞 **Support**

For technical issues:
1. Check browser console for errors
2. Verify environment variables
3. Check Supabase logs
4. Monitor Vercel deployment logs
