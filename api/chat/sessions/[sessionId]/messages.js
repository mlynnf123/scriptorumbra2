import OpenAI from "openai";
import getPool from "../../lib/database.js";
import { authenticateToken } from "../../lib/auth.js";

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
  console.log(`📨 Messages endpoint called - Method: ${req.method}, SessionID: ${req.query.sessionId}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (error) {
    return; // Response already sent by auth middleware
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { sessionId } = req.query;
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Message content is required",
    });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    // Verify session belongs to user
    const sessionResult = await client.query(
      "SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2",
      [sessionId, req.user.id],
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Store user message
    const userMessageResult = await client.query(
      `INSERT INTO chat_messages (session_id, role, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, role, content, created_at`,
      [sessionId, "user", content],
    );

    const userMessage = userMessageResult.rows[0];

    // Get conversation history for context
    const historyResult = await client.query(
      `SELECT role, content 
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [sessionId],
    );

    const messages = historyResult.rows;

    // Generate AI response
    console.log("🤖 Generating AI response using Chat Completion API");
    console.log("📝 Message history length:", messages.length);
    
    let assistantResponse;
    try {
      console.log("💬 Using Chat Completion API with hardcoded system prompt");
      assistantResponse = await useChatCompletion(messages);
      console.log("✅ AI response generated successfully");
    } catch (aiError) {
      console.error("❌ OpenAI API error:", aiError);
      console.error("Error details:", aiError.message);
      assistantResponse =
        "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.";
    }

    // Store assistant response
    const assistantMessageResult = await client.query(
      `INSERT INTO chat_messages (session_id, role, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, role, content, created_at`,
      [sessionId, "assistant", assistantResponse],
    );

    const assistantMessage = assistantMessageResult.rows[0];

    // Update session timestamp
    await client.query(
      "UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1",
      [sessionId],
    );

    res.json({
      success: true,
      message: "Message sent successfully",
      data: {
        userMessage,
        assistantMessage,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  } finally {
    client.release();
  }
}