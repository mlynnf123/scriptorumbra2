import { useState } from "react";
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
import {
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Key,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

export const SetupInstructions = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const hasApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;
  const hasAssistantId = !!import.meta.env.VITE_OPENAI_ASSISTANT_ID;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Welcome to Umbra
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Your AI assistant is almost ready. Complete the setup to start
          chatting.
        </p>
      </div>

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
            You need to configure your OpenAI API key to use Umbra. Follow the
            steps below to set it up.
          </AlertDescription>
        </Alert>
      )}

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
              Setup Complete! You can now chat with Umbra.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
