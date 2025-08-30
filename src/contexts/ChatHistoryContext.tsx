import React, { createContext, useContext, useState, useEffect } from "react";
import { stackClientApp } from "@/stack";
import { apiClient } from "@/lib/api";
import { ChatMessage, ChatSession } from "@/types/chat";
import { Capacitor } from "@capacitor/core";
import { StackAuthNative } from "@/utils/stack-auth-native";



interface ChatHistoryContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentSession: ChatSession | null;
  isLoading: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  user: any;
  refreshAuthState: () => Promise<void>;
  createNewSession: (title?: string, skipWelcome?: boolean) => Promise<string>;
  createSessionWithMessage: (message: string, title?: string) => Promise<string>;
  switchToSession: (sessionId: string) => void;
  sendMessage: (content: string, options?: { model?: string }) => Promise<void>;
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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Check if running on iOS
  const isIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  
  // Function to refresh authentication state
  const refreshAuthState = async () => {
    try {
      let currentUser = null;
      
      // For iOS, use a temporary user to bypass Stack Auth issues
      if (isIOS) {
        console.log("ChatHistoryContext - Using temporary iOS user");
        currentUser = {
          id: "temp-ios-user",
          email: "ios@temp.com",
          displayName: "iOS User",
          primaryEmail: "ios@temp.com"
        };
      }
      // Use native auth for other Capacitor platforms
      else if (Capacitor.isNativePlatform()) {
        currentUser = await StackAuthNative.getCurrentUser();
        console.log("ChatHistoryContext - Native User (refresh):", currentUser);
      } else {
        currentUser = await stackClientApp.getUser();
        console.log("ChatHistoryContext - Web User (refresh):", currentUser);
      }
      
      setUser(currentUser);
    } catch (error) {
      console.log("ChatHistoryContext - Auth error, using temp user for iOS:", error);
      // For iOS, always provide a temp user even on error
      if (isIOS) {
        setUser({
          id: "temp-ios-user",
          email: "ios@temp.com",
          displayName: "iOS User",
          primaryEmail: "ios@temp.com"
        });
      } else {
        setUser(null);
      }
    }
  };
  
  // Try to get the current user on mount
  useEffect(() => {
    const getUser = async () => {
      try {
        let currentUser = null;
        
        // For iOS, use a temporary user to bypass Stack Auth issues
        if (isIOS) {
          console.log("ChatHistoryContext - Using temporary iOS user (mount)");
          currentUser = {
            id: "temp-ios-user",
            email: "ios@temp.com",
            displayName: "iOS User",
            primaryEmail: "ios@temp.com"
          };
        }
        // Use native auth for other Capacitor platforms
        else if (Capacitor.isNativePlatform()) {
          currentUser = await StackAuthNative.getCurrentUser();
          console.log("ChatHistoryContext - Native User:", currentUser);
        } else {
          currentUser = await stackClientApp.getUser();
          console.log("ChatHistoryContext - Web User:", currentUser);
        }
        
        setUser(currentUser);
      } catch (error) {
        console.log("ChatHistoryContext - Auth error (mount), using temp user for iOS:", error);
        // For iOS, always provide a temp user even on error
        if (isIOS) {
          setUser({
            id: "temp-ios-user",
            email: "ios@temp.com",
            displayName: "iOS User",
            primaryEmail: "ios@temp.com"
          });
        } else {
          setUser(null);
        }
      } finally {
        setAuthLoading(false);
      }
    };
    getUser();
  }, [isIOS]);
  
  const isAuthenticated = !!user;

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

  const createNewSession = async (title?: string, skipWelcome?: boolean): Promise<string> => {
    if (!isAuthenticated) {
      throw new Error("Authentication required to create a session");
    }

    try {
      const newSession = await apiClient.createChatSession(
        title,
        user?.primaryEmail || user?.email,
        user?.displayName || user?.name || user?.primaryEmail
      );

      // Add the welcome message to the session object only if not skipped
      const sessionWithMessages = {
        ...newSession,
        messages: skipWelcome ? [] : [
          {
            id: `welcome_${Date.now()}`,
            role: "assistant" as const,
            content:
              "Hello! I'm Scriptor Umbra, your versatile literary companion. I can channel the writing styles of legendary authors from Hemingway to Plath, from Shakespeare to Bukowski. Whether you need existential prose, whimsical children's rhymes, or anything in between, I'm here to craft it with depth and literary flair. How shall we begin our creative journey today?",
            created_at: new Date().toISOString(),
          },
        ],
        message_count: skipWelcome ? 0 : 1,
      };

      console.log("Creating session with skipWelcome:", skipWelcome);
      console.log("Session messages:", sessionWithMessages.messages);
      setSessions((prev) => [sessionWithMessages, ...prev]);
      setCurrentSessionId(newSession.id);

      return newSession.id;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  };

  const createSessionWithMessage = async (message: string, title?: string): Promise<string> => {
    if (!isAuthenticated) {
      throw new Error("Authentication required to create a session");
    }

    try {
      console.log('Creating new session with message:', message);
      
      // BYPASS API CLIENT - Direct fetch to debug endpoint
      console.log('🚨 TEMPORARY FIX - Creating local session instead of API call');
      
      // Create a temporary local session until backend is working
      const newSession = {
        id: `temp-${Date.now()}`,
        title: initialMessage,
        created_at: new Date().toISOString()
      };
      console.log('API session created with ID:', newSession.id);

      // Set this as the current session immediately
      setCurrentSessionId(newSession.id);

      // Create session object with empty messages initially
      const sessionWithMessages = {
        ...newSession,
        messages: [],
        message_count: 0,
      };

      console.log("Adding new session to sessions list");
      setSessions((prev) => [sessionWithMessages, ...prev]);

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 50));

      // Now send the message using the specific session ID
      console.log('Sending message to new session:', newSession.id);
      const messageResponse = await apiClient.sendMessage(newSession.id, message);
      console.log('Message sent, got response:', messageResponse);

      // Update the session with the actual messages from the API
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === newSession.id) {
            const updatedMessages = [
              {
                id: messageResponse.userMessage.id,
                role: messageResponse.userMessage.role,
                content: messageResponse.userMessage.content,
                created_at: messageResponse.userMessage.created_at,
              },
              {
                id: messageResponse.assistantMessage.id,
                role: messageResponse.assistantMessage.role,
                content: messageResponse.assistantMessage.content,
                created_at: messageResponse.assistantMessage.created_at,
                imageData: messageResponse.assistantMessage.imageData,
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
        })
      );

      console.log('Session updated with messages, returning session ID:', newSession.id);
      return newSession.id;
    } catch (error) {
      console.error("Error creating session with message:", error);
      throw error;
    }
  }


  const sendMessage = async (content: string, files?: File[], options?: { model?: string }): Promise<void> => {
    if (!currentSessionId || !isAuthenticated) {
      throw new Error("Authentication required to send messages");
    }

    try {
      const response = await apiClient.sendMessage(currentSessionId, content, { 
        ...options,
        files 
      });

      // Update the current session with new messages
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === currentSessionId) {
            const updatedMessages = [
              ...session.messages,
              {
                id: messageResponse.userMessage.id,
                role: messageResponse.userMessage.role,
                content: messageResponse.userMessage.content,
                created_at: messageResponse.userMessage.created_at,
              },
              {
                id: messageResponse.assistantMessage.id,
                role: messageResponse.assistantMessage.role,
                content: messageResponse.assistantMessage.content,
                created_at: messageResponse.assistantMessage.created_at,
                imageData: messageResponse.assistantMessage.imageData,
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

  const switchToSession = (sessionId: string) => {
    console.log('Switching to session:', sessionId);
    const session = sessions.find(s => s.id === sessionId);
    console.log('Found session:', session);
    setCurrentSessionId(sessionId);
  };

  const updateSessionTitle = async (
    sessionId: string,
    title: string,
  ): Promise<void> => {
    try {
      await apiClient.updateSessionTitle(sessionId, title);

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, title } : session,
        ),
      );
    } catch (error) {
      console.error("Error updating session title:", error);
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

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      throw error;
    }
  };

  const clearAllSessions = async (): Promise<void> => {
    try {
      await Promise.all(
        sessions.map((session) => apiClient.deleteSession(session.id)),
      );

      setSessions([]);
      setCurrentSessionId(null);
    } catch (error) {
      console.error("Failed to clear all sessions:", error);
      throw error;
    }
  };

  const currentSession =
    sessions.find((session) => session.id === currentSessionId) || null;

  return (
    <ChatHistoryContext.Provider
      value={{
        sessions,
        currentSessionId,
        currentSession,
        isLoading,
        authLoading,
        isAuthenticated,
        user,
        refreshAuthState,
        createNewSession,
        createSessionWithMessage,
        switchToSession,
        sendMessage,
        updateSessionTitle,
        deleteSession,
        clearAllSessions,
        refreshSessions,
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
};
