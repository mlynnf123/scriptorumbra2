// Native Stack Auth implementation using REST API
// Bypasses Stack Auth SDK limitations in Capacitor

import { Capacitor } from '@capacitor/core';

interface StackUser {
  id: string;
  email: string;
  displayName?: string;
  profileImageUrl?: string;
}

interface StackTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: StackUser;
  tokens: StackTokens;
}

export class StackAuthNative {
  private static getApiBaseUrl(): string {
    if (Capacitor.isNativePlatform()) {
      return 'https://scriptorumbra2.vercel.app/api';
    }
    return import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';
  }

  // Sign in with email/password using our backend proxy
  static async signInWithCredentials(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Native sign-in attempt for:', email);
      
      const apiUrl = `${this.getApiBaseUrl()}/debug`;
      console.log('🌐 Making request to:', apiUrl);
      
      const requestBody = {
        email,
        password,
        action: 'signin'
      };
      console.log('📝 Request body:', { ...requestBody, password: '[REDACTED]' });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🔄 Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📦 Response received:', { success: result.success, hasData: !!result.data });

      if (!result.success) {
        console.error('❌ Auth failed:', result.message);
        throw new Error(result.message || 'Authentication failed');
      }

      const { user, accessToken, refreshToken } = result.data;
      
      if (!user || !accessToken) {
        throw new Error('Invalid response: missing user data or token');
      }
      
      console.log('✅ Auth successful for user:', user.id);
      
      // Store tokens in localStorage for persistence
      localStorage.setItem('stack-native-access-token', accessToken);
      localStorage.setItem('stack-native-refresh-token', refreshToken);
      localStorage.setItem('stack-native-user', JSON.stringify(user));

      return {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      console.error('❌ Stack Auth native sign-in error:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to authentication server');
      }
      
      throw error;
    }
  }

  // Sign up with email/password using our backend proxy
  static async signUpWithCredentials(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Native sign-up attempt for:', email);
      
      const apiUrl = `${this.getApiBaseUrl()}/debug`;
      console.log('🌐 Making request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          action: 'signup'
        }),
      });

      console.log('🔄 Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📦 Response received:', { success: result.success, hasData: !!result.data });

      if (!result.success) {
        console.error('❌ Sign-up failed:', result.message);
        throw new Error(result.message || 'Sign up failed');
      }

      const { user, accessToken, refreshToken } = result.data;
      
      if (!user || !accessToken) {
        throw new Error('Invalid response: missing user data or token');
      }
      
      console.log('✅ Sign-up successful for user:', user.id);
      
      // Store tokens in localStorage for persistence
      localStorage.setItem('stack-native-access-token', accessToken);
      localStorage.setItem('stack-native-refresh-token', refreshToken);
      localStorage.setItem('stack-native-user', JSON.stringify(user));

      return {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      console.error('❌ Stack Auth native sign-up error:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to authentication server');
      }
      
      throw error;
    }
  }

  // Get current user from stored tokens
  static async getCurrentUser(): Promise<StackUser | null> {
    try {
      const accessToken = localStorage.getItem('stack-native-access-token');
      const storedUser = localStorage.getItem('stack-native-user');
      
      if (!accessToken || !storedUser) {
        return null;
      }

      // For now, just return the stored user
      // In a full implementation, you'd verify the token is still valid
      const user = JSON.parse(storedUser);
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      // Clear all stored auth data
      localStorage.removeItem('stack-native-access-token');
      localStorage.removeItem('stack-native-refresh-token');
      localStorage.removeItem('stack-native-user');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  // Get access token for API calls
  static getAccessToken(): string | null {
    return localStorage.getItem('stack-native-access-token');
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('stack-native-access-token');
  }
}