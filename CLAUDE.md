# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Umbra is a modern AI chat assistant application built with React, TypeScript, and Tailwind CSS. It features a full-stack architecture with OpenAI integration, Stack Auth authentication, and a responsive UI.

## Key Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:5173
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests with Vitest
npm run typecheck    # TypeScript type checking
npm run format.fix   # Format code with Prettier

# Testing specific files
npm run test path/to/test.spec.ts

# Backend (if working with api-backend/)
cd api-backend && npm run dev   # Start Express server
cd api-backend && npm test      # Run backend tests
```

## Architecture

### Frontend Structure
- **src/components/**: React components, including 45+ Shadcn/ui components in `ui/` subdirectory
- **src/pages/**: Route pages (Index, Chat, Settings, etc.)
- **src/contexts/**: React contexts for state management
- **src/hooks/**: Custom React hooks
- **src/lib/**: Core utilities including `api.ts` (API client) and `openai.ts` (OpenAI integration)
- **src/types/**: TypeScript type definitions

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui, Framer Motion
- **Auth**: Stack Auth for user authentication
- **State**: React Context API, Tanstack Query for data fetching
- **Routing**: React Router v6 with protected routes
- **Backend**: Express.js API (in `api-backend/`), PostgreSQL, JWT auth

### API Architecture
- Frontend API client in `src/lib/api.ts` with auth interceptors
- Vercel API functions in `api/` directory
- Express backend in `api-backend/` with routes for chat, auth, and user management

## Development Patterns

### Component Patterns
- Use existing Shadcn/ui components from `src/components/ui/`
- Follow existing component structure and naming conventions
- Components use TypeScript interfaces for props
- Tailwind classes for styling, avoid inline styles

### State Management
- AuthContext for authentication state
- Custom hooks for reusable logic
- Tanstack Query for server state

### Error Handling
- API errors are handled in the API client
- UI components show loading and error states
- Form validation with proper error messages

### Testing
- Use Vitest for testing
- Test files use `.test.ts` or `.spec.ts` suffix
- Frontend testing with React Testing Library

## Environment Variables

Required in `.env`:
```bash
# OpenAI
VITE_OPENAI_API_KEY=sk-...

# Stack Auth
VITE_STACK_PROJECT_ID=...
VITE_STACK_PUBLISHABLE_CLIENT_KEY=...

# Optional
VITE_OPENAI_ASSISTANT_ID=asst_...
VITE_VERCEL_PROJECT_ID=...
VITE_VERCEL_TOKEN=...
```

## Code Style
- Prettier formatting: 2 spaces, single quotes, trailing commas
- TypeScript with relaxed null checks (strictNullChecks: false)
- Avoid adding comments unless necessary
- Follow existing patterns in the codebase