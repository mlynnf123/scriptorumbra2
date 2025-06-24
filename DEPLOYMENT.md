# Scriptor Umbra - Deployment Guide

This guide will help you deploy Scriptor Umbra (frontend + backend) to Vercel.

## 🚀 Quick Deploy to Vercel

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Production deployment setup"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project**:
   - Framework Preset: `Vite`
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Step 3: Environment Variables

In the Vercel project settings, add these environment variables:

#### Required Environment Variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=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
OPENAI_ASSISTANT_ID=asst_SIM27MLhW3jL4xRG6SyNzFzc

# Database (Your Neon PostgreSQL)
POSTGRES_URL=postgres://neondb_owner:npg_WUlQI0gq6NaS@ep-restless-leaf-a5wgallm-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
POSTGRES_PRISMA_URL=postgres://neondb_owner:npg_WUlQI0gq6NaS@ep-restless-leaf-a5wgallm-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
POSTGRES_URL_NON_POOLING=postgres://neondb_owner:npg_WUlQI0gq6NaS@ep-restless-leaf-a5wgallm.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Secret (IMPORTANT: Generate a new secure secret)
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production-2024-vercel

# Application Configuration
NODE_ENV=production
FRONTEND_URL=https://your-app-name.vercel.app
```

### Step 4: Update Frontend URL

After deployment, update the `FRONTEND_URL` environment variable with your actual Vercel URL.

### Step 5: Database Migration

Run the database migration to ensure your production database has the correct schema:

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Run migration in production**:
   ```bash
   vercel env pull .env.local
   cd api && node scripts/migrate.js
   ```

## 🛠️ Advanced Configuration

### Custom Domain

1. Go to your Vercel project settings
2. Navigate to "Domains" tab
3. Add your custom domain
4. Update the `FRONTEND_URL` environment variable

### Performance Optimization

The deployment includes:

- ✅ Serverless functions for API endpoints
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic scaling
- ✅ Environment-based configurations

### Security Features

- ✅ CORS properly configured for production
- ✅ Rate limiting enabled
- ✅ Helmet security headers
- ✅ JWT-based authentication
- ✅ Secure database connections

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**:

   - Check that all dependencies are in the main `package.json`
   - Ensure TypeScript types are resolved

2. **API Not Working**:

   - Verify all environment variables are set
   - Check Vercel function logs in dashboard

3. **Database Connection Issues**:

   - Ensure Neon database is accessible
   - Check connection string format
   - Verify SSL mode is set to `require`

4. **CORS Errors**:
   - Update `FRONTEND_URL` with your actual Vercel URL
   - Check allowed origins in the API configuration

## 📱 Testing Production Deployment

1. **Create a new user account**
2. **Test authentication flow**
3. **Send messages to your OpenAI Assistant**
4. **Verify chat history persistence**
5. **Test on different devices/browsers**

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel automatically deploys the changes
```

## 📊 Monitoring

Monitor your deployment in the Vercel dashboard:

- Function execution logs
- Performance metrics
- Error tracking
- Analytics

Your Scriptor Umbra app is now production-ready! 🎉
