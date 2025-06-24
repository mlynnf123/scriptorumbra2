import express from "express";
import OpenAI from "openai";
import pool from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Get all chat sessions for the authenticated user
router.get("/sessions", authenticateToken, async (req, res) => {
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
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve chat sessions",
    });
  } finally {
    client.release();
  }
});

// Get specific chat session with messages
router.get("/sessions/:sessionId", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { sessionId } = req.params;

    // Verify session belongs to user
    const sessionResult = await client.query(
      "SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = $1 AND user_id = $2",
      [sessionId, req.user.id],
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Get messages for the session
    const messagesResult = await client.query(
      `SELECT id, role, content, created_at 
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [sessionId],
    );

    const session = {
      ...sessionResult.rows[0],
      messages: messagesResult.rows,
    };

    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve chat session",
    });
  } finally {
    client.release();
  }
});

// Create new chat session
router.post("/sessions", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { title = "New Conversation" } = req.body;

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
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create chat session",
    });
  } finally {
    client.release();
  }
});

// Send message to chat session
router.post(
  "/sessions/:sessionId/messages",
  authenticateToken,
  validate("chatMessage"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { sessionId } = req.params;
      const { content } = req.validatedData;

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
      let assistantResponse;
      try {
        if (ASSISTANT_ID) {
          // Use Assistant API
          assistantResponse = await useAssistantAPI(messages);
        } else {
          // Use Chat Completion API
          assistantResponse = await useChatCompletion(messages);
        }
      } catch (aiError) {
        console.error("OpenAI API error:", aiError);
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
  },
);

// Update session title
router.patch(
  "/sessions/:sessionId",
  authenticateToken,
  validate("updateSession"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { sessionId } = req.params;
      const { title } = req.validatedData;

      const result = await client.query(
        `UPDATE chat_sessions 
       SET title = $1, updated_at = NOW() 
       WHERE id = $2 AND user_id = $3 
       RETURNING id, title, updated_at`,
        [title, sessionId, req.user.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
      }

      res.json({
        success: true,
        message: "Session title updated successfully",
        data: { session: result.rows[0] },
      });
    } catch (error) {
      console.error("Update session error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update session title",
      });
    } finally {
      client.release();
    }
  },
);

// Delete chat session
router.delete("/sessions/:sessionId", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { sessionId } = req.params;

    const result = await client.query(
      "DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2",
      [sessionId, req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    res.json({
      success: true,
      message: "Chat session deleted successfully",
    });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete chat session",
    });
  } finally {
    client.release();
  }
});

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

export default router;
