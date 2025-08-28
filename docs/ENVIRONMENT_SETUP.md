# Environment Setup Instructions

## The Problem We Fixed

You were using **two different Stack Auth projects** which caused authentication mismatches:

- **Development**: Project ID `56d82ac4-0ee5-4a13-a70c-bf7cb4edff56`
- **Production**: Project ID `0c5ca710-738a-428b-896a-2ed285ba335d`

We've standardized everything to use the **production** Stack Auth project.

## What You Need To Do

### 1. Update Your Local Environment Files

Replace the placeholder values in your local `.env` and `api-backend/.env` files with your actual API keys:

**In `.env`:**
```bash
# Stack Auth Configuration
VITE_STACK_PROJECT_ID=0c5ca710-738a-428b-896a-2ed285ba335d
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pck_yx5ckhtym3atfqm63nmybedaq66axqy7sfh0s1w5q86x0

# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-proj-[your-actual-key]
VITE_OPENAI_ASSISTANT_ID=asst_[your-actual-id]

# Other APIs
GEMINI_API_KEY=AIzaSy[your-actual-key]
```

**In `api-backend/.env`:**
```bash
# Database Configuration
DATABASE_URL=postgresql://neondb_owner:[password]@ep-restless-leaf-a5wgallm-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Configuration
JWT_SECRET=gdDn6EDHtQKPcLV1+yUPzWBog6Xfn4dwkCVODwEEIxE=

# Stack Auth Configuration
STACK_PROJECT_ID=0c5ca710-738a-428b-896a-2ed285ba335d
STACK_PUBLISHABLE_CLIENT_KEY=pck_yx5ckhtym3atfqm63nmybedaq66axqy7sfh0s1w5q86x0
STACK_SECRET_SERVER_KEY=ssk_kpny4ttkw0zb7fqkjsc469p83y1whemkcgvc6g2v7wb18

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-[your-actual-key]
```

### 2. Update Vercel Environment Variables

**Critical**: Your Vercel production environment must match the Stack Auth project:

Go to Vercel Dashboard → Settings → Environment Variables and set:

```bash
VITE_STACK_PROJECT_ID=0c5ca710-738a-428b-896a-2ed285ba335d
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pck_yx5ckhtym3atfqm63nmybedaq66axqy7sfh0s1w5q86x0
STACK_SECRET_SERVER_KEY=ssk_kpny4ttkw0zb7fqkjsc469p83y1whemkcgvc6g2v7wb18

# Plus your other environment variables:
OPENAI_API_KEY=sk-proj-[your-key]
OPENAI_ASSISTANT_ID=asst_[your-id]
DATABASE_URL=postgresql://[your-db-connection]
JWT_SECRET=[your-jwt-secret]
```

### 3. Redeploy

After updating Vercel environment variables:
1. Go to Vercel Dashboard → Deployments
2. Click the three dots next to your latest deployment
3. Select "Redeploy"

## Why This Fixes The Issues

1. **Authentication Consistency**: All environments now use the same Stack Auth project
2. **Token Validation**: Frontend and backend can now properly validate user sessions
3. **Sign-out Issues**: Should be resolved since all components use the same auth context

## Testing

After updating the environment variables:

1. **Local Development**: 
   - Restart both `npm run dev` and `cd api-backend && npm run dev`
   - Try logging in and sending a message

2. **Production**:
   - Wait for Vercel deployment to complete
   - Test login and messaging on your live site

## Security Note

The placeholder values in the committed files are safe. Your actual API keys should only exist in:
- Your local environment files (not committed)
- Vercel environment variables dashboard