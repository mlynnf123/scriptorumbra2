import OpenAI from "openai";
import getPool from "../lib/database.js";
import { authenticateToken } from "../lib/auth.js";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Helper function for Chat Completion API
async function useChatCompletion(messages) {
  const systemMessage = {
    role: "system",
    content: `You are Scriptor Umbra, an intelligent ghostwriting assistant specialized in articles, books, copywriting, and long-form content creation. 
              You excel at crafting compelling narratives, persuasive copy, and engaging articles across various industries and formats.
              Maintain a professional yet creative tone. Provide detailed, actionable guidance for content creation.`,
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [systemMessage, ...messages],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error("No response from OpenAI");
  }

  return response;
}

// Helper function for Assistant API
async function useAssistantAPI(messages) {
  // Create thread
  const thread = await openai.beta.threads.create();

  // Add the latest user message
  const lastUserMessage = messages.filter((m) => m.role === "user").pop();
  if (!lastUserMessage) {
    throw new Error("No user message found");
  }

  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: lastUserMessage.content,
  });

  // Run assistant
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: ASSISTANT_ID,
  });

  // Wait for completion
  let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  let attempts = 0;
  const maxAttempts = 60;

  while (
    (runStatus.status === "queued" || runStatus.status === "in_progress") &&
    attempts < maxAttempts
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    attempts++;
  }

  if (runStatus.status !== "completed") {
    throw new Error(`Assistant run failed with status: ${runStatus.status}`);
  }

  // Get response
  const messagesResponse = await openai.beta.threads.messages.list(thread.id);
  const assistantMessage = messagesResponse.data
    .filter((message) => message.role === "assistant")
    .sort((a, b) => b.created_at - a.created_at)[0];

  if (!assistantMessage || !assistantMessage.content[0]) {
    throw new Error("No response from assistant");
  }

  const content = assistantMessage.content[0];
  if (content.type === "text") {
    return content.text.value;
  } else {
    throw new Error("Unexpected response type from assistant");
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication middleware
  try {
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    // If auth middleware hasn't sent a response yet, send one
    if (!res.headersSent) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
        error: error.message
      });
    }
    return;
  }

  const pool = getPool();

  try {
    if (req.method === 'GET') {
      // Get all chat sessions for the authenticated user
      console.log("📋 Getting sessions for user:", req.user.id);
      
      const client = await pool.connect();

      try {
        const result = await client.query(
          `SELECT 
            s.id,
            s.title,
            s.created_at,
            s.updated_at,
            COUNT(m.id)::INTEGER as message_count,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', m.id,
                  'role', m.role,
                  'content', m.content,
                  'created_at', m.created_at
                ) ORDER BY m.created_at ASC
              ) FILTER (WHERE m.id IS NOT NULL),
              '[]'::json
            ) as messages
           FROM chat_sessions s
           LEFT JOIN chat_messages m ON s.id = m.session_id
           WHERE s.user_id = $1
           GROUP BY s.id, s.title, s.created_at, s.updated_at
           ORDER BY s.updated_at DESC`,
          [req.user.id],
        );

        const sessions = result.rows.map((session) => ({
          ...session,
          messages: session.messages || [],
        }));

        res.json({
          success: true,
          data: { sessions },
        });
      } finally {
        client.release();
      }
    } else if (req.method === 'POST') {
      // Create new chat session
      const client = await pool.connect();

      try {
        const { title = "New Conversation" } = req.body;

        // Get real user info from request body if provided, otherwise use defaults
        const realEmail = req.body.userEmail || req.user.email;
        const realName = req.body.userName || req.user.name;

        // First, ensure the user exists in our database (upsert)
        await client.query(
          `INSERT INTO users (id, email, name) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (id) DO UPDATE SET 
             email = EXCLUDED.email,
             name = EXCLUDED.name,
             updated_at = NOW()`,
          [req.user.id, realEmail, realName],
        );

        const result = await client.query(
          `INSERT INTO chat_sessions (user_id, title) 
           VALUES ($1, $2) 
           RETURNING id, title, created_at, updated_at`,
          [req.user.id, title],
        );

        const session = result.rows[0];

        // Add welcome message
        await client.query(
          `INSERT INTO chat_messages (session_id, role, content) 
           VALUES ($1, $2, $3)`,
          [
            session.id,
            "assistant",
            "Hello! I'm Scriptor Umbra, your intelligent ghostwriting assistant. I specialize in articles, books, copywriting, and long-form content creation. How can I help you craft exceptional content today?",
          ],
        );

        res.status(201).json({
          success: true,
          message: "Chat session created successfully",
          data: { session },
        });
      } finally {
        client.release();
      }
    } else if (req.method === 'DELETE') {
      // Delete all chat sessions for the authenticated user
      const client = await pool.connect();

      try {
        await client.query("DELETE FROM chat_sessions WHERE user_id = $1", [
          req.user.id,
        ]);

        res.json({
          success: true,
          message: "All chat sessions deleted successfully",
        });
      } finally {
        client.release();
      }
    } else {
      res.status(405).json({ success: false, message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Sessions API error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}