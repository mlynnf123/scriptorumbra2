import axios from 'axios';
import { ChatSession } from '@/types/chat';
import { stackClientApp } from '@/stack';

const instance = axios.create({
  baseURL: import.meta.env.PROD 
    ? '/api'  // In production, use relative path for Vercel functions
    : 'http://localhost:3001/api', // In development, use local backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
instance.interceptors.request.use(
  async (config) => {
    try {
      const user = await stackClientApp.getUser();
      
      if (user) {
        
        // Try different ways to get the access token
        let token = null;
        
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
        
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('API client - No token available');
        }
      } else {
        console.log('API client - No user found');
      }
    } catch (error) {
      console.log('API client - Error getting user:', error);
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

  sendMessage: async (sessionId: string, content: string, options?: { model?: string }) => {
    const payload = { 
      content,
      ...(options?.model && { model: options.model })
    };
    const response = await instance.post(`/messages/${sessionId}`, payload);
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
