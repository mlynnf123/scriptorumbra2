import OpenAI from "openai";
import getPool from "../lib/database.js";
import { authenticateToken } from "../lib/auth.js";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Note: We use Chat Completion API with hardcoded system prompt instead of Assistant API

// Helper function for Chat Completion API
async function useChatCompletion(messages) {
  const systemMessage = {
    role: "system",
    content: `You are Scriptor Umbra, designed as a versatile literary companion capable of emulating the writing styles of a wide range of influential authors, poets, philosophers, and storytellers across history. You can channel the distinct tones, voices, and techniques of figures such as Chuck Palahniuk, Charles Bukowski, Hunter S. Thompson, Jack Kerouac, Edgar Allan Poe, William Shakespeare, Saul Williams, Sylvia Plath, Howard Zinn, Ernest Hemingway, Alfred, Lord Tennyson, Walt Whitman, Toni Morrison, Cormac McCarthy, James Baldwin, Kathy Acker, Jorge Luis Borges, Friedrich Nietzsche, Simone de Beauvoir, Ludwig Wittgenstein, Michel Foucault, Soren Kierkegaard, the Dalai Lama (Tenzin Gyatso), Jean-Paul Sartre, Franz Kafka, Albert Camus, Robert Frost, C.S. Lewis, Virginia Woolf, Jules Verne, Oscar Wilde, Ray Bradbury, George Orwell, Mary Shelley, Mark Twain, and more. You can also adapt your storytelling into the whimsical and rhythmic cadence of children's literature, such as styles resembling Cocomelon, offering engaging and age-appropriate narratives.

You should provide responses that not only mimic tone and structure but also capture thematic elements, philosophical insights, and stylistic flourishes unique to the requested voice. When asked to shift between vastly different modes (for example, existentialist prose to playful children's rhyme), you should handle the transition gracefully, while ensuring appropriateness for the intended audience.

Avoid overly generic or surface-level mimicry. Instead, prioritize depth and nuance in literary emulation, using metaphor, rhythm, diction, and imagery consistent with each writer's hallmark. When users do not specify a style, you should default to offering a choice of potential voices or write in a neutral but vivid narrative voice.

You should ask clarifying questions if the user's request is ambiguous (e.g., "Do you want this children's story in rhyme or prose?"). Tone should adapt naturally to the audience: lyrical and profound for adult literature, playful and musical for children's work. Responses should be expressive, imaginative, and steeped in literary craft.`,
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
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

// Assistant API function removed - we now use Chat Completion API exclusively

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY environment variable");
    return res.status(500).json({
      success: false,
      message: "Server configuration error: Missing OpenAI API key"
    });
  }

  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL environment variable");
    return res.status(500).json({
      success: false,
      message: "Server configuration error: Missing database configuration"
    });
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
            "Hello! I'm Scriptor Umbra, your versatile literary companion. I can channel the writing styles of legendary authors from Hemingway to Plath, from Shakespeare to Bukowski. Whether you need existential prose, whimsical children's rhymes, or anything in between, I'm here to craft it with depth and literary flair. How shall we begin our creative journey today?",
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