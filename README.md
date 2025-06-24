# Umbra - AI Chat Assistant

A beautiful, modern AI chat interface powered by OpenAI, built with React, TypeScript, and Tailwind CSS.

![Umbra Screenshot](https://via.placeholder.com/800x400/6366f1/ffffff?text=Umbra+AI+Assistant)

## ✨ Features

- 🤖 **OpenAI Integration** - Connect to GPT-4 and custom OpenAI Assistants
- 🎨 **Modern UI** - Beautiful, responsive interface with dark/light themes
- ⚡ **Real-time Chat** - Smooth, real-time messaging experience
- 🔒 **Secure** - Environment-based API key management
- 📱 **Responsive** - Works perfectly on desktop, tablet, and mobile
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📋 **Copy Messages** - Easily copy assistant responses
- 🔄 **Chat Management** - Clear chat history and manage conversations

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-username/umbra-chat.git
cd umbra-chat
npm install
```

### 2. Environment Setup

Create a `.env` file in your project root:

```bash
# OpenAI Configuration (Required)
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here

# OpenAI Assistant ID (Optional)
VITE_OPENAI_ASSISTANT_ID=asst_your-assistant-id-here

# Vercel Integration (Optional)
VITE_VERCEL_PROJECT_ID=your-vercel-project-id
VITE_VERCEL_TOKEN=your-vercel-access-token
```

### 3. Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Go to "API Keys" section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 4. (Optional) Create an OpenAI Assistant

1. Visit [OpenAI Assistants](https://platform.openai.com/assistants)
2. Create a new assistant with custom instructions
3. Copy the Assistant ID (starts with `asst_`)
4. Add it to your `.env` file

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your AI assistant in action!

## 🔧 Advanced Configuration

### Using Vercel Environment Variables

If you have a Vercel project with environment variables already configured, you can use the Vercel API to fetch them:

```bash
# Get your Vercel project info
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
     "https://api.vercel.com/v9/projects"

# Get environment variables
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
     "https://api.vercel.com/v10/projects/YOUR_PROJECT_ID/env"
```

### Custom Assistant Configuration

You can customize your assistant's behavior by:

1. **Using the Assistant API**: Set `VITE_OPENAI_ASSISTANT_ID` for enhanced capabilities
2. **Modifying the system prompt**: Edit the system message in `src/lib/openai.ts`
3. **Adjusting parameters**: Modify temperature, max_tokens, etc. in the OpenAI service

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Shadcn/ui components
│   └── SetupInstructions.tsx
├── lib/
│   ├── openai.ts          # OpenAI service and API calls
│   └── utils.ts           # Utility functions
├── pages/
│   ├── Index.tsx          # Main chat interface
│   └── NotFound.tsx       # 404 page
├── App.tsx                # App router and providers
├── index.css              # Global styles and theme
└── main.tsx               # App entry point
```

## 🎨 Customization

### Theme Colors

Update the color palette in `src/index.css`:

```css
:root {
  --umbra-primary: 262.1 83.3% 57.8%;
  --umbra-secondary: 252.5 64.8% 56.5%;
  --umbra-accent: 341.7 75.9% 65.5%;
}
```

### Brand Identity

Modify the brand elements in `src/pages/Index.tsx`:

- Logo and name in the header
- Welcome message
- Color gradients and styling

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_OPENAI_API_KEY`
   - `VITE_OPENAI_ASSISTANT_ID` (optional)
4. Deploy!

### Deploy to Netlify

1. Build your project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Add environment variables in Netlify dashboard


## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run typecheck    # TypeScript type checking
```

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **New Pages**: Add to `src/pages/` and update routing in `App.tsx`
3. **API Changes**: Modify `src/lib/openai.ts`
4. **Styling**: Update `src/index.css` or component styles

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality component library
- **OpenAI API** - AI capabilities
- **React Router** - Client-side routing
- **Framer Motion** - Animations
- **Lucide React** - Beautiful icons


