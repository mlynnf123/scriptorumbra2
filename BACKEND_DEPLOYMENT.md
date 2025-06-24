# Backend Deployment Guide

## ✅ Backend Added to Your Vercel App!

I've restructured your API to work with Vercel Functions. Here's what I've done and what you need to do next:

## 🔧 What's Been Added

### API Structure
```
api/
├── lib/
│   ├── database.js     # Database connection pool
│   └── auth.js         # Authentication middleware
└── chat/
    ├── sessions.js                    # GET/POST/DELETE /api/chat/sessions
    ├── [sessionId]/
    │   ├── index.js                   # GET/PATCH/DELETE /api/chat/:sessionId
    │   └── messages.js                # POST /api/chat/:sessionId/messages
```

### Dependencies Added
- `pg` - PostgreSQL database client
- `openai` - OpenAI API client
- `jsonwebtoken` - JWT token handling

## 🚀 Deployment Steps

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Add Vercel Functions API backend"
git push origin main
```

### 2. Configure Environment Variables in Vercel

Go to your Vercel project dashboard and add these **backend** environment variables:

#### Required Variables:
```
# OpenAI API
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_ASSISTANT_ID=asst_your_assistant_id_here (optional)

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Stack Auth (Backend)
STACK_SECRET_SERVER_KEY=your_stack_secret_server_key_here
STACK_APP_ID=your_stack_app_id_here

# JWT Secret
JWT_SECRET=your_random_secure_string_here

# Environment
NODE_ENV=production
```

#### How to Get These Values:

**OpenAI API:**
- Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Create or copy your API key

**Neon Database:**
- Go to your [Neon dashboard](https://console.neon.tech)
- Copy the connection string from your database

**Stack Auth:**
- Go to your [Stack Auth dashboard](https://app.stack-auth.com)
- Get your App ID and Secret Server Key

**JWT Secret:**
- Generate a random string: `openssl rand -hex 32`

### 3. Database Setup

If you haven't set up the database tables yet:

1. **Connect to your Neon database** using a PostgreSQL client
2. **Run the migration script** from `api-backend/scripts/migrate-stack.js`

Or create the tables manually:

```sql
-- Users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages table  
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

### 4. Test the Deployment

After deployment:

1. ✅ **Frontend should load** (already working)
2. ✅ **Authentication should work** (Stack Auth)
3. ✅ **Chat functionality should work** (new backend)

### 5. Troubleshooting

#### Check Vercel Function Logs:
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# View logs
vercel logs --follow
```

#### Common Issues:

**Database Connection Errors:**
- Verify `DATABASE_URL` is correct
- Check if Neon database is running
- Ensure SSL is enabled in connection string

**Authentication Errors:**
- Verify Stack Auth environment variables
- Check if domains are configured in Stack Auth dashboard

**OpenAI API Errors:**
- Verify `OPENAI_API_KEY` is valid
- Check API quota/usage limits

## 🎉 Success!

Once deployed and configured, your Scriptor Umbra app will have:

- ✅ **Full frontend functionality** (mobile-responsive, blue theme)
- ✅ **Complete backend API** (Vercel Functions)
- ✅ **User authentication** (Stack Auth)
- ✅ **Chat functionality** (OpenAI integration)
- ✅ **Database persistence** (Neon PostgreSQL)

Your intelligent ghostwriting assistant will be fully operational! 🚀

## API Endpoints Available:

- `GET /api/chat/sessions` - Get all chat sessions
- `POST /api/chat/sessions` - Create new chat session  
- `GET /api/chat/:sessionId` - Get specific session with messages
- `PATCH /api/chat/:sessionId` - Update session title
- `DELETE /api/chat/:sessionId` - Delete specific session
- `DELETE /api/chat/sessions` - Delete all sessions
- `POST /api/chat/:sessionId/messages` - Send message to chat