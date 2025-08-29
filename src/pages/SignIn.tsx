import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stackClientApp } from "@/stack";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { MobileAuthBridge } from "@/utils/mobile-auth-bridge";
import { StackAuthNative } from "@/utils/stack-auth-native";
import { useChatHistory } from "@/contexts/ChatHistoryContext";

export default function SignIn() {
  const navigate = useNavigate();
  const chatContext = useChatHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Check if user is already signed in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let user = null;
        
        // Use native auth for Capacitor, regular Stack Auth for web
        if (Capacitor.isNativePlatform()) {
          user = await StackAuthNative.getCurrentUser();
        } else {
          user = await stackClientApp.getUser();
          // Check if this is a mobile redirect
          const urlParams = new URLSearchParams(window.location.search);
          const isMobile = urlParams.get('mobile') === 'true';
          
          if (user && isMobile) {
            // Redirect to auth success page which will handle mobile redirect
            navigate(`/auth-success?${window.location.search}`);
            return;
          }
        }
        
        if (user) {
          navigate("/");
        }
      } catch (error) {
        // User not signed in, continue with signin page
        console.error('Auth check error:', error);
      }
    };
    
    checkAuth();
    
    // For mobile apps, add app state listeners
    if (Capacitor.isNativePlatform()) {
      const handleAppStateChange = () => {
        // Check auth again when user returns from browser
        setTimeout(checkAuth, 1000); // Give Stack Auth time to sync
      };
      
      const handleUrlOpen = async (event: any) => {
        console.log('App URL opened:', event.url);
        if (event.url && event.url.includes('auth-success')) {
          // Extract session ID from URL if present
          const url = new URL(event.url);
          const sessionId = url.searchParams.get('session');
          
          try {
            // Check for auth token from bridge
            const authData = await MobileAuthBridge.checkForAuthToken(sessionId);
            if (authData) {
              console.log('Found auth data from bridge, applying...');
              const success = await MobileAuthBridge.applyAuthToken(authData);
              if (success) {
                navigate("/");
                return;
              }
            }
          } catch (error) {
            console.error('Error handling auth bridge:', error);
          }
          
          // Fallback to regular auth check
          setTimeout(checkAuth, 500);
        }
      };
      
      window.addEventListener('focus', handleAppStateChange);
      window.addEventListener('visibilitychange', handleAppStateChange);
      
      // Listen for app state changes and URL opens
      App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
          console.log('App became active, checking for auth bridge...');
          try {
            // First check if there's any auth data waiting
            const authData = await MobileAuthBridge.checkForAuthToken();
            if (authData) {
              console.log('Found auth data from bridge on app resume, applying...');
              const success = await MobileAuthBridge.applyAuthToken(authData);
              if (success) {
                navigate("/");
                return;
              }
            }
          } catch (error) {
            console.error('Error checking auth bridge on resume:', error);
          }
          
          // Fallback to regular auth check
          setTimeout(checkAuth, 500);
        }
      });
      
      App.addListener('appUrlOpen', handleUrlOpen);
      
      return () => {
        window.removeEventListener('focus', handleAppStateChange);
        window.removeEventListener('visibilitychange', handleAppStateChange);
        App.removeAllListeners();
      };
    }
  }, [navigate]);

  const handleNativeAuth = async (isSignUp: boolean, email: string, password: string) => {
    try {
      console.log(`🔐 Starting native ${isSignUp ? 'sign-up' : 'sign-in'} process`);
      
      // Basic client-side validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      let result;
      
      if (isSignUp) {
        result = await StackAuthNative.signUpWithCredentials(email, password);
      } else {
        result = await StackAuthNative.signInWithCredentials(email, password);
      }
      
      console.log('✅ Native auth successful:', result.user.email);
      
      // Refresh the auth state in the context
      if (chatContext && chatContext.refreshAuthState) {
        await chatContext.refreshAuthState();
      }
      
      navigate("/");
      
    } catch (error: any) {
      console.error('❌ Native auth error:', error);
      
      // Show user-friendly error message
      let userMessage = 'Authentication failed';
      
      if (error.message) {
        if (error.message.includes('Network error')) {
          userMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('valid email')) {
          userMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('6 characters')) {
          userMessage = 'Password must be at least 6 characters long.';
        } else {
          userMessage = error.message;
        }
      }
      
      alert(userMessage);
      throw error;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // If running in mobile app, use native authentication
      if (Capacitor.isNativePlatform()) {
        await handleNativeAuth(false, email, password);
        return;
      }
      
      // Web-based authentication (existing code)
      console.log("Attempting signin with:", { email, hasPassword: !!password });

      const result = await stackClientApp.signInWithCredential({
        email,
        password,
      });
      console.log("Sign in successful:", result);
      
      // Check if this is a mobile redirect
      const urlParams = new URLSearchParams(window.location.search);
      const isMobile = urlParams.get('mobile') === 'true';
      
      if (isMobile) {
        navigate(`/auth-success?${window.location.search}`);
      } else {
        navigate("/");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      alert(`Sign in failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // If running in mobile app, use native authentication
      if (Capacitor.isNativePlatform()) {
        await handleNativeAuth(true, email, password);
        return;
      }
      
      // Web-based authentication (existing code)
      console.log("Attempting signup with:", { email, name, hasPassword: !!password });

      const result = await stackClientApp.signUpWithCredential({
        email,
        password,
      });
      console.log("Sign up successful:", result);
      
      // Check if this is a mobile redirect
      const urlParams = new URLSearchParams(window.location.search);
      const isMobile = urlParams.get('mobile') === 'true';
      
      if (isMobile) {
        navigate(`/auth-success?${window.location.search}`);
      } else {
        navigate("/");
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      alert(`Sign up failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="Scriptor Umbra Logo" 
              className="w-16 h-16 rounded-2xl object-cover"
            />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-light bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Scriptor Umbra
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Sign in to access your intelligent ghostwriting assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}