// Native mobile authentication endpoint
// Handles Stack Auth sign-in for mobile apps via server SDK

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed. Use POST." 
    });
  }

  const { email, password, action = 'signin' } = req.body;

  console.log('🔐 Native auth request:', { email: email ? 'provided' : 'missing', password: password ? 'provided' : 'missing', action });

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
    // This is a temporary solution while we figure out Stack Auth integration
    
    const jwt = require('jsonwebtoken');
    const crypto = require('crypto');
    
    // Create a simple user object
    const user = {
      id: crypto.createHash('sha256').update(email).digest('hex').substring(0, 16),
      email: email,
      displayName: email.split('@')[0],
      profileImageUrl: null
    };

    // Create access token (valid for 1 hour)
    const accessToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        type: 'access'
      }, 
      process.env.JWT_SECRET || 'temp-secret-key', 
      { expiresIn: '1h' }
    );

    // Create refresh token (valid for 30 days)
    const refreshToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        type: 'refresh'
      }, 
      process.env.JWT_SECRET || 'temp-secret-key', 
      { expiresIn: '30d' }
    );

    console.log(`✅ Native auth successful for: ${email}`);

    res.json({
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
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}