import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scriptorumbra.app',
  appName: 'Scriptor Umbra',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow navigation to external sites (Stack Auth, API, etc.)
    allowNavigation: [
      'scriptorumbra2.vercel.app',
      '*.stack-auth.com',
      'stack-auth.com'
    ]
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#ffffff',
    scheme: 'scriptorumbra'
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
