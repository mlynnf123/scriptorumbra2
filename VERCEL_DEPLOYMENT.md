# Vercel Deployment Guide for Scriptor Umbra

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Gather all required API keys and credentials

## Required Environment Variables

Set these in your Vercel project dashboard:

### Frontend Variables (Vite)
```
VITE_OPENAI_API_KEY=sk-your_openai_api_key_here
VITE_OPENAI_ASSISTANT_ID=asst_your_assistant_id_here (optional)
VITE_STACK_APP_ID=your_stack_app_id_here
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key_here
```

### Backend Variables (API Functions)
```
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_ASSISTANT_ID=asst_your_assistant_id_here (optional)
DATABASE_URL=postgresql://username:password@host:port/database
STACK_SECRET_SERVER_KEY=your_stack_secret_server_key_here
STACK_APP_ID=your_stack_app_id_here
JWT_SECRET=your_secure_jwt_secret_here
NODE_ENV=production
```

## Deployment Steps

### 1. Prepare Your Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add all environment variables
6. Click "Deploy"

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? [Y/n] Y
# - Which scope? [your-username]
# - Link to existing project? [y/N] N
# - Project name? [scriptorumbra2]
# - In which directory? [./]
```

### 3. Configure Environment Variables via CLI
```bash
# Set environment variables
vercel env add VITE_OPENAI_API_KEY production
vercel env add VITE_STACK_APP_ID production
vercel env add OPENAI_API_KEY production
vercel env add DATABASE_URL production
# ... add all other variables

# Redeploy with new environment variables
vercel --prod
```

### 4. Configure Custom Domain (Optional)
```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS records as instructed by Vercel
```

## Database Setup

### Neon PostgreSQL
1. Create account at [neon.tech](https://neon.tech)
2. Create a new database
3. Get connection strings:
   - `DATABASE_URL` - for general use
   - `POSTGRES_PRISMA_URL` - for Prisma (if used)
   - `POSTGRES_URL_NON_POOLING` - for migrations

### Run Database Migrations
After deployment, run migrations:
```bash
# If you have migration scripts
vercel env add DATABASE_URL production
# Then run your migration script
```

## Stack Auth Setup

1. Create project at [stack-auth.com](https://stack-auth.com)
2. Configure:
   - **App ID**: Use in both frontend and backend
   - **Publishable Client Key**: Frontend only
   - **Secret Server Key**: Backend only
3. Configure domains in Stack Auth dashboard:
   - Add your Vercel domain (e.g., `https://your-app.vercel.app`)
   - Add your custom domain if using one

## Post-Deployment Checklist

- [ ] Verify app loads correctly
- [ ] Test user authentication (sign up/sign in)
- [ ] Test chat functionality
- [ ] Check API endpoints are working
- [ ] Verify environment variables are set correctly
- [ ] Test mobile responsiveness
- [ ] Check console for errors

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Check TypeScript errors: `npm run typecheck`
   - Verify all dependencies are installed

2. **API Errors**
   - Check environment variables are set correctly
   - Verify database connection
   - Check Vercel function logs

3. **Authentication Issues**
   - Verify Stack Auth configuration
   - Check domain settings in Stack Auth dashboard
   - Ensure both frontend and backend Stack Auth variables are set

4. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check if database is accessible from Vercel
   - Run database migrations if needed

### Vercel Logs
```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow
```

## Performance Optimization

1. **Build Optimization**
   - Vite automatically optimizes the build
   - Unused code is tree-shaken
   - Assets are minified and compressed

2. **Vercel Edge Functions**
   - API routes are automatically deployed as serverless functions
   - Cold start times are optimized

3. **CDN and Caching**
   - Static assets are served from Vercel's global CDN
   - Automatic caching for optimal performance

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use Vercel's environment variable system
   - Separate frontend (VITE_) and backend variables

2. **API Security**
   - CORS is configured in `vercel.json`
   - JWT tokens for authentication
   - Rate limiting is implemented

3. **Database Security**
   - Use connection pooling
   - Ensure database has proper access controls
   - Use SSL connections

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables
3. Test locally first with `npm run build && npm run preview`
4. Check the [Vercel documentation](https://vercel.com/docs)