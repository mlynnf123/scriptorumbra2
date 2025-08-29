import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export const handleMobileAuth = async (authUrl: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    // Open Stack Auth in the browser, then return to app
    await Browser.open({
      url: authUrl,
      windowName: '_system'
    });
  } else {
    // On web, use normal redirect
    window.location.href = authUrl;
  }
};

export const isMobileApp = (): boolean => {
  return Capacitor.isNativePlatform();
};