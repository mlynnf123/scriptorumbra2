const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Gemini Pro Vision for multimodal capabilities
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Note: For actual image generation, Google offers Imagen API separately
// Gemini models are primarily for text and multimodal understanding, not image generation
// We'll use Gemini to create detailed prompts that could be used with image generation services

export async function generateWithGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // Extract the generated text from the response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error("No response generated from Gemini");
    }

    return generatedText;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

// Note: Gemini 2.0 Flash doesn't directly generate images.
// For image generation, we would typically need to:
// 1. Use a different model like Imagen or Parti
// 2. Or integrate with a service like Google's Imagen API when available
// 3. Or use Gemini to generate detailed image descriptions and pass to another image generation service

// For now, let's create a function that detects image generation requests
// and returns a placeholder or description
export function detectImageGenerationRequest(prompt) {
  const imageKeywords = [
    "generate an image",
    "create an image",
    "draw",
    "illustrate",
    "picture of",
    "image of",
    "generate a picture",
    "create a picture",
    "visual representation",
    "make an image",
    "character design",
    "children's book character",
    "animated character",
    "cartoon character",
    "create a character",
    "design a character",
    "show me a character",
    "visualize",
    "what would", // as in "what would this character look like"
    "looks like",
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  return imageKeywords.some(keyword => lowerPrompt.includes(keyword));
}

// Function to extract image generation details from prompt
export function extractImageDetails(prompt) {
  // Remove common image generation phrases to get the subject
  const cleanedPrompt = prompt
    .replace(/generate an? (image|picture) of/gi, "")
    .replace(/create an? (image|picture) of/gi, "")
    .replace(/draw/gi, "")
    .replace(/illustrate/gi, "")
    .replace(/make an? (image|picture) of/gi, "")
    .trim();
    
  return cleanedPrompt;
}