import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MessageSquare,
  MoreVertical,
  Edit2,
  Trash2,
  LogOut,
  Settings,
  History,
  Crown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatHistory } from "@/contexts/ChatHistoryContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, signOut } = useAuth();
  const {
    sessions,
    currentSessionId,
    createNewSession,
    switchToSession,
    deleteSession,
    clearAllSessions,
  } = useChatHistory();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  const handleNewChat = () => {
    createNewSession();
    toast.success("New conversation started");
    onClose();
  };

  const handleSessionClick = (sessionId: string) => {
    switchToSession(sessionId);
    onClose();
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSession = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete);
      toast.success("Conversation deleted");
      setSessionToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleClearAll = () => {
    setClearAllDialogOpen(true);
  };

  const confirmClearAll = () => {
    clearAllSessions();
    toast.success("All conversations cleared");
    setClearAllDialogOpen(false);
    onClose();
  };

  const handleSignOut = () => {
    signOut();
    toast.success("Signed out successfully");
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getSessionPreview = (session: any) => {
    const userMessages = session.messages.filter(
      (msg: any) => msg.role === "user",
    );
    if (userMessages.length > 0) {
      return (
        userMessages[0].content.slice(0, 60) +
        (userMessages[0].content.length > 60 ? "..." : "")
      );
    }
    return "New conversation";
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {user?.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              onClick={handleNewChat}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Chat History
                </h3>
                {sessions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {sessions.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-240px)]">
                  <div className="space-y-2">
                    {sessions
                      .sort(
                        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
                      )
                      .map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            "group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            currentSessionId === session.id
                              ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
                              : "bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700",
                          )}
                          onClick={() => handleSessionClick(session.id)}
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                                {session.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {getSessionPreview(session)}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-slate-400">
                                  {formatDate(session.updatedAt)}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {
                                    session.messages.filter(
                                      (msg) => msg.role === "user",
                                    ).length
                                  }{" "}
                                  msgs
                                </Badge>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSession(session.id);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No conversations yet
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Start a new chat to begin
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Session Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Dialog */}
      <AlertDialog
        open={clearAllDialogOpen}
        onOpenChange={setClearAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Conversations</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all conversations? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatHistorySidebar;
