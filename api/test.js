export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Test endpoint to check if API is working
  try {
    const response = {
      success: true,
      message: "API is working",
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set',
        STACK_SECRET_SERVER_KEY: process.env.STACK_SECRET_SERVER_KEY ? 'Set' : 'Not set',
        STACK_APP_ID: process.env.STACK_APP_ID ? 'Set' : 'Not set',
        JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed',
      error: error.message
    });
  }
}