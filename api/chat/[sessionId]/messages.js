import OpenAI from "openai";
import getPool from "../../lib/database.js";
import { authenticateToken } from "../../lib/auth.js";

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    console.log("🤖 Generating AI response with assistant ID:", ASSISTANT_ID);
    console.log("📝 Message history length:", messages.length);
    
    let assistantResponse;
    try {
      if (ASSISTANT_ID) {
        console.log("🎯 Using Assistant API");
        assistantResponse = await useAssistantAPI(messages);
      } else {
        console.log("💬 Using Chat Completion API");
        assistantResponse = await useChatCompletion(messages);
      }
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