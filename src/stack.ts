import { StackClientApp } from '@stackframe/react';
import { useNavigate } from 'react-router-dom';

console.log("Stack Auth Config:", {
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  isProd: import.meta.env.PROD,
  currentUrl: window.location.origin
});

export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  tokenStore: 'cookie',
  redirectMethod: { useNavigate },
  // Don't set baseUrl - let Stack Auth use its own servers
});
