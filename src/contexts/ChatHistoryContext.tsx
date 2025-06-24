import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@stackframe/react";
import { apiClient } from "@/lib/api";
import { ChatMessage, ChatSession } from "@/types/chat";



interface ChatHistoryContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentSession: ChatSession | null;
  isLoading: boolean;
  createNewSession: (title?: string) => Promise<string>;
  switchToSession: (sessionId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;
  refreshSessions: () => Promise<void>;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(
  undefined,
);

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error("useChatHistory must be used within a ChatHistoryProvider");
  }
  return context;
};

interface ChatHistoryProviderProps {
  children: React.ReactNode;
}

export const ChatHistoryProvider: React.FC<ChatHistoryProviderProps> = ({
  children,
}) => {
  const user = useUser();
  const isAuthenticated = !!user;
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load chat sessions when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadChatSessions();
    } else {
      setSessions([]);
      setCurrentSessionId(null);
    }
  }, [isAuthenticated, user]);

  const loadChatSessions = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const sessionData = await apiClient.getChatSessions();
      setSessions(sessionData);

      // Set current session to the most recent one, or create a new one
      if (sessionData.length > 0) {
        const mostRecent = sessionData.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )[0];
        setCurrentSessionId(mostRecent.id);
      } else {
        // Create initial session if none exists
        await createNewSession("Welcome to Scriptor Umbra");
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSessions = async () => {
    await loadChatSessions();
  };

  const createNewSession = async (title?: string): Promise<string> => {
    if (!isAuthenticated) return "";

    try {
      const newSession = await apiClient.createChatSession(title);

      // Add the welcome message to the session object
      const sessionWithMessages = {
        ...newSession,
        messages: [
          {
            id: `welcome_${Date.now()}`,
            role: "assistant" as const,
            content:
              "Hello! I'm Scriptor Umbra, your intelligent ghostwriting assistant. I specialize in articles, books, copywriting, and long-form content creation. How can I help you craft exceptional content today?",
            created_at: new Date().toISOString(),
          },
        ],
        message_count: 1,
      };

      setSessions((prev) => [sessionWithMessages, ...prev]);
      setCurrentSessionId(newSession.id);

      return newSession.id;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  };

  const switchToSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const sendMessage = async (content: string): Promise<void> => {
    if (!currentSessionId || !isAuthenticated) return;

    try {
      const response = await apiClient.sendMessage(currentSessionId, content);

      // Update the current session with new messages
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === currentSessionId) {
            const updatedMessages = [
              ...session.messages,
              {
                id: response.userMessage.id,
                role: response.userMessage.role,
                content: response.userMessage.content,
                created_at: response.userMessage.created_at,
              },
              {
                id: response.assistantMessage.id,
                role: response.assistantMessage.role,
                content: response.assistantMessage.content,
                created_at: response.assistantMessage.created_at,
              },
            ];

            return {
              ...session,
              messages: updatedMessages,
              updated_at: new Date().toISOString(),
              message_count: updatedMessages.length,
            };
          }
          return session;
        }),
      );
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const updateSessionTitle = async (
    sessionId: string,
    title: string,
  ): Promise<void> => {
    try {
      await apiClient.updateSessionTitle(sessionId, title);

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, title, updated_at: new Date().toISOString() }
            : session,
        ),
      );
    } catch (error) {
      console.error("Error updating session title:", error);
      throw error;
    }
  };

  const clearAllSessions = async () => {
    try {
      await apiClient.clearAllSessions();
      setSessions([]);
      setCurrentSessionId(null);
    } catch (error) {
      console.error("Failed to clear all sessions:", error);
      throw error;
    }
  };

  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      await apiClient.deleteSession(sessionId);

      const updatedSessions = sessions.filter(
        (session) => session.id !== sessionId,
      );
      setSessions(updatedSessions);

      // If we're deleting the current session, switch to another or create new
      if (currentSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].id);
        } else {
          await createNewSession();
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  };

  const currentSession =
    sessions.find((session) => session.id === currentSessionId) || null;

  const value: ChatHistoryContextType = {
    sessions,
    currentSessionId,
    currentSession,
    isLoading,
    createNewSession,
    switchToSession,
    sendMessage,
    updateSessionTitle,
    deleteSession,
    clearAllSessions,
    refreshSessions,
  };

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  );
};
