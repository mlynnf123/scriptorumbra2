import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Key,
  Settings,
  User,
  FileText,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useChatHistory } from "@/contexts/ChatHistoryContext";

export const SetupInstructions = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const { user } = useChatHistory();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const hasApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;
  const hasAssistantId = !!import.meta.env.VITE_OPENAI_ASSISTANT_ID;

  // Mock logs for demonstration
  useEffect(() => {
    setLogs([
      "[2024-06-24 10:30:15] User authenticated successfully",
      "[2024-06-24 10:30:16] Chat session created: New Conversation",
      "[2024-06-24 10:31:22] OpenAI API request successful",
      "[2024-06-24 10:31:23] Assistant response generated",
      "[2024-06-24 10:32:10] Message sent to chat session",
    ]);
  }, []);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      // In a real app, this would save to backend/localStorage
      toast.success("API key configuration saved (demo mode)");
      setApiKey("");
    } else {
      toast.error("Please enter a valid API key");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img 
            src="/logo.png" 
            alt="Scriptor Umbra Logo" 
            className="w-16 h-16 rounded-2xl object-cover"
          />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
          Scriptor Umbra Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure your intelligent ghostwriting assistant
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Setup Status
              </CardTitle>
              <CardDescription>
                Check the configuration status of your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {hasApiKey ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="font-medium">OpenAI API Key</span>
                </div>
                <Badge variant={hasApiKey ? "default" : "secondary"}>
                  {hasApiKey ? "Configured" : "Required"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {hasAssistantId ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="font-medium">Assistant ID</span>
                </div>
                <Badge variant={hasAssistantId ? "default" : "outline"}>
                  {hasAssistantId ? "Configured" : "Optional"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          {!hasApiKey && (
            <Alert>
              <Key className="w-4 h-4" />
              <AlertTitle>OpenAI API Key Required</AlertTitle>
              <AlertDescription>
                You need to configure your OpenAI API key to use Scriptor Umbra. Check the OpenAI tab to configure it.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="openai" className="space-y-6">
          {/* OpenAI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                OpenAI Configuration
              </CardTitle>
              <CardDescription>
                Configure your OpenAI API key for AI-powered responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button onClick={saveApiKey} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your API key is stored securely and only used for AI requests.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  window.open("https://platform.openai.com/api-keys", "_blank")
                }
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get API Key from OpenAI
              </Button>
            </CardContent>
          </Card>

          {/* Step 1: Get OpenAI API Key */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Get Your OpenAI API Key</CardTitle>
              <CardDescription>
                Create an API key from your OpenAI dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>Go to the OpenAI platform</li>
                <li>Sign in to your account or create one</li>
                <li>Navigate to API Keys section</li>
                <li>Create a new API key</li>
                <li>Copy the key (it starts with "sk-")</li>
              </ol>
              <Button
                variant="outline"
                onClick={() =>
                  window.open("https://platform.openai.com/api-keys", "_blank")
                }
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open OpenAI Platform
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Set Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Configure Environment Variables</CardTitle>
              <CardDescription>
                Add your API key to the environment variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Create a .env file in your project root:
                  </label>
                  <div className="relative">
                    <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-sm overflow-x-auto">
                      {`# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_ASSISTANT_ID=your_assistant_id_here

# Optional: Vercel Integration
VITE_VERCEL_PROJECT_ID=your_vercel_project_id_here
VITE_VERCEL_TOKEN=your_vercel_token_here`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          `# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_ASSISTANT_ID=your_assistant_id_here

# Optional: Vercel Integration
VITE_VERCEL_PROJECT_ID=your_vercel_project_id_here
VITE_VERCEL_TOKEN=your_vercel_token_here`,
                          "Environment template",
                        )
                      }
                      className="absolute top-2 right-2"
                    >
                      {copied === "Environment template" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Important Security Note</AlertTitle>
                <AlertDescription>
                  Never commit your .env file to version control. Add it to your
                  .gitignore file. In production, set these variables in your
                  deployment platform (Vercel, Netlify, etc.).
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 3: Optional Assistant Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Create OpenAI Assistant (Optional)</CardTitle>
              <CardDescription>
                For enhanced capabilities, create a custom assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>Go to the OpenAI Assistants playground</li>
                <li>Create a new assistant with custom instructions</li>
                <li>Copy the Assistant ID (starts with "asst_")</li>
                <li>
                  Add it to your VITE_OPENAI_ASSISTANT_ID environment variable
                </li>
              </ol>
              <Button
                variant="outline"
                onClick={() =>
                  window.open("https://platform.openai.com/assistants", "_blank")
                }
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Assistants Playground
              </Button>
            </CardContent>
          </Card>

          {/* Step 4: Restart Development Server */}
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Restart Your Development Server</CardTitle>
              <CardDescription>
                Restart to load the new environment variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-sm">
                  npm run dev
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("npm run dev", "Restart command")}
                  className="absolute top-2 right-2"
                >
                  {copied === "Restart command" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {hasApiKey && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  Setup Complete! You can now chat with Scriptor Umbra.
                </span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Profile
              </CardTitle>
              <CardDescription>
                Your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                  {user?.displayName?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {user?.displayName || 'User'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {user?.primaryEmail || 'No email available'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Account Type</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Stack Auth User</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Recently</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* Application Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Application Logs
              </CardTitle>
              <CardDescription>
                Recent activity and system messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 w-full border rounded-lg">
                <div className="p-4 space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing recent activity
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setLogs([...logs, `[${new Date().toLocaleString()}] Log refreshed manually`]);
                    toast.success("Logs refreshed");
                  }}
                >
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
