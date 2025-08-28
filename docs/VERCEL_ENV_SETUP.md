# Vercel Environment Variables Setup Guide

This guide explains how to properly configure environment variables in Vercel for the Scriptor Umbra application.

## Required Environment Variables

You need to add the following environment variables in your Vercel dashboard:

### 1. OpenAI Configuration
- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `OPENAI_ASSISTANT_ID` - Your OpenAI Assistant ID (optional, but recommended)

### 2. Database Configuration
- `DATABASE_URL` - PostgreSQL connection string (required)
  - Format: `postgresql://username:password@host:port/database?sslmode=require`

### 3. Authentication
- `JWT_SECRET` - Secret key for JWT tokens (required)
- `STACK_SECRET_SERVER_KEY` - Stack Auth server key (required)

### 4. Additional Services (Optional)
- `GEMINI_API_KEY` - Google Gemini API key (optional)
- `NODE_ENV` - Set to `production` (automatically set by Vercel)

## How to Add Environment Variables in Vercel

1. **Go to your Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard
   - Select your project (scriptorumbra2)

2. **Access Settings**
   - Click on the "Settings" tab
   - Navigate to "Environment Variables" in the sidebar

3. **Add Variables**
   - Click "Add New"
   - Enter the variable name (e.g., `OPENAI_API_KEY`)
   - Enter the value (your actual API key)
   - Select which environments to apply to (Production, Preview, Development)
   - Click "Save"

4. **Important Notes**
   - DO NOT include quotes around the values
   - Make sure there are no extra spaces
   - For Production deployment, ensure "Production" is checked

5. **Redeploy**
   - After adding all variables, go to the "Deployments" tab
   - Click on the three dots next to your latest deployment
   - Select "Redeploy"

## Verifying Configuration

You can verify your environment variables are set correctly by:

1. Checking the debug endpoint: `https://your-domain.vercel.app/api/debug`
2. Looking at the Function logs in Vercel dashboard

## Common Issues

### 500 Errors
If you're getting 500 errors when sending messages, it's likely due to missing environment variables. Check:
- OpenAI API key is valid and has credits
- Database URL is correct and accessible
- All required variables are set

### Authentication Errors
If authentication is failing:
- Verify `JWT_SECRET` matches between frontend and backend
- Check `STACK_SECRET_SERVER_KEY` is correct

## Security Notes

- Never commit these values to your repository
- Use different values for development and production
- Rotate keys regularly
- Monitor usage in your respective dashboards (OpenAI, Database provider, etc.)