export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const envStatus = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      STACK_SECRET_SERVER_KEY: !!process.env.STACK_SECRET_SERVER_KEY,
      NODE_ENV: process.env.NODE_ENV,
      NOTE: "Using Chat Completion API instead of Assistant API"
    };

    res.json({
      success: true,
      message: "Debug endpoint working",
      environmentVariables: envStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Debug endpoint error",
      error: error.message
    });
  }
}