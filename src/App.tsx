import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ChatHistoryProvider } from "@/contexts/ChatHistoryContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
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
        <ChatHistoryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <StackProvider app={stackClientApp}>
                <StackTheme>
                  <Routes>
                    <Route path="/handler/*" element={<HandlerRoutes />} />
                    <Route
                      path="/"
                      element={<Index />}
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </StackTheme>
              </StackProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ChatHistoryProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </Suspense>
);

export default App;
