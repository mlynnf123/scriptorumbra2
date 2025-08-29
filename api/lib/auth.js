import jwt from "jsonwebtoken";
import getPool from "./database.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  try {
    console.log("🔐 Auth: Attempting to decode token");
    
    // Try to decode the token to extract user info
    // Stack tokens are JWTs, so we can decode them to get user data
    const decoded = jwt.decode(token, { complete: true });
    console.log("🔍 Auth: Token decoded successfully:", !!decoded);
    
    if (decoded && decoded.payload) {
      // Extract user info from Stack token
      const payload = decoded.payload;
      console.log("📝 Auth: Token payload received, user ID:", payload.sub);
      
      // Create a consistent user object for the API
      req.user = {
        id: payload.sub || payload.user_id || payload.userId || payload.id,
        email: `user-${payload.sub}@stack-auth.local`, // Use a consistent format for Stack users
        name: 'Stack User', // We'll get the real name from the frontend user object if needed
      };
      
      console.log("✅ Auth: User object created for:", req.user.id);
      return next();
    }

    // Fallback to custom JWT verification
    console.log("🔐 Auth: Attempting custom JWT verification");
    const customDecoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Auth: Custom JWT verified successfully");

    // Check if this is a native app JWT (has type field)
    if (customDecoded.type === 'access' || customDecoded.type === 'refresh') {
      console.log("📱 Auth: Native app JWT detected");
      // This is a native app JWT, create user object from token data
      req.user = {
        id: customDecoded.userId,
        email: customDecoded.email,
        name: customDecoded.email.split('@')[0], // Use email prefix as name
        avatar_url: null
      };
      console.log("✅ Auth: Native user object created for:", req.user.email);
      return next();
    }

    // Otherwise, verify user still exists in database (legacy flow)
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, email, name, avatar_url FROM users WHERE id = $1",
        [customDecoded.userId],
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid token - user not found",
        });
      }

      req.user = result.rows[0];
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Auth: Authentication error:", error.message);
    console.error("❌ Auth: Full error details:", error);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid token",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};