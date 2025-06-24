export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
  user_id: string;
  message_count: number;
}
