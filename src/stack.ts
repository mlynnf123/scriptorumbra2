import { StackClientApp } from '@stackframe/react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

// Check if running in Capacitor
const isCapacitor = Capacitor.isNativePlatform();

console.log("Stack Auth Config:", {
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  isProd: import.meta.env.PROD,
  currentUrl: window.location.origin,
  isCapacitor: isCapacitor
});

export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  tokenStore: 'localStorage', // Use localStorage for consistency
  redirectMethod: { useNavigate },
  // For mobile apps, use the actual production domain
  ...(isCapacitor && {
    baseUrl: 'https://scriptorumbra2.vercel.app'
  })
});
