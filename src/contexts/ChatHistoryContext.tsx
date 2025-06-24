import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface ChatHistoryContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentSession: ChatSession | null;
  createNewSession: (title?: string) => string;
  switchToSession: (sessionId: string) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;
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
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load chat history when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadChatHistory();
    } else {
      setSessions([]);
      setCurrentSessionId(null);
    }
  }, [isAuthenticated, user]);

  const loadChatHistory = () => {
    try {
      const storedHistory = localStorage.getItem("scriptor_chat_history");
      if (storedHistory) {
        const history = JSON.parse(storedHistory);
        const userSessions = history
          .filter((session: any) => session.userId === user?.id)
          .map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            messages: session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));

        setSessions(userSessions);

        // Set current session to the most recent one, or create a new one
        if (userSessions.length > 0) {
          const mostRecent = userSessions.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          )[0];
          setCurrentSessionId(mostRecent.id);
        } else {
          createNewSession();
        }
      } else {
        createNewSession();
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      createNewSession();
    }
  };

  const saveChatHistory = (updatedSessions: ChatSession[]) => {
    try {
      // Get all sessions from localStorage, not just current user's
      const existingHistory = localStorage.getItem("scriptor_chat_history");
      let allSessions: ChatSession[] = [];

      if (existingHistory) {
        allSessions = JSON.parse(existingHistory);
        // Remove current user's sessions and add updated ones
        allSessions = allSessions.filter(
          (session) => session.userId !== user?.id,
        );
      }

      allSessions.push(...updatedSessions);
      localStorage.setItem(
        "scriptor_chat_history",
        JSON.stringify(allSessions),
      );
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const createNewSession = (title?: string): string => {
    if (!user) return "";

    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: title || "New Conversation",
      messages: [
        {
          id: "welcome",
          content:
            "Hello! I'm Scriptor Umbra, your intelligent ghostwriting assistant. I specialize in articles, books, copywriting, and long-form content creation. How can I help you craft exceptional content today?",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    saveChatHistory(updatedSessions);

    return newSession.id;
  };

  const switchToSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const addMessageToSession = (sessionId: string, message: ChatMessage) => {
    const updatedSessions = sessions.map((session) => {
      if (session.id === sessionId) {
        return {
          ...session,
          messages: [...session.messages, message],
          updatedAt: new Date(),
        };
      }
      return session;
    });

    setSessions(updatedSessions);
    saveChatHistory(updatedSessions);
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    const updatedSessions = sessions.map((session) => {
      if (session.id === sessionId) {
        return {
          ...session,
          title,
          updatedAt: new Date(),
        };
      }
      return session;
    });

    setSessions(updatedSessions);
    saveChatHistory(updatedSessions);
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(
      (session) => session.id !== sessionId,
    );
    setSessions(updatedSessions);
    saveChatHistory(updatedSessions);

    // If we're deleting the current session, switch to another or create new
    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const clearAllSessions = () => {
    setSessions([]);
    setCurrentSessionId(null);
    saveChatHistory([]);
    createNewSession();
  };

  const currentSession =
    sessions.find((session) => session.id === currentSessionId) || null;

  const value: ChatHistoryContextType = {
    sessions,
    currentSessionId,
    currentSession,
    createNewSession,
    switchToSession,
    addMessageToSession,
    updateSessionTitle,
    deleteSession,
    clearAllSessions,
  };

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  );
};
