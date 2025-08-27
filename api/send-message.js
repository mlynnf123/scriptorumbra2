import OpenAI from "openai";
import getPool from "./lib/database.js";
import { authenticateToken } from "./lib/auth.js";
import { detectImageGenerationRequest, extractImageDetails } from "./lib/gemini.js";
import { generateImage } from "./lib/imagen.js";
import { 
  ENHANCED_SYSTEM_PROMPT, 
  getOptimalSettings, 
  optimizeResponse 
} from "./lib/ai-optimizer.js";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed. Use POST.",
      method: req.method,
      allowedMethods: ['POST', 'OPTIONS']
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

  const { sessionId, content } = req.body;

  if (!sessionId || !content?.trim()) {
    return res.status(400).json({
      success: false,
      message: "sessionId and content are required",
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
    console.log("🤖 Generating AI response");
    console.log("📝 Message history length:", messages.length);
    
    let assistantResponse;
    let responseMetadata = {};
    
    try {
      // Check if this is an image generation request
      if (detectImageGenerationRequest(content)) {
        console.log("🎨 Image generation request detected");
        
        // Extract the image details from the prompt
        const imageSubject = extractImageDetails(content);
        
        try {
          // Generate image using Gemini-enhanced prompts
          const imageResult = await generateImage(imageSubject);
          
          // Format the response with the enhanced description
          assistantResponse = `🎨 **Image Generation Request**\n\n**Your prompt:** "${imageSubject}"\n\n**Enhanced prompt:** "${imageResult.enhancedPrompt}"\n\n**Visualization:**\n${imageResult.description}\n\n---\n*Note: I've created a detailed description using Gemini AI. Actual image generation capabilities are in development.*`;
          
          // Add metadata to indicate this was an image request
          responseMetadata = {
            isImageRequest: true,
            imageData: imageResult,
          };
          
        } catch (imageError) {
          console.error("❌ Image generation error:", imageError);
          // Fallback to text description
          assistantResponse = `I understand you'd like me to generate an image of "${imageSubject}". While I can't create actual images yet, I can describe what it would look like in vivid detail. Would you like me to provide a detailed description instead?`;
        }
      } else {
        // Regular text generation using OpenAI
        if (ASSISTANT_ID) {
          console.log("🎯 Using Assistant API");
          // For now, fallback to chat completion since assistant API is more complex
          assistantResponse = await useChatCompletion(messages, content);
        } else {
          console.log("💬 Using Chat Completion API");
          assistantResponse = await useChatCompletion(messages, content);
        }
      }
      console.log("✅ AI response generated successfully");
    } catch (aiError) {
      console.error("❌ AI API error:", aiError);
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
      error: error.message
    });
  } finally {
    client.release();
  }
}