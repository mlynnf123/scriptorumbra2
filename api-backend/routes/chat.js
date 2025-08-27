import express from "express";
import OpenAI from "openai";
import pool from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { 
  ENHANCED_SYSTEM_PROMPT, 
  getOptimalSettings, 
  optimizeResponse 
} from "../../api/lib/ai-optimizer.js";
import { generateWithGemini, detectImageGenerationRequest, extractImageDetails } from "../../api/lib/gemini.js";
import fetch from "node-fetch";

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Get all chat sessions for the authenticated user
router.get("/sessions", authenticateToken, async (req, res) => {
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
  } catch (error) {
    console.error("❌ Get sessions error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve chat sessions",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
      `SELECT id, role, content, created_at, metadata 
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [sessionId],
    );

    const session = {
      ...sessionResult.rows[0],
      messages: messagesResult.rows.map(msg => ({
        ...msg,
        imageData: msg.metadata?.imageData || null
      })),
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
  } catch (error) {
    console.error("❌ Create session error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to create chat session",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
        `SELECT role, content, metadata 
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
        [sessionId],
      );

      const messages = historyResult.rows;

      // Check if this is an image generation request
      if (detectImageGenerationRequest(content)) {
        console.log("🎨 Image generation request detected");
        
        try {
          const imageSubject = extractImageDetails(content);
          
          // Call the image generation API
          const imageResponse = await fetch(`${req.protocol}://${req.get('host')}/api/generate-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.authorization
            },
            body: JSON.stringify({
              prompt: imageSubject,
              size: "1024x1024",
              style: "children",
              quality: "standard"
            })
          });
          
          const imageResult = await imageResponse.json();
          
          if (imageResult.success && imageResult.data.type === 'generated') {
            // Image was successfully generated
            assistantResponse = `🎨 **Image Generated Successfully!**\n\n**Your prompt:** "${imageSubject}"\n\n**Enhanced prompt:** "${imageResult.data.enhancedPrompt}"\n\n[Image will be displayed below]\n\n**Description:**\n${imageResult.data.description}`;
            
            // Store the assistant response with image data
            const assistantMessageResult = await client.query(
              `INSERT INTO chat_messages (session_id, role, content, metadata) 
               VALUES ($1, $2, $3, $4) 
               RETURNING id, role, content, created_at, metadata`,
              [
                sessionId, 
                "assistant", 
                assistantResponse,
                JSON.stringify({
                  hasImage: true,
                  imageData: imageResult.data.imageData
                })
              ],
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
                assistantMessage: {
                  ...assistantMessage,
                  imageData: imageResult.data.imageData
                }
              },
            });
            
            return; // Early return for image generation
          } else {
            // Fall back to description-only mode
            assistantResponse = `🎨 **Image Generation Request**\n\n**Your prompt:** "${imageSubject}"\n\n**Enhanced prompt:** "${imageResult.data.enhancedPrompt}"\n\n**Visualization:**\n${imageResult.data.description}\n\n---\n*Note: I've created a detailed description. The image generation service is currently unavailable.*`;
          }
        } catch (imageError) {
          console.error("❌ Image generation error:", imageError);
          // Continue with normal text response
        }
      }

      // Generate AI response for non-image requests or if image generation failed
      console.log("🤖 Generating AI response with assistant ID:", ASSISTANT_ID);
      console.log("📝 Message history length:", messages.length);
      
      let assistantResponse;
      if (!assistantResponse) { // Only generate if not already set by image generation
        try {
          if (ASSISTANT_ID) {
            console.log("🎯 Using Assistant API");
            assistantResponse = await useAssistantAPI(messages);
          } else {
            console.log("💬 Using Chat Completion API");
            assistantResponse = await useChatCompletion(messages, content);
          }
          console.log("✅ AI response generated successfully");
        } catch (aiError) {
          console.error("❌ OpenAI API error:", aiError);
          console.error("Error details:", aiError.message);
          
          // Try Gemini as fallback
          console.log("🔄 Trying Gemini API as fallback...");
          try {
            const geminiPrompt = `${ENHANCED_SYSTEM_PROMPT}\n\nUser: ${content}`;
            assistantResponse = await generateWithGemini(geminiPrompt);
            console.log("✅ Gemini fallback successful");
          } catch (geminiError) {
            console.error("❌ Gemini fallback also failed:", geminiError);
            assistantResponse =
              "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.";
          }
        }
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

// Helper function for Chat Completion API with optimization
async function useChatCompletion(messages, userPrompt = "") {
  // Get optimal settings based on the prompt and context
  const settings = getOptimalSettings(userPrompt, messages);
  
  // Use enhanced system prompt with any style-specific additions
  const systemMessage = {
    role: "system",
    content: ENHANCED_SYSTEM_PROMPT + (settings.systemPromptAddition ? `\n\n${settings.systemPromptAddition}` : "")
  };

  const completion = await openai.chat.completions.create({
    model: settings.model || "gpt-4o",
    messages: [systemMessage, ...settings.optimizedMessages],
    temperature: settings.temperature,
    max_tokens: settings.max_tokens,
    top_p: settings.top_p,
    frequency_penalty: settings.frequency_penalty,
    presence_penalty: settings.presence_penalty,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error("No response from OpenAI");
  }

  // Optimize the response based on request type
  return optimizeResponse(response, settings.requestType);
}

// Delete all chat sessions for the authenticated user
router.delete("/sessions", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("DELETE FROM chat_sessions WHERE user_id = $1", [
      req.user.id,
    ]);

    res.json({
      success: true,
      message: "All chat sessions deleted successfully",
    });
  } catch (error) {
    console.error("Clear all sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete all chat sessions",
    });
  } finally {
    client.release();
  }
});

export default router;
