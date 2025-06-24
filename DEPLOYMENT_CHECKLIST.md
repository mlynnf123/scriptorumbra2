# Scriptor Umbra - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] No TypeScript errors (`npm run typecheck`)
- [x] All mobile responsive design implemented
- [x] Blue color scheme applied consistently
- [x] Logo properly integrated
- [x] Authentication working with Stack Auth
- [x] Chat functionality operational
- [x] Settings page configured

### ✅ Build Configuration
- [x] `package.json` scripts updated for Vercel
- [x] `vercel.json` properly configured
- [x] `.env.example` includes all required variables
- [x] Vite config set up for proxy and aliases
- [x] TypeScript build succeeds

### ✅ Environment Variables Setup
You need to gather these values before deployment:

#### Required for Frontend (VITE_ prefix)
- `VITE_OPENAI_API_KEY` - Your OpenAI API key
- `VITE_STACK_APP_ID` - Stack Auth App ID
- `VITE_STACK_PUBLISHABLE_CLIENT_KEY` - Stack Auth public key

#### Required for Backend (API Functions)
- `OPENAI_API_KEY` - Your OpenAI API key (same as frontend)
- `DATABASE_URL` - Neon PostgreSQL connection string
- `STACK_SECRET_SERVER_KEY` - Stack Auth secret key
- `STACK_APP_ID` - Stack Auth App ID (same as frontend)
- `JWT_SECRET` - Random secure string for JWT signing

#### Optional
- `VITE_OPENAI_ASSISTANT_ID` / `OPENAI_ASSISTANT_ID` - Custom OpenAI assistant
- `NODE_ENV=production`

## Deployment Steps

### 1. Final Code Preparation
```bash
# Make sure everything is committed
git add .
git commit -m "Final preparations for deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Quick Deploy (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add all environment variables
7. Click **Deploy**

### 3. Post-Deployment Setup

#### Configure Stack Auth
1. Go to your Stack Auth dashboard
2. Add your Vercel domain to allowed origins:
   - `https://your-app-name.vercel.app`
   - Your custom domain (if any)

#### Test the Deployment
- [ ] App loads without errors
- [ ] Sign up/sign in works
- [ ] Chat interface functional
- [ ] Messages send and receive properly
- [ ] Settings page accessible
- [ ] Mobile layout works correctly
- [ ] All API endpoints responding

## Quick Commands Reference

```bash
# Test build locally
npm run build
npm run preview

# Check for TypeScript errors
npm run typecheck

# Deploy with Vercel CLI (alternative)
npx vercel --prod
```

## Environment Variables Template

Copy this to your Vercel project settings:

```
VITE_OPENAI_API_KEY=sk-your_key_here
VITE_STACK_APP_ID=your_stack_app_id
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_public_key
OPENAI_API_KEY=sk-your_key_here
DATABASE_URL=postgresql://user:pass@host:port/db
STACK_SECRET_SERVER_KEY=your_stack_secret
STACK_APP_ID=your_stack_app_id
JWT_SECRET=your_random_secure_string
NODE_ENV=production
```

## Troubleshooting

### Build Fails
- Run `npm run typecheck` locally
- Check for missing dependencies
- Verify all imports are correct

### App Loads but Authentication Fails
- Check Stack Auth environment variables
- Verify domains in Stack Auth dashboard
- Check browser console for errors

### API Errors
- Verify backend environment variables
- Check Vercel function logs
- Ensure database is accessible

### Database Connection Issues
- Verify DATABASE_URL format
- Check if Neon database is running
- Run migrations if needed

---

**Ready to deploy?** Your Scriptor Umbra app is configured and ready for Vercel deployment! 🚀