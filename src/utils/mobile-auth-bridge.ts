// Mobile Authentication Bridge
// Handles auth token sharing between web browser and mobile app

import { Capacitor } from '@capacitor/core';
import { stackClientApp } from '@/stack';

interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  email: string;
  timestamp: number;
}

const AUTH_TOKEN_KEY = 'scriptor-auth-bridge';
const TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export class MobileAuthBridge {
  // Store auth token for mobile app to pick up
  static async storeAuthForMobile(user: any, tokens: any): Promise<string> {
    const authData: AuthToken = {
      accessToken: tokens.accessToken || '',
      refreshToken: tokens.refreshToken || '',
      userId: user.id,
      email: user.email,
      timestamp: Date.now()
    };

    // Generate a unique session ID for this auth attempt
    const sessionId = Math.random().toString(36).substring(2, 15);
    const key = `${AUTH_TOKEN_KEY}-${sessionId}`;

    // Store in localStorage with expiry
    localStorage.setItem(key, JSON.stringify(authData));

    // Clean up after 10 minutes
    setTimeout(() => {
      localStorage.removeItem(key);
    }, TOKEN_EXPIRY_MS);

    return sessionId;
  }

  // Check if there's a pending auth token (mobile app calls this)
  static async checkForAuthToken(sessionId?: string): Promise<AuthToken | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    // If we have a specific session ID, check for it
    if (sessionId) {
      const key = `${AUTH_TOKEN_KEY}-${sessionId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const authData: AuthToken = JSON.parse(stored);
          if (Date.now() - authData.timestamp < TOKEN_EXPIRY_MS) {
            localStorage.removeItem(key); // Clean up after use
            return authData;
          }
        } catch (error) {
          console.error('Error parsing stored auth token:', error);
        }
      }
    }

    // Otherwise, check for any valid tokens
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AUTH_TOKEN_KEY)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const authData: AuthToken = JSON.parse(stored);
            if (Date.now() - authData.timestamp < TOKEN_EXPIRY_MS) {
              localStorage.removeItem(key); // Clean up after use
              return authData;
            } else {
              localStorage.removeItem(key); // Clean up expired tokens
            }
          } catch (error) {
            console.error('Error parsing stored auth token:', error);
            localStorage.removeItem(key);
          }
        }
      }
    }

    return null;
  }

  // Apply auth token to Stack Auth (mobile app calls this)
  static async applyAuthToken(authData: AuthToken): Promise<boolean> {
    try {
      // Store the tokens in localStorage so Stack Auth can pick them up
      const stackTokens = {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken
      };

      // Store in the format Stack Auth expects
      localStorage.setItem('stack-auth-tokens', JSON.stringify(stackTokens));
      
      // Try to refresh Stack Auth's internal state
      await stackClientApp.signOut(); // Clear any existing state
      
      // Wait a moment for the state to clear
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now Stack Auth should pick up the new tokens
      const user = await stackClientApp.getUser();
      
      return user !== null;
    } catch (error) {
      console.error('Error applying auth token:', error);
      return false;
    }
  }

  // Clean up expired tokens
  static cleanupExpiredTokens(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AUTH_TOKEN_KEY)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const authData: AuthToken = JSON.parse(stored);
            if (Date.now() - authData.timestamp >= TOKEN_EXPIRY_MS) {
              keysToRemove.push(key);
            }
          } catch (error) {
            keysToRemove.push(key); // Remove invalid tokens
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// Clean up expired tokens on module load
MobileAuthBridge.cleanupExpiredTokens();