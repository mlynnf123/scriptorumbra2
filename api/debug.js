export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Original debug functionality
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
    return;
  }

  if (req.method === 'POST') {
    // Native authentication functionality
    const { email, password, action = 'signin' } = req.body;

    console.log('🔐 Native auth request via debug:', { email: email ? 'provided' : 'missing', password: password ? 'provided' : 'missing', action });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Basic password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    try {
      // For now, create a simple JWT token using the user's email
      const jwt = await import('jsonwebtoken');
      const crypto = await import('crypto');
      
      // Create a simple user object
      const user = {
        id: crypto.default.createHash('sha256').update(email).digest('hex').substring(0, 16),
        email: email,
        displayName: email.split('@')[0],
        profileImageUrl: null
      };

      // Create access token (valid for 1 hour)
      const accessToken = jwt.default.sign(
        { 
          userId: user.id,
          email: user.email,
          type: 'access'
        }, 
        process.env.JWT_SECRET || 'temp-secret-key', 
        { expiresIn: '1h' }
      );

      // Create refresh token (valid for 30 days)
      const refreshToken = jwt.default.sign(
        { 
          userId: user.id,
          email: user.email,
          type: 'refresh'
        }, 
        process.env.JWT_SECRET || 'temp-secret-key', 
        { expiresIn: '30d' }
      );

      console.log(`✅ Native auth successful for: ${email}`);

      return res.json({
        success: true,
        message: action === 'signup' ? 'Account created successfully' : 'Sign in successful',
        data: {
          user,
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error("❌ Native auth error:", error);
      return res.status(500).json({
        success: false,
        message: "Authentication failed",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    message: "Method not allowed." 
  });
}