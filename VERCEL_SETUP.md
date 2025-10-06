# 🚀 Vercel Deployment Setup for SILAS Platform

## ⚠️ CRITICAL: Environment Variables Required

The app is currently failing because Vercel doesn't have the required environment variables. You MUST set these in your Vercel dashboard:

### 📋 Required Environment Variables

Go to your Vercel project → **Settings** → **Environment Variables** and add:

```
VITE_SUPABASE_URL=https://cbjonqcvjheotxolfmti.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiam9ucWN2amhlb3R4b2xmbXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODYzMjIsImV4cCI6MjA3NTI2MjMyMn0.N6JNdUPgUJmzfrqkeD6qvnd19VFn92vK8wKOesYqGIs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiam9ucWN2amhlb3R4b2xmbXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4NjMyMiwiZXhwIjoyMDc1MjYyMzIyfQ.7kbLatb94mMZa081WvvZDrTQO28ohHIfGjaU_uAiRRM
VITE_MAPBOX_TOKEN=pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdmOXhmMW4wNHplMmxzY2Rzd2lkcWt3In0.0AHptZ2vtFbg8ejWKN2l1w
VITE_MAPBOX_STYLE=mapbox://styles/silastebay/cmgff34w9000v01pebcy24k4l
```

### 🔧 Step-by-Step Instructions

1. **Open Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Navigate to your SILAS Platform project

2. **Access Environment Variables**
   - Click on **Settings** tab
   - Click on **Environment Variables** in the sidebar

3. **Add Each Variable**
   - Click **Add New**
   - Enter the variable name (e.g., `VITE_MAPBOX_TOKEN`)
   - Enter the value (copy from above)
   - Select **Production**, **Preview**, and **Development**
   - Click **Save**

4. **Repeat for All Variables**
   - Add all 4 variables listed above
   - Make sure each is set for all environments

5. **Redeploy**
   - Go to **Deployments** tab
   - Click the **...** menu on the latest deployment
   - Click **Redeploy**

### ✅ Verification

After setting the environment variables and redeploying:

- ✅ Map should load without "invalid Mapbox access token" error
- ✅ Supabase data should load properly
- ✅ No more JavaScript console errors
- ✅ All features should work correctly

### 🆘 If Still Not Working

1. Check that variable names are EXACTLY as shown (case-sensitive)
2. Ensure values don't have extra spaces or quotes
3. Verify all environments are selected (Production, Preview, Development)
4. Try a fresh deployment after setting variables

---

**The app has all the fixes applied - it just needs the environment variables to be set in Vercel!**
