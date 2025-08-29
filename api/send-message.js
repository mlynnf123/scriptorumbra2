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

  const { sessionId, content, images } = req.body;

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
      // Check if user uploaded images for analysis
      if (images && images.length > 0) {
        console.log(`🖼️  Image analysis request detected with ${images.length} image(s)`);
        
        try {
          // Prepare messages for OpenAI Vision API
          const visionMessages = [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: content || "Please analyze this image."
                },
                ...images.map(image => ({
                  type: "image_url",
                  image_url: {
                    url: `data:${image.mediaType};base64,${image.base64}`
                  }
                }))
              ]
            }
          ];

          // Use GPT-4 Vision to analyze the images
          const visionCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: visionMessages,
            max_tokens: 1000,
            temperature: 0.7
          });

          assistantResponse = visionCompletion.choices[0]?.message?.content || "I was unable to analyze the image.";

          // Add metadata to indicate this was an image analysis
          responseMetadata = {
            isImageAnalysis: true,
            analyzedImages: images.length,
            imageNames: images.map(img => img.name)
          };
          
        } catch (visionError) {
          console.error("❌ Image analysis error:", visionError);
          assistantResponse = `I apologize, but I'm having trouble analyzing the uploaded image(s). Please try again or describe what you'd like me to help you with regarding the image.`;
          
          responseMetadata = {
            isImageAnalysis: true,
            error: visionError.message
          };
        }
      }
      // Check if this is an image generation request
      else if (detectImageGenerationRequest(content)) {
        console.log("🎨 Image generation request detected");
        
        // Extract the image details from the prompt
        const imageSubject = extractImageDetails(content);
        
        try {
          // Call the actual DALL-E image generation API
          const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : (req.headers.origin || 'http://localhost:3000');
          
          const imageRequest = await fetch(`${baseUrl}/api/generate-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.authorization,
            },
            body: JSON.stringify({
              prompt: imageSubject,
              size: "1024x1024",
              quality: "standard"
            })
          });

          const imageResult = await imageRequest.json();
          
          if (imageResult.success && imageResult.data.imageData) {
            // Image was generated successfully
            assistantResponse = `🎨 I've generated an image based on your request: "${imageSubject}"\n\n**Enhanced prompt:** ${imageResult.data.enhancedPrompt}\n\n**Description:** ${imageResult.data.description}`;
            
            responseMetadata = {
              isImageRequest: true,
              imageData: imageResult.data.imageData,
              imageDetails: {
                originalPrompt: imageSubject,
                enhancedPrompt: imageResult.data.enhancedPrompt,
                revisedPrompt: imageResult.data.revisedPrompt,
                description: imageResult.data.description
              }
            };
          } else {
            // Fallback to description only
            assistantResponse = `🎨 I created a detailed description for your image request: "${imageSubject}"\n\n**Enhanced prompt:** ${imageResult.data?.enhancedPrompt || imageSubject}\n\n**Description:** ${imageResult.data?.description || 'A detailed artistic description could not be generated at this time.'}`;
            
            responseMetadata = {
              isImageRequest: true,
              imageData: null,
              imageDetails: {
                originalPrompt: imageSubject,
                enhancedPrompt: imageResult.data?.enhancedPrompt,
                description: imageResult.data?.description
              }
            };
          }
          
        } catch (imageError) {
          console.error("❌ Image generation error:", imageError);
          // Fallback to text description
          assistantResponse = `I understand you'd like me to generate an image of "${imageSubject}". I'm experiencing technical difficulties with image generation right now. Would you like me to provide a detailed description instead?`;
          
          responseMetadata = {
            isImageRequest: true,
            imageData: null,
            error: imageError.message
          };
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

    // Store assistant response with metadata
    const assistantMessageResult = await client.query(
      `INSERT INTO chat_messages (session_id, role, content, metadata) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, role, content, metadata, created_at`,
      [sessionId, "assistant", assistantResponse, JSON.stringify(responseMetadata)],
    );

    const assistantMessage = assistantMessageResult.rows[0];
    
    // Parse metadata back to object for response and extract imageData
    if (assistantMessage.metadata) {
      assistantMessage.metadata = JSON.parse(assistantMessage.metadata);
      // Extract imageData to message level for frontend compatibility
      assistantMessage.imageData = assistantMessage.metadata.imageData || null;
    }

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