# Quick Deployment Guide

## Prerequisites Checklist

- [ ] PostgreSQL database created and accessible
- [ ] Database schema from `database/schema.sql` has been run
- [ ] GitHub account ready
- [ ] Vercel account ready

## Step-by-Step Deployment

### 1. Initialize Git Repository

```bash
cd /c/autow-booking
git init
git add .
git commit -m "Initial commit - AUTOW Booking System"
```

### 2. Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `autow-booking-system`
4. Don't initialize with README (we already have one)
5. Click "Create repository"

### 3. Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/autow-booking-system.git
git branch -M main
git push -u origin main
```

### 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

### 5. Add Environment Variables in Vercel

Click "Environment Variables" and add these:

| Name | Value | Environment |
|------|-------|-------------|
| DATABASE_URL | Your PostgreSQL connection string | Production, Preview, Development |
| AUTOW_STAFF_USERNAME | admin (or your choice) | Production, Preview, Development |
| AUTOW_STAFF_PASSWORD | Strong password here | Production, Preview, Development |
| AUTOW_STAFF_TOKEN | Random 64-char token | Production, Preview, Development |
| NEXT_PUBLIC_APP_URL | https://your-site.vercel.app | Production |
| NODE_ENV | production | Production |

To generate a secure token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Deploy

1. Click "Deploy"
2. Wait for deployment to complete (1-2 minutes)
3. Click "Visit" to see your site

### 7. Test Your Deployment

1. Go to `https://your-site.vercel.app/autow`
2. Login with your credentials
3. Test creating a booking
4. Test viewing dashboard
5. Test editing a booking
6. Test completing a booking
7. Test deleting a booking

## Database Connection Strings

### Neon (Recommended for Vercel)
```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### Supabase
```
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### Vercel Postgres
```
DATABASE_URL=postgres://default:xxx@xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require
```

## Quick Database Setup with Neon

1. Go to [neon.tech](https://neon.tech)
2. Sign up (free tier available)
3. Create a new project
4. Copy the connection string
5. In Neon SQL Editor, paste and run the contents of `database/schema.sql`
6. Use the connection string in Vercel environment variables

## Troubleshooting Common Issues

### Issue: "Database connection failed"
**Solution**:
- Verify DATABASE_URL is correct
- Ensure database allows connections from Vercel IPs (0.0.0.0/0)
- Check if SSL is properly configured in connection string

### Issue: "Login not working"
**Solution**:
- Clear browser cache and cookies
- Verify environment variables are set in Vercel
- Check that AUTOW_STAFF_TOKEN is the same value everywhere

### Issue: "Build failed"
**Solution**:
- Run `npm run build` locally first
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json

### Issue: "Module not found"
**Solution**:
- Delete `node_modules` and `.next` locally
- Run `npm install` again
- Try deploying again

## Post-Deployment Checklist

- [ ] Login works
- [ ] Can create bookings
- [ ] Dashboard loads correctly
- [ ] Can edit bookings
- [ ] Can complete bookings
- [ ] Can delete bookings
- [ ] Mobile responsive design works
- [ ] Changed default password
- [ ] Database is backed up regularly

## Updating Your Deployment

When you make changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel will automatically redeploy!

## Custom Domain Setup

1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS setup instructions
5. Update NEXT_PUBLIC_APP_URL to your custom domain

---

Need help? Check the main README.md for detailed documentation.
