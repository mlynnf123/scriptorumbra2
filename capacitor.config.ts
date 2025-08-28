import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scriptorumbra.app',
  appName: 'Scriptor Umbra',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow CORS for production API
    allowNavigation: ['scriptorumbra2.vercel.app']
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#ffffff'
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
