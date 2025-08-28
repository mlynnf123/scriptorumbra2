# Update Stack Auth Environment Variables

## Manual Steps to Update in Vercel Dashboard

Since the CLI is having issues, please add these environment variables manually in the Vercel dashboard:

1. Go to https://vercel.com/mlynnf123s-projects/scriptorumbra2/settings/environment-variables

2. Add these three variables:

### VITE_STACK_PROJECT_ID
- Value: `0c5ca710-738a-428b-896a-2ed285ba335d`
- Environments: Production, Preview, Development

### VITE_STACK_PUBLISHABLE_CLIENT_KEY
- Value: `pck_yx5ckhtym3atfqm63nmybedaq66axqy7sfh0s1w5q86x0`
- Environments: Production, Preview, Development

### STACK_SECRET_SERVER_KEY
- Value: `ssk_kpny4ttkw0zb7fqkjsc469p83y1whemkcgvc6g2v7wb18`
- Environments: Production, Preview, Development

## Important: Stack Auth Domain Configuration

After updating the environment variables, make sure your Stack Auth project has these domains whitelisted:

1. Go to your Stack Auth dashboard: https://app.stack-auth.com/
2. Select your project (ID: 0c5ca710-738a-428b-896a-2ed285ba335d)
3. Find the "Domains" or "Allowed Origins" settings
4. Add these URLs:
   - `https://scriptorumbra2-mlynnf123s-projects.vercel.app`
   - `https://scriptorumbra2.vercel.app`
   - `http://localhost:5173`
   - `*.vercel.app`

## Testing

After updating:
1. Wait for automatic deployment to complete
2. Clear browser cache/cookies
3. Try signing up/signing in again