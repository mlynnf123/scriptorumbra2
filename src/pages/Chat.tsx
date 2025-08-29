import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Capacitor } from "@capacitor/core";
import { StackAuthNative } from "@/utils/stack-auth-native";
import { AvatarDropdown, AvatarDropdownItem, AvatarDropdownSeparator } from "@/components/ui/avatar-dropdown";
import { IOSDropdownMenu, IOSDropdownMenuItem, IOSDropdownMenuSeparator } from "@/components/ui/ios-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  Copy,
  Menu,
  Plus,
  Feather,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  Mic,
  Globe,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { stackClientApp } from "@/stack";
import { useChatHistory } from "@/contexts/ChatHistoryContext";
import ChatHistorySidebar from "@/components/ChatHistorySidebar";
import { Image } from "@/components/ai-elements/image";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
} from '@/components/ai-elements/prompt-input';


const Chat = () => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const {
    sessions,
    currentSession,
    currentSessionId,
    sendMessage: sendChatMessage,
    createNewSession,
    switchToSession,
    isLoading: chatLoading,
    authLoading,
    isAuthenticated,
    user,
  } = useChatHistory();

  // Check if API key is configured
  const hasApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;

  // Handle URL session parameter and redirect logic
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate("/sign-in");
      return;
    }
    
    console.log('Chat useEffect - urlSessionId:', urlSessionId, 'currentSessionId:', currentSessionId);
    
    // If we have a session ID in URL, switch to it
    if (urlSessionId && urlSessionId !== currentSessionId) {
      console.log('Switching to session:', urlSessionId);
      switchToSession(urlSessionId);
      // Wait a bit for context to update
      setTimeout(() => {
        const session = sessions.find(s => s.id === urlSessionId);
        console.log('Found session after switch:', session);
      }, 100);
    } else if (!urlSessionId && !currentSessionId) {
      // If we're on /chat without a session ID, redirect to homepage
      navigate("/");
    }
  }, [urlSessionId, currentSessionId, authLoading, isAuthenticated, navigate, switchToSession, sessions]);

  // Get messages from current session
  const messages = currentSession?.messages || [];
  console.log('Current session messages:', messages);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
    console.log("Files attached:", files.map(f => f.name));
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceInput = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      console.log("Starting voice recognition...");
      
      recognition.onstart = () => {
        console.log("Voice recognition started. Speak now...");
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setInputValue(prev => prev + (prev ? " " : "") + finalTranscript.trim());
          console.log("Final voice input:", finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        switch (event.error) {
          case "network":
            console.log("Network error during voice recognition");
            break;
          case "not-allowed":
            console.log("Microphone permission denied");
            break;
          case "no-speech":
            console.log("No speech detected");
            break;
          default:
            console.log("Voice recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        console.log("Voice recognition ended");
      };

      try {
        recognition.start();
      } catch (error) {
        console.error("Failed to start voice recognition:", error);
      }
    } else {
      console.log("Speech recognition not supported in this browser");
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
    }
  };

  const handleWebSearch = async () => {
    if (!inputValue.trim()) {
      console.log("Enter a search query first");
      alert("Please enter a search query first");
      return;
    }

    const query = inputValue.trim();
    
    try {
      console.log("Performing web search for:", query);
      
      // For now, simulate a web search by adding context to the message
      // In production, this would integrate with a search API like SerpAPI, Google Search API, etc.
      const searchContext = `[Web Search: "${query}"]

Please search the web for information about: ${query}

Based on current web results, provide comprehensive information about this topic.`;

      setInputValue(searchContext);
      
      console.log("Web search context added to message. In production, this would fetch real search results from APIs like:");
      console.log("- Google Search API");
      console.log("- SerpAPI");
      console.log("- Bing Web Search API");
      console.log("- DuckDuckGo Instant Answer API");
      
    } catch (error) {
      console.error("Web search error:", error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    console.log('handleSendMessage called with inputValue:', inputValue);
    
    if (!inputValue.trim() || isLoading || chatLoading) {
      console.log('Send cancelled - no input or already loading');
      return;
    }

    const messageContent = inputValue;
    setInputValue("");
    setIsLoading(true);
    console.log('Sending message:', messageContent);

    try {
      // Create a session if none exists
      let sessionId = currentSessionId;
      if (!sessionId) {
        console.log("No current session, creating new one...");
        sessionId = await createNewSession("New Conversation");
      }

      await sendChatMessage(messageContent, attachedFiles);
      
      // Clear attached files after sending
      setAttachedFiles([]);
      console.log('Message sent successfully');
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

      console.error(errorMessage);
      // Restore the input value if there was an error
      setInputValue(messageContent);
    } finally {
      setIsLoading(false);
    }
  };


  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    console.log("Message copied to clipboard");
  };

  const clearChat = () => {
    navigate("/");
  };

  const handleSignOut = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await StackAuthNative.signOut();
        console.log("Native sign out successful");
        if (refreshAuthState) {
          await refreshAuthState();
        }
        navigate('/sign-in');
      } else {
        const user = await stackClientApp.getUser();
        if (user) {
          await user.signOut();
        }
        console.log("Web sign out successful");
        window.location.href = "/sign-in";
      }
    } catch (error) {
      console.error("Sign out error:", error);
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
            <div 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            >
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="Scriptor Umbra Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl object-cover"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-light bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Scriptor Umbra
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Ghostwriting Assistant
                </p>
              </div>
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
            {Capacitor.isNativePlatform() ? (
              <IOSDropdownMenu
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 dark:text-slate-400"
                  >
                    <Settings className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                }
                align="end"
                className="w-48"
              >
                <IOSDropdownMenuItem onClick={() => setShowSetup(true)}>
                  Settings
                </IOSDropdownMenuItem>
                <IOSDropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </IOSDropdownMenuItem>
                <IOSDropdownMenuSeparator />
                <IOSDropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                  Sign Out
                </IOSDropdownMenuItem>
              </IOSDropdownMenu>
            ) : (
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
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <div className="max-w-4xl mx-auto p-2 sm:p-4 h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)] flex flex-col">
        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-1 sm:pr-4">
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <div className="mb-8">
                  <img 
                    src="/logo.png" 
                    alt="Scriptor Umbra Logo" 
                    className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
                  />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    Welcome to Scriptor Umbra
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md px-4">
                    I can channel the writing styles of legendary authors and craft any form of literary content.
                  </p>
                </div>
              </div>
            )}
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
                    "flex flex-col max-w-[85%] sm:max-w-[80%]",
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
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-3">
                          {/* Text content */}
                          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                          
                          {/* Image content - if the message contains image data */}
                          {message.imageData && message.imageData.base64 && message.imageData.mediaType && (
                            <div className="mt-3">
                              <Image
                                base64={message.imageData.base64}
                                mediaType={message.imageData.mediaType}
                                uint8Array={message.imageData.uint8Array || new Uint8Array([])}
                                alt={message.imageData.alt || "Generated image"}
                                className="max-w-sm rounded-lg border shadow-md"
                              />
                            </div>
                          )}
                          
                          {/* Placeholder for future image generation */}
                          {message.content.includes('🎨 **Image Generation Request**') && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                  Image Description Generated
                                </span>
                              </div>
                              <p className="text-xs text-purple-600 dark:text-purple-400">
                                Actual image generation coming soon! For now, enjoy this detailed visualization.
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                          className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto flex-shrink-0",
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
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-3 mt-3 sm:pt-4 sm:mt-4">
          <PromptInput 
            onSubmit={handleSendMessage} 
            className="relative"
          >
            <PromptInputTextarea
              onChange={(e) => setInputValue(e.target.value)}
              value={inputValue}
              placeholder="Type your message..."
              className="min-h-[60px] text-sm font-light resize-none"
              disabled={isLoading || chatLoading}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputButton onClick={handleFileUpload}>
                  <Plus className="w-4 h-4" />
                </PromptInputButton>
                <PromptInputButton onClick={handleVoiceInput}>
                  <Mic className="w-4 h-4" />
                </PromptInputButton>
                <PromptInputButton onClick={handleWebSearch}>
                  <Globe className="w-4 h-4" />
                  Search
                </PromptInputButton>
                <PromptInputModelSelect value={selectedModel} onValueChange={setSelectedModel}>
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue placeholder="Select model" />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    <PromptInputModelSelectItem value="gpt-4">GPT-4</PromptInputModelSelectItem>
                    <PromptInputModelSelectItem value="gpt-4-turbo">GPT-4 Turbo</PromptInputModelSelectItem>
                    <PromptInputModelSelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</PromptInputModelSelectItem>
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!inputValue.trim() || isLoading || chatLoading}
                status={isLoading || chatLoading ? 'submitted' : undefined}
              />
            </PromptInputToolbar>
          </PromptInput>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />

          {/* File preview */}
          {attachedFiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

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

export default Chat;
