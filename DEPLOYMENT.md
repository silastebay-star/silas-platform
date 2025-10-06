# SILAS Platform - Deployment Guide

This guide provides detailed instructions for deploying the SILAS platform to various hosting services.

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- ✅ All dependencies are installed (`pnpm install`)
- ✅ The application builds successfully (`pnpm run build`)
- ✅ Mapbox token and style URL are configured
- ✅ CSV data file is in the `public/` directory
- ✅ Logo and assets are in place
- ✅ Application tested locally (`pnpm run dev`)

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides zero-configuration deployment for React applications.

#### Steps:

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd silas-platform
   vercel
   ```

3. **Follow the prompts:**
   - Set up and deploy: Yes
   - Which scope: Your account
   - Link to existing project: No
   - Project name: silas-platform
   - Directory: ./
   - Override settings: No

4. **Production deployment:**
   ```bash
   vercel --prod
   ```

#### Configuration:

Create `vercel.json` in the project root:

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### Option 2: Netlify

Netlify offers continuous deployment from Git repositories.

#### Method A: Drag and Drop

1. Build the project: `pnpm run build`
2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag the `dist/` folder to the upload area
4. Your site will be live instantly!

#### Method B: Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Log in to [Netlify](https://app.netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Configure build settings:
   - **Build command**: `pnpm run build`
   - **Publish directory**: `dist`
   - **Node version**: 22
6. Click "Deploy site"

#### Configuration:

Create `netlify.toml` in the project root:

```toml
[build]
  command = "pnpm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "22"
```

---

### Option 3: GitHub Pages

Deploy directly from your GitHub repository.

#### Steps:

1. **Install gh-pages:**
   ```bash
   pnpm add -D gh-pages
   ```

2. **Update `package.json`:**
   ```json
   {
     "homepage": "https://yourusername.github.io/silas-platform",
     "scripts": {
       "predeploy": "pnpm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy:**
   ```bash
   pnpm run deploy
   ```

4. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: gh-pages
   - Folder: / (root)

---

### Option 4: AWS S3 + CloudFront

Host on AWS for enterprise-grade infrastructure.

#### Steps:

1. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://silas-platform
   ```

2. **Build and upload:**
   ```bash
   pnpm run build
   aws s3 sync dist/ s3://silas-platform --delete
   ```

3. **Enable static website hosting:**
   ```bash
   aws s3 website s3://silas-platform \
     --index-document index.html \
     --error-document index.html
   ```

4. **Set bucket policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::silas-platform/*"
       }
     ]
   }
   ```

5. **Create CloudFront distribution** (optional but recommended):
   - Origin: Your S3 bucket website endpoint
   - Default root object: index.html
   - Error pages: 404 → /index.html (200)

---

### Option 5: DigitalOcean App Platform

Deploy with a few clicks on DigitalOcean.

#### Steps:

1. Push code to GitHub
2. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
3. Click "Create App"
4. Select your repository
5. Configure:
   - **Build command**: `pnpm run build`
   - **Output directory**: `dist`
   - **Environment**: Node.js 22
6. Click "Next" and "Launch App"

---

### Option 6: Self-Hosted (VPS/Dedicated Server)

Deploy on your own server with Nginx.

#### Steps:

1. **Build the project:**
   ```bash
   pnpm run build
   ```

2. **Upload to server:**
   ```bash
   scp -r dist/* user@yourserver.com:/var/www/silas-platform/
   ```

3. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name silas.example.com;
       root /var/www/silas-platform;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Enable gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **Reload Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Set up SSL with Let's Encrypt:**
   ```bash
   sudo certbot --nginx -d silas.example.com
   ```

---

## 🔐 Environment Variables

For production deployments, use environment variables for sensitive data:

### Vercel:
```bash
vercel env add VITE_MAPBOX_TOKEN
```

### Netlify:
- Go to Site settings → Environment variables
- Add `VITE_MAPBOX_TOKEN` and `VITE_MAPBOX_STYLE`

### GitHub Pages:
- Go to Settings → Secrets and variables → Actions
- Add repository secrets

### AWS:
- Use AWS Systems Manager Parameter Store
- Reference in your build pipeline

---

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm run build
        env:
          VITE_MAPBOX_TOKEN: ${{ secrets.VITE_MAPBOX_TOKEN }}
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 📊 Performance Optimization

### Before Deployment:

1. **Optimize images:**
   ```bash
   # Install image optimization tool
   npm install -g sharp-cli
   
   # Optimize logo
   sharp -i src/assets/silas-logo.png -o src/assets/silas-logo.png --webp
   ```

2. **Enable compression:**
   - Ensure your hosting provider enables gzip/brotli compression
   - Most platforms do this automatically

3. **Configure caching:**
   - Set appropriate cache headers for static assets
   - Use CDN for better global performance

4. **Analyze bundle size:**
   ```bash
   pnpm run build -- --mode analyze
   ```

---

## 🧪 Testing Deployment

After deployment, verify:

1. **Functionality:**
   - Map loads correctly
   - All navigation buttons work
   - Calendar, Polls, and Directory display properly
   - Marker click shows community details
   - Voting and commenting work

2. **Performance:**
   - Run [PageSpeed Insights](https://pagespeed.web.dev/)
   - Check [WebPageTest](https://www.webpagetest.org/)
   - Aim for scores above 90

3. **Mobile responsiveness:**
   - Test on various devices
   - Check touch interactions
   - Verify map gestures work

4. **Cross-browser compatibility:**
   - Chrome/Edge
   - Firefox
   - Safari
   - Mobile browsers

---

## 🐛 Common Deployment Issues

### Issue: Map not loading

**Solution:**
- Verify Mapbox token is set correctly
- Check browser console for CORS errors
- Ensure token has proper permissions

### Issue: 404 errors on refresh

**Solution:**
- Configure server to redirect all routes to index.html
- Add proper rewrite rules (see hosting-specific configs above)

### Issue: Assets not loading

**Solution:**
- Check asset paths are relative
- Verify `base` in `vite.config.js` matches deployment path
- Ensure all files are included in build output

### Issue: Large bundle size

**Solution:**
- Implement code splitting
- Use dynamic imports for heavy libraries
- Consider using Mapbox CDN instead of npm package

---

## 📈 Monitoring

### Set up monitoring:

1. **Uptime monitoring:**
   - [UptimeRobot](https://uptimerobot.com/)
   - [Pingdom](https://www.pingdom.com/)

2. **Error tracking:**
   - [Sentry](https://sentry.io/)
   - [Rollbar](https://rollbar.com/)

3. **Analytics:**
   - Google Analytics
   - Plausible Analytics (privacy-friendly)

---

## 🔄 Update Deployment

To update an existing deployment:

1. Make your changes locally
2. Test thoroughly: `pnpm run dev`
3. Build: `pnpm run build`
4. Deploy using your chosen method
5. Verify changes in production

---

## 📞 Support

For deployment issues:
- Check hosting provider documentation
- Review build logs for errors
- Test locally first to isolate issues
- Verify all environment variables are set

---

**Ready to deploy? Choose your preferred hosting option above and follow the steps!** 🚀
