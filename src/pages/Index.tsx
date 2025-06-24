import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  User,
  Sparkles,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  Copy,
  RefreshCw,
  AlertCircle,
  Menu,
  Plus,
  Feather,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { SetupInstructions } from "@/components/SetupInstructions";
import { stackClientApp } from "@/stack";
import { useChatHistory } from "@/contexts/ChatHistoryContext";
import ChatHistorySidebar from "@/components/ChatHistorySidebar";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

const Index = () => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const {
    currentSession,
    currentSessionId,
    sendMessage: sendChatMessage,
    createNewSession,
    isLoading: chatLoading,
    authLoading,
    isAuthenticated,
    user,
  } = useChatHistory();

  // Check if API key is configured
  const hasApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;

  // Get messages from current session
  const messages = currentSession?.messages || [];
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || chatLoading || !currentSessionId)
      return;

    const messageContent = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      await sendChatMessage(messageContent);
      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);

      let errorMessage = "Failed to send message. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("Authentication required")) {
          errorMessage = "Please sign in to continue.";
          window.location.href = "/sign-in";
          return;
        } else if (error.message.includes("API key")) {
          errorMessage =
            "OpenAI API key not configured. Please check your environment variables.";
        } else if (
          error.message.includes("rate limit") ||
          error.message.includes("quota")
        ) {
          errorMessage = "Rate limit exceeded. Please try again in a moment.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
      // Restore the input value if there was an error
      setInputValue(messageContent);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard");
  };

  const clearChat = () => {
    createNewSession();
    toast.success("New conversation started");
  };

  const handleSignOut = async () => {
    try {
      await stackClientApp.signOut();
      toast.success("Signed out successfully");
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/logo.png" 
            alt="Scriptor Umbra Logo" 
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 animate-pulse"
          />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Loading Scriptor Umbra
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Initializing your ghostwriting assistant...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <img 
            src="/logo.png" 
            alt="Scriptor Umbra Logo" 
            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
            Scriptor Umbra
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your intelligent ghostwriting assistant for articles, books, copywriting, and long-form content creation.
          </p>
          <p className="text-slate-500 dark:text-slate-500 mb-8">
            Please sign in to access your writing workspace.
          </p>
          <Button 
            onClick={() => window.location.href = '/sign-in'}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  // Show setup instructions if no API key is configured or user explicitly requests it
  if (!hasApiKey || showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
        {hasApiKey && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              variant="outline"
              onClick={() => setShowSetup(false)}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
            >
              Back to Chat
            </Button>
          </div>
        )}
        <SetupInstructions />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Header */}
      <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Scriptor Umbra Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl object-cover"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Scriptor Umbra
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Ghostwriting Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {!hasApiKey && (
              <Badge variant="destructive" className="mr-1 sm:mr-2 hidden sm:flex">
                <AlertCircle className="w-3 h-3 mr-1" />
                Setup Required
              </Badge>
            )}
            <div className="flex items-center gap-2 mr-1 sm:mr-2 hidden sm:flex">
              <Avatar className="w-8 h-8">
                <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-600 dark:text-slate-400 hidden md:inline">
                {user?.displayName || user?.primaryEmail || 'User'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 dark:text-slate-400 hidden lg:flex"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-slate-600 dark:text-slate-400"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 dark:text-slate-400"
                >
                  <Settings className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowSetup(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 mr-2" />
                  ) : (
                    <Moon className="w-4 h-4 mr-2" />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <div className="max-w-4xl mx-auto p-3 sm:p-4 h-[calc(100vh-70px)] sm:h-[calc(100vh-80px)] flex flex-col">
        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-2 sm:pr-4">
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 sm:gap-4 group",
                  message.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <Avatar className="w-8 h-8 border-2 border-white dark:border-slate-800 shadow-sm">
                  <AvatarImage
                    src={
                      message.role === "user" ? undefined : "/logo.png"
                    }
                  />
                  <AvatarFallback
                    className={cn(
                      "text-xs font-medium",
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                        : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white",
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Feather className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    message.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {message.role === "user" ? "You" : "Umbra"}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <Card
                    className={cn(
                      "border-0 shadow-sm",
                      message.role === "user"
                        ? "bg-gradient-to-br from-sky-600 to-blue-700 text-white"
                        : "bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50",
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                          className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto",
                            message.role === "user"
                              ? "text-white/70 hover:text-white hover:bg-white/10"
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                          )}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-4 mt-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading || chatLoading}
                className="pr-12 py-6 text-base border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:bg-white dark:focus:bg-slate-900 transition-all duration-200"
              />
              <Badge
                variant="secondary"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              >
                ⌘ + Enter
              </Badge>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || chatLoading}
              size="lg"
              className="px-6 py-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading || chatLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{messages.length} messages</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  hasApiKey ? "bg-green-500 animate-pulse" : "bg-red-500",
                )}
              />
              <span>
                {hasApiKey ? "Connected to OpenAI" : "OpenAI not configured"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
