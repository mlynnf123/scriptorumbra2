import express from "express";
import OpenAI from "openai";
import { generateWithGemini } from "../../api/lib/gemini.js";
import { getOptimalSettings, ENHANCED_SYSTEM_PROMPT } from "../../api/lib/ai-optimizer.js";

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI services test endpoint
router.get("/ai", async (req, res) => {
  const results = {
    openai: null,
    gemini: null,
    optimization: null,
    timestamp: new Date().toISOString()
  };

  try {
    console.log("🧪 Starting AI services test...");

    // Test 1: OpenAI API connectivity and response
    console.log("Testing OpenAI API...");
    try {
      const openaiStart = Date.now();
      const openaiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Respond with exactly: 'OpenAI API test successful'"
          },
          {
            role: "user",
            content: "Test connection"
          }
        ],
        max_tokens: 50,
        temperature: 0.3
      });

      const openaiTime = Date.now() - openaiStart;
      const openaiContent = openaiResponse.choices[0]?.message?.content;

      results.openai = {
        status: "success",
        responseTime: `${openaiTime}ms`,
        response: openaiContent,
        model: openaiResponse.model,
        usage: openaiResponse.usage
      };

      console.log("✅ OpenAI test successful");
    } catch (openaiError) {
      console.error("❌ OpenAI test failed:", openaiError.message);
      results.openai = {
        status: "error",
        error: openaiError.message,
        code: openaiError.code || 'UNKNOWN'
      };
    }

    // Test 2: Gemini API connectivity and response
    console.log("Testing Gemini API...");
    try {
      const geminiStart = Date.now();
      const geminiResponse = await generateWithGemini("Respond with exactly: 'Gemini API test successful'");
      const geminiTime = Date.now() - geminiStart;

      results.gemini = {
        status: "success",
        responseTime: `${geminiTime}ms`,
        response: geminiResponse,
        apiKey: process.env.GEMINI_API_KEY ? "configured" : "missing"
      };

      console.log("✅ Gemini test successful");
    } catch (geminiError) {
      console.error("❌ Gemini test failed:", geminiError.message);
      results.gemini = {
        status: "error",
        error: geminiError.message,
        apiKey: process.env.GEMINI_API_KEY ? "configured" : "missing"
      };
    }

    // Test 3: AI Optimization system
    console.log("Testing AI optimization system...");
    try {
      const testPrompts = [
        "Write a poem in the style of Hemingway",
        "Create a children's story about a friendly dragon",
        "Explain how photosynthesis works",
        "Generate an image of a magical forest"
      ];

      const optimizationResults = testPrompts.map(prompt => {
        const settings = getOptimalSettings(prompt, []);
        return {
          prompt: prompt,
          detectedType: settings.requestType,
          temperature: settings.temperature,
          maxTokens: settings.max_tokens,
          hasStyleOverrides: !!settings.systemPromptAddition
        };
      });

      results.optimization = {
        status: "success",
        systemPromptLength: ENHANCED_SYSTEM_PROMPT.length,
        testCases: optimizationResults,
        availableTypes: ['creative', 'technical', 'childrens', 'dialogue']
      };

      console.log("✅ AI optimization test successful");
    } catch (optimizationError) {
      console.error("❌ AI optimization test failed:", optimizationError.message);
      results.optimization = {
        status: "error",
        error: optimizationError.message
      };
    }

    // Test 4: Environment variables check
    const envCheck = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "configured" : "missing",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "configured" : "missing",
      OPENAI_ASSISTANT_ID: process.env.OPENAI_ASSISTANT_ID ? "configured" : "not set"
    };

    console.log("🎯 AI services test completed");

    res.json({
      success: true,
      message: "AI services test completed",
      results: results,
      environment: envCheck,
      recommendations: generateRecommendations(results, envCheck)
    });

  } catch (error) {
    console.error("❌ AI services test failed:", error);
    
    res.status(500).json({
      success: false,
      message: "AI services test failed",
      error: {
        message: error.message,
        timestamp: new Date().toISOString()
      },
      partialResults: results
    });
  }
});

function generateRecommendations(results, envCheck) {
  const recommendations = [];

  if (results.openai?.status === "error") {
    recommendations.push("❌ Fix OpenAI API configuration - check API key and account status");
  }

  if (results.gemini?.status === "error") {
    recommendations.push("❌ Fix Gemini API configuration - verify API key and permissions");
  }

  if (results.openai?.status === "success" && parseInt(results.openai.responseTime) > 5000) {
    recommendations.push("⚠️ OpenAI response time is slow (>5s) - consider optimization");
  }

  if (results.gemini?.status === "success" && parseInt(results.gemini.responseTime) > 5000) {
    recommendations.push("⚠️ Gemini response time is slow (>5s) - consider optimization");
  }

  if (!envCheck.OPENAI_ASSISTANT_ID || envCheck.OPENAI_ASSISTANT_ID === "not set") {
    recommendations.push("ℹ️ Consider setting OPENAI_ASSISTANT_ID for enhanced capabilities");
  }

  if (results.openai?.status === "success" && results.gemini?.status === "success") {
    recommendations.push("✅ Both AI services are working correctly");
  }

  return recommendations;
}

export default router;