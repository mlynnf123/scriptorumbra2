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
    // Try to decode the token to extract user info
    // Stack tokens are JWTs, so we can decode them to get user data
    const decoded = jwt.decode(token, { complete: true });
    
    if (decoded && decoded.payload) {
      // Extract user info from Stack token
      const payload = decoded.payload;
      
      // Create a consistent user object for the API
      req.user = {
        id: payload.sub || payload.user_id || payload.userId || payload.id,
        email: `user-${payload.sub}@stack-auth.local`, // Use a consistent format for Stack users
        name: 'Stack User', // We'll get the real name from the frontend user object if needed
      };
      
      return next();
    }

    // Fallback to custom JWT verification
    const customDecoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in database
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
    console.error("Auth error:", error);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};