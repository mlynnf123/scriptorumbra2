import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { stackClientApp } from "@/stack";
import { MobileAuthBridge } from "@/utils/mobile-auth-bridge";

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        // Check if this is a mobile redirect
        const urlParams = new URLSearchParams(window.location.search);
        const isMobile = urlParams.get('mobile') === 'true';
        const redirectUrl = urlParams.get('redirect');
        
        if (isMobile && redirectUrl) {
          try {
            // Get the authenticated user and tokens
            const user = await stackClientApp.getUser();
            if (user) {
              // Store auth data for mobile app to pick up
              const tokens = {
                accessToken: localStorage.getItem('stack-access-token') || '',
                refreshToken: localStorage.getItem('stack-refresh-token') || ''
              };
              
              const sessionId = await MobileAuthBridge.storeAuthForMobile(user, tokens);
              
              // Create enhanced redirect URL with session ID
              const enhancedRedirectUrl = `${decodeURIComponent(redirectUrl)}?session=${sessionId}`;
              
              // Wait a moment to ensure data is stored
              setTimeout(() => {
                // Try to redirect to the mobile app
                window.location.href = enhancedRedirectUrl;
                
                // Fallback: show instructions if redirect doesn't work
                setTimeout(() => {
                  const instructions = document.getElementById('mobile-instructions');
                  if (instructions) {
                    instructions.style.display = 'block';
                  }
                }, 3000);
              }, 1000);
            }
          } catch (error) {
            console.error('Error storing auth for mobile:', error);
            // Fallback to original redirect
            setTimeout(() => {
              window.location.href = decodeURIComponent(redirectUrl);
              setTimeout(() => {
                const instructions = document.getElementById('mobile-instructions');
                if (instructions) {
                  instructions.style.display = 'block';
                }
              }, 3000);
            }, 1000);
          }
        } else {
          // Regular web redirect
          const user = await stackClientApp.getUser();
          if (user) {
            navigate("/");
          } else {
            navigate("/sign-in");
          }
        }
      } catch (error) {
        console.error('Auth success handling error:', error);
        navigate("/sign-in");
      }
    };

    handleAuthSuccess();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-light bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Authentication Successful!
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            You have been successfully signed in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting you back to the app...
            </p>
            
            <div id="mobile-instructions" style={{ display: 'none' }} className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Return to Scriptor Umbra App
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Please manually return to the Scriptor Umbra app. You are now signed in and can start using the app.
              </p>
              <button 
                onClick={() => window.close()} 
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Close Browser
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}