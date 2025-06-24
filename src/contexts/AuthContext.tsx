import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem("scriptor_user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser({
            ...userData,
            createdAt: new Date(userData.createdAt),
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        localStorage.removeItem("scriptor_user");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);

    try {
      // Simulate API call - replace with actual authentication
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo purposes, accept any email/password
      // In production, this would validate against your backend
      const userData: User = {
        id: `user_${Date.now()}`,
        email,
        name: email.split("@")[0],
        avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${email}`,
        createdAt: new Date(),
      };

      setUser(userData);
      localStorage.setItem("scriptor_user", JSON.stringify(userData));
    } catch (error) {
      throw new Error("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
  ): Promise<void> => {
    setIsLoading(true);

    try {
      // Simulate API call - replace with actual registration
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const userData: User = {
        id: `user_${Date.now()}`,
        email,
        name,
        avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${email}`,
        createdAt: new Date(),
      };

      setUser(userData);
      localStorage.setItem("scriptor_user", JSON.stringify(userData));
    } catch (error) {
      throw new Error("Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("scriptor_user");
    localStorage.removeItem("scriptor_chat_history");
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
