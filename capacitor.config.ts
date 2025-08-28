import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scriptorumbra.app',
  appName: 'Scriptor Umbra',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
