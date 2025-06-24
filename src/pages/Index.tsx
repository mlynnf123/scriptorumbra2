import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { SetupInstructions } from "@/components/SetupInstructions";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
  const {
    currentSession,
    currentSessionId,
    sendMessage: sendChatMessage,
    createNewSession,
    isLoading: chatLoading,
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
        if (error.message.includes("API key")) {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-600 to-purple-600 dark:from-white dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Scriptor Umbra
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ghostwriting Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasApiKey && (
              <Badge variant="destructive" className="mr-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                Setup Required
              </Badge>
            )}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-slate-600 dark:text-slate-400"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSetup(true)}
              className="text-slate-600 dark:text-slate-400"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-80px)] flex flex-col">
        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 group",
                  message.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <Avatar className="w-8 h-8 border-2 border-white dark:border-slate-800 shadow-sm">
                  <AvatarImage
                    src={
                      message.role === "user" ? undefined : "/bot-avatar.png"
                    }
                  />
                  <AvatarFallback
                    className={cn(
                      "text-xs font-medium",
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                        : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white",
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
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
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
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
                onKeyPress={handleKeyPress}
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
              className="px-6 py-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
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
