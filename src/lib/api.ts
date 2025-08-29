import axios from 'axios';
import { ChatSession } from '@/types/chat';
import { stackClientApp } from '@/stack';
import { Capacitor } from '@capacitor/core';
import { StackAuthNative } from '@/utils/stack-auth-native';

// Determine the API base URL based on environment
const getBaseURL = () => {
  if (Capacitor.isNativePlatform()) {
    // For mobile apps, always use the production API
    return 'https://scriptorumbra2.vercel.app/api';
  }
  return import.meta.env.PROD 
    ? '/api'  // In production web, use relative path for Vercel functions
    : 'http://localhost:3001/api'; // In development, use local backend
};

const instance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
instance.interceptors.request.use(
  async (config) => {
    try {
      let token = null;
      
      // Use native auth for Capacitor, regular Stack Auth for web
      if (Capacitor.isNativePlatform()) {
        token = StackAuthNative.getAccessToken();
        console.log('API client - Using native auth token');
      } else {
        const user = await stackClientApp.getUser();
        
        if (user) {
          // Try different ways to get the access token
          
          // Try getAuthHeaders method
          if (typeof user.getAuthHeaders === 'function') {
            try {
              const authHeaders = await user.getAuthHeaders();
              
              if (authHeaders.Authorization) {
                // Extract token from "Bearer <token>"
                token = authHeaders.Authorization.replace('Bearer ', '');
              } else if (authHeaders['x-stack-auth']) {
                // Parse the Stack auth JSON
                try {
                  const stackAuth = JSON.parse(authHeaders['x-stack-auth']);
                  token = stackAuth.accessToken;
                } catch (parseError) {
                  console.log('Could not parse x-stack-auth:', parseError);
                }
              }
            } catch (e) {
              console.log('Could not get auth headers:', e);
            }
          }
          
          // Fallback methods
          if (!token && typeof user.getAccessToken === 'function') {
            token = await user.getAccessToken();
          } else if (!token && user.accessToken) {
            token = user.accessToken;
          } else if (!token && user.access_token) {
            token = user.access_token;
          }
        } else {
          console.log('API client - No user found');
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log('API client - No token available');
      }
    } catch (error) {
      console.log('API client - Error getting auth:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiClient = {
  getChatSessions: async (): Promise<ChatSession[]> => {
    const response = await instance.get('/chat/sessions');
    return response.data.data.sessions;
  },

  createChatSession: async (title?: string, userEmail?: string, userName?: string): Promise<ChatSession> => {
    const response = await instance.post('/chat/sessions', { 
      title,
      userEmail,
      userName 
    });
    return response.data.data.session;
  },

  sendMessage: async (sessionId: string, content: string, options?: { model?: string; files?: File[] }) => {
    let images: { base64: string; mediaType: string; name: string }[] = [];
    
    // Convert image files to base64 if provided
    if (options?.files && options.files.length > 0) {
      const imageFiles = options.files.filter(file => file.type.startsWith('image/'));
      
      images = await Promise.all(
        imageFiles.map(async (file) => {
          return new Promise<{ base64: string; mediaType: string; name: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64String = (reader.result as string).split(',')[1]; // Remove data:image/...;base64, prefix
              resolve({
                base64: base64String,
                mediaType: file.type,
                name: file.name
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );
    }
    
    const payload = { 
      sessionId,
      content,
      ...(options?.model && { model: options.model }),
      ...(images.length > 0 && { images })
    };
    
    const response = await instance.post(`/send-message`, payload);
    return response.data.data; // Extract the nested data object
  },

  updateSessionTitle: async (sessionId: string, title: string) => {
    const response = await instance.patch(`/chat/sessions/${sessionId}`, { title });
    return response.data.data.session;
  },

  deleteSession: async (sessionId: string) => {
    await instance.delete(`/chat/sessions/${sessionId}`);
  },

  clearAllSessions: async () => {
    await instance.delete('/chat/sessions');
  },
};
