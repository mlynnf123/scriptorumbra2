import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ChatHistoryProvider } from "@/contexts/ChatHistoryContext";
import Homepage from "./pages/Homepage";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import AuthSuccess from "./pages/AuthSuccess";
import { Suspense } from "react";
import { StackHandler, StackProvider, StackTheme } from '@stackframe/react';
import { stackClientApp } from './stack';

const queryClient = new QueryClient();

function HandlerRoutes() {
  const location = useLocation();
  return (
    <StackHandler app={stackClientApp} location={location.pathname} fullPage />
  );
}

const App = () => (
  <Suspense fallback={null}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <StackProvider app={stackClientApp}>
              <StackTheme>
                <ChatHistoryProvider>
                  <Routes>
                    <Route path="/handler/*" element={<HandlerRoutes />} />
                    <Route path="/sign-in" element={<SignIn />} />
                    <Route path="/auth-success" element={<AuthSuccess />} />
                    <Route path="/" element={<Homepage />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/chat/:sessionId" element={<Chat />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ChatHistoryProvider>
              </StackTheme>
            </StackProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </Suspense>
);

export default App;
