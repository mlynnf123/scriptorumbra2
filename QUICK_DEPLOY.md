# Quick Vercel Deployment Guide

## 🚀 Simple Frontend-First Deployment

Since you're getting a function runtime error, let's deploy the frontend first and then handle the backend separately.

### Step 1: Deploy Frontend Only

1. **Commit your changes:**
```bash
git add .
git commit -m "Ready for frontend deployment"
git push origin main
```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Use these settings:
     - **Framework Preset:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`

3. **Add Frontend Environment Variables:**
```
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_STACK_APP_ID=your_stack_app_id
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_public_key
```

4. **Deploy!**

### Step 2: Backend Options

Since the API structure is causing issues, you have two options:

#### Option A: Use External Backend (Recommended for now)
- Deploy the API separately on Railway, Render, or another service
- Update the `baseURL` in `src/lib/api.ts` to point to your backend

#### Option B: Restructure for Vercel Functions (Later)
- We can restructure the API files to work with Vercel Functions
- This requires moving files and changing the structure

### Step 3: Test Your Deployment

After the frontend deploys:
1. ✅ App should load
2. ✅ UI should be responsive
3. ⚠️ Chat won't work until backend is set up
4. ✅ Authentication UI should work (but not connect)

### Immediate Fix for Vercel Error

The error you're seeing is because of the API directory structure. To deploy frontend-only right now:

1. **Temporarily rename the api folder:**
```bash
mv api api-backend
git add .
git commit -m "Temporarily disable API for frontend deployment"
git push origin main
```

2. **Deploy to Vercel** - This should work now!

3. **After frontend is working, we can tackle the backend separately.**

### Quick Backend Alternative

If you want to get the full app working quickly, consider deploying the backend to:

1. **Railway.app** (Easy Node.js deployment)
2. **Render.com** (Free tier available)
3. **Heroku** (If you have an account)

Then update `src/lib/api.ts`:
```typescript
const instance = axios.create({
  baseURL: 'https://your-backend-url.com/api', // Your deployed backend
  headers: {
    'Content-Type': 'application/json',
  },
});
```

This approach will get your app deployed and working much faster! 🚀

Let me know which approach you'd like to take!