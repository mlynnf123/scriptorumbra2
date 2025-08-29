import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Feather } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { StackAuthNative } from "@/utils/stack-auth-native";
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
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useChatHistory } from "@/contexts/ChatHistoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { AvatarDropdown, AvatarDropdownItem, AvatarDropdownSeparator } from "@/components/ui/avatar-dropdown";
import { useTheme } from "next-themes";
import { stackClientApp } from "@/stack";
import { LogOut, Settings, Sun, Moon, Plus, Mic, Globe, X } from "lucide-react";

const Homepage = () => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const {
    createSessionWithMessage,
    isAuthenticated,
    user,
    authLoading,
  } = useChatHistory();


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
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => prev + (prev ? " " : "") + transcript);
        console.log("Voice input:", transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognition.start();
    } else {
      console.log("Speech recognition not supported in this browser");
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
      
      console.log("Web search context added to message. In production, this would fetch real search results from APIs.");
      
    } catch (error) {
      console.error("Web search error:", error);
    }
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    console.log('handleSubmit called with inputValue:', inputValue);
    
    if (!inputValue.trim() || isLoading) {
      console.log('Submit cancelled - no input or already loading');
      return;
    }

    const messageContent = inputValue.trim();
    
    // Add file information to message if files are attached
    let finalMessage = messageContent;
    if (attachedFiles.length > 0) {
      const fileInfo = attachedFiles.map(f => `[File: ${f.name}]`).join(' ');
      finalMessage = `${messageContent}\n\n${fileInfo}\n\nNote: File upload processing will be implemented in the chat interface.`;
    }
    
    setIsLoading(true);
    console.log('Starting conversation with message:', finalMessage);

    try {
      // Create a new session and send the message in one go
      const sessionId = await createSessionWithMessage(finalMessage, "New Conversation");
      console.log('Created session with message:', sessionId);
      
      // Clear input and files after successful submission
      setInputValue("");
      setAttachedFiles([]);
      
      // Small delay to ensure session and messages are fully processed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Navigate to chat page with the session ID
      navigate(`/chat/${sessionId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      setIsLoading(false);
      
      let errorMessage = "Failed to start conversation. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("Authentication required")) {
          errorMessage = "Please sign in to continue.";
          navigate("/sign-in");
          return;
        } else if (error.message.includes("API key")) {
          errorMessage = "OpenAI API key not configured. Please check your environment variables.";
        }
      }
      
      console.error(errorMessage);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    
    // Auto-submit after setting the value
    if (isLoading) return;
    
    setIsLoading(true);

    try {
      // Create a new session and send the suggestion in one go
      const sessionId = await createSessionWithMessage(suggestion, "New Conversation");
      
      // Clear input and files after successful submission
      setInputValue("");
      setAttachedFiles([]);
      
      // Small delay to ensure session and messages are fully processed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Navigate to chat page with the session ID
      navigate(`/chat/${sessionId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      setIsLoading(false);
      
      let errorMessage = "Failed to start conversation. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("Authentication required")) {
          errorMessage = "Please sign in to continue.";
          navigate("/sign-in");
          return;
        } else if (error.message.includes("API key")) {
          errorMessage = "OpenAI API key not configured. Please check your environment variables.";
        }
      }
      
      console.error(errorMessage);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-light">Welcome to Scriptor Umbra</h1>
              <p className="text-muted-foreground">
                Please sign in to start using our AI writing assistant.
              </p>
              <Button
                onClick={() => navigate("/sign-in")}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Scriptor Umbra Logo" 
                className="w-8 h-8 rounded-2xl object-cover"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-light bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Scriptor Umbra
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ghostwriting Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {Capacitor.isNativePlatform() ? (
              <div 
                className="flex gap-3 items-center"
                style={{
                  position: 'fixed',
                  right: '16px',
                  top: '16px',
                  zIndex: 9999,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  padding: '8px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {/* Theme Toggle */}
                <div
                  onTouchStart={(e) => {
                    e.preventDefault();
                    console.log('Theme touch start');
                    setTheme(theme === "dark" ? "light" : "dark");
                  }}
                  className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full cursor-pointer"
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    minHeight: '44px',
                    minWidth: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" style={{ pointerEvents: 'none' }} />
                  ) : (
                    <Moon className="h-5 w-5" style={{ pointerEvents: 'none' }} />
                  )}
                </div>

                {/* API Test Button */}
                <div
                  onTouchStart={async (e) => {
                    e.preventDefault();
                    console.log('API test touch start');
                    try {
                      const response = await fetch('https://scriptorumbra2.vercel.app/api/test-simple', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ test: 'Touch test from iOS' })
                      });
                      const data = await response.json();
                      console.log('API response:', data);
                      alert(`API Success: ${data.message}`);
                    } catch (error) {
                      console.error('API error:', error);
                      alert(`API Failed: ${error.message}`);
                    }
                  }}
                  className="px-3 py-2 bg-blue-500 text-white rounded-full cursor-pointer text-sm font-medium"
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    minHeight: '44px',
                    minWidth: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  API
                </div>

                {/* Clear Auth Button */}
                <div
                  onTouchStart={(e) => {
                    e.preventDefault();
                    console.log('Clear auth touch start');
                    StackAuthNative.forceSignOut();
                    window.location.reload();
                  }}
                  className="px-3 py-2 bg-orange-500 text-white rounded-full cursor-pointer text-sm font-medium"
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    minHeight: '44px',
                    minWidth: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Clear
                </div>

                {/* Logout Button */}
                <div
                  onTouchStart={async (e) => {
                    e.preventDefault();
                    console.log('Logout touch start');
                    await StackAuthNative.signOut();
                    if (refreshAuthState) {
                      await refreshAuthState();
                    }
                    navigate('/sign-in');
                  }}
                  className="px-3 py-2 bg-red-500 text-white rounded-full cursor-pointer text-sm font-medium"
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    minHeight: '44px',
                    minWidth: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Logout
                </div>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
                <AvatarDropdown user={user}>
                  <AvatarDropdownItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </AvatarDropdownItem>
                  <AvatarDropdownSeparator />
                  <AvatarDropdownItem
                    onClick={async () => {
                      try {
                        const user = stackClientApp.getUser();
                        if (user) {
                          await user.signOut();
                          navigate("/sign-in");
                        }
                      } catch (error) {
                        console.error("Sign out error:", error);
                      }
                    }}
                    className="text-red-600 hover:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </AvatarDropdownItem>
                </AvatarDropdown>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Logo and Title */}
          <div className="space-y-4">
            <div className="relative mx-auto w-fit">
              <img 
                src="/logo.png" 
                alt="Scriptor Umbra Logo" 
                className="w-20 h-20 rounded-3xl object-cover shadow-lg"
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-2 bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Welcome back, {user?.displayName?.split(' ')[0] || 'Writer'}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                What would you like to create today?
              </p>
            </div>
          </div>

          {/* Suggested Prompts */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-light text-left">Try these prompts</h2>
            <Suggestions className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Suggestion 
                suggestion="Write a poem in the style of Sylvia Plath"
                onClick={handleSuggestionClick}
                className="text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <span className="font-light">Write a poem in the style of Sylvia Plath</span>
              </Suggestion>

              <Suggestion 
                suggestion="Summarize a scene as if Hemingway wrote it"
                onClick={handleSuggestionClick}
                className="text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <span className="font-light">Summarize a scene as if Hemingway wrote it</span>
              </Suggestion>

              <Suggestion 
                suggestion="Help me write the first few pages of my children's book"
                onClick={handleSuggestionClick}
                className="text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <span className="font-light">Help me write the first few pages of my children's book</span>
              </Suggestion>

              <Suggestion 
                suggestion="Create an image of a magical forest character"
                onClick={handleSuggestionClick}
                className="text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <span className="font-light">Create an image of a magical forest character</span>
              </Suggestion>
            </Suggestions>
          </div>

          {/* Prompt Input */}
          <div className="space-y-4">
            <PromptInput 
              onSubmit={handleSubmit} 
              className="relative"
            >
              <PromptInputTextarea
                onChange={(e) => setInputValue(e.target.value)}
                value={inputValue}
                placeholder="Start writing your next masterpiece..."
                className="min-h-[60px] text-sm font-light resize-none"
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
                  disabled={!inputValue.trim() || isLoading}
                  onClick={(e) => {
                    e.preventDefault();
                    if (inputValue.trim() && !isLoading) {
                      handleSubmit();
                    }
                  }}
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
            <p className="text-xs sm:text-sm text-muted-foreground px-2">
              Press Enter to send, or click a suggestion above
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homepage;
