import axios from 'axios';
import { ChatSession } from '@/types/chat';

const instance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = {
  getChatSessions: async (): Promise<ChatSession[]> => {
    const response = await instance.get('/chat/sessions');
    return response.data.data.sessions;
  },

  createChatSession: async (title?: string): Promise<ChatSession> => {
    const response = await instance.post('/chat/sessions', { title });
    return response.data.data.session;
  },

  sendMessage: async (sessionId: string, content: string) => {
    const response = await instance.post(`/chat/sessions/${sessionId}/messages`, { content });
    return response.data.data;
  },

  updateSessionTitle: async (sessionId: string, title: string) => {
    const response = await instance.patch(`/chat/sessions/${sessionId}`, { title });
    return response.data.data.session;
  },

  deleteSession: async (sessionId: string) => {
    await instance.delete(`/chat/sessions/${sessionId}`);
  },
};
