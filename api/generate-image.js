// Image generation API endpoint
// Production-ready implementation with DALL-E 3

import { authenticateToken } from "./lib/auth.js";
import { enhanceImagePrompt, generateImageDescription } from "./lib/imagen.js";
import OpenAI from "openai";

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
      message: "Method not allowed. Use POST." 
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
    if (!res.headersSent) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: error.message
      });
    }
    return;
  }

  const { prompt, size = "1024x1024", style = "children", quality = "standard" } = req.body;

  if (!prompt?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Prompt is required",
    });
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    console.log("🎨 Processing image generation request:", prompt);

    // Step 1: Enhance the prompt using Gemini
    const enhancedPrompt = await enhanceImagePrompt(prompt);
    console.log("✨ Enhanced prompt generated");

    // Step 2: Generate detailed description
    const description = await generateImageDescription(enhancedPrompt);
    console.log("📝 Image description generated");

    // Step 3: Generate actual image with DALL-E 3
    console.log("🖼️ Generating image with DALL-E 3...");
    
    try {
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: validateImageSize(size),
        quality: quality,
        response_format: "b64_json"
      });

      const imageData = imageResponse.data[0];
      
      const response = {
        success: true,
        message: "Image generated successfully",
        data: {
          type: "generated",
          originalPrompt: prompt,
          enhancedPrompt: enhancedPrompt,
          revisedPrompt: imageData.revised_prompt,
          description: description,
          
          imageData: {
            base64: imageData.b64_json,
            mediaType: "image/png",
            width: parseInt(size.split('x')[0]),
            height: parseInt(size.split('x')[1])
          },
          
          metadata: {
            size: size,
            style: style,
            quality: quality,
            timestamp: new Date().toISOString(),
            status: "generated",
            model: "dall-e-3"
          }
        }
      };

      console.log("✅ Image generated successfully");
      res.json(response);
      
    } catch (dalleError) {
      // If DALL-E fails, fall back to description-only mode
      console.error("⚠️ DALL-E generation failed, falling back to description:", dalleError.message);
      
      const fallbackResponse = {
        success: true,
        message: "Image description generated (image generation unavailable)",
        data: {
          type: "description",
          originalPrompt: prompt,
          enhancedPrompt: enhancedPrompt,
          description: description,
          
          imageData: null,
          
          metadata: {
            size: size,
            style: style,
            timestamp: new Date().toISOString(),
            status: "description_only",
            fallbackReason: dalleError.message
          }
        }
      };
      
      res.json(fallbackResponse);
    }

  } catch (error) {
    console.error("❌ Image generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate image",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Validate and normalize image sizes for DALL-E 3
function validateImageSize(size) {
  // DALL-E 3 supports: 1024x1024, 1024x1792, 1792x1024
  const validSizes = ["1024x1024", "1024x1792", "1792x1024"];
  
  if (validSizes.includes(size)) {
    return size;
  }
  
  // Default to square if invalid size provided
  console.warn(`⚠️ Invalid size ${size}, defaulting to 1024x1024`);
  return "1024x1024";
}