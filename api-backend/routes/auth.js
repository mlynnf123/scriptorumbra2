import express from "express";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { generateToken, authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";

const router = express.Router();

// Register new user
router.post("/register", validate("register"), async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, password } = req.validatedData;

    // Check if user already exists
    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate avatar URL
    const avatarUrl = `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(email)}`;

    // Create user
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, avatar_url) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, avatar_url, created_at`,
      [name, email.toLowerCase(), passwordHash, avatarUrl],
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = generateToken(user.id);

    // Create initial chat session
    const sessionResult = await client.query(
      `INSERT INTO chat_sessions (user_id, title) 
       VALUES ($1, $2) 
       RETURNING id`,
      [user.id, "Welcome to Scriptor Umbra"],
    );

    const sessionId = sessionResult.rows[0].id;

    // Add welcome message
    await client.query(
      `INSERT INTO chat_messages (session_id, role, content) 
       VALUES ($1, $2, $3)`,
      [
        sessionId,
        "assistant",
        "Hello! I'm Scriptor Umbra, your versatile literary companion. I can channel the writing styles of legendary authors from Hemingway to Plath, from Shakespeare to Bukowski. Whether you need existential prose, whimsical children's rhymes, or anything in between, I'm here to craft it with depth and literary flair. How shall we begin our creative journey today?",
      ],
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
        },
        token,
        sessionId,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create account. Please try again.",
    });
  } finally {
    client.release();
  }
});

// Login user
router.post("/login", validate("login"), async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, password } = req.validatedData;

    // Find user by email
    const result = await client.query(
      "SELECT id, name, email, password_hash, avatar_url, created_at FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Get user's most recent session or create one
    let sessionResult = await client.query(
      `SELECT id FROM chat_sessions 
       WHERE user_id = $1 
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [user.id],
    );

    let sessionId;
    if (sessionResult.rows.length === 0) {
      // Create new session if none exists
      const newSessionResult = await client.query(
        `INSERT INTO chat_sessions (user_id, title) 
         VALUES ($1, $2) 
         RETURNING id`,
        [user.id, "New Conversation"],
      );
      sessionId = newSessionResult.rows[0].id;

      // Add welcome message
      await client.query(
        `INSERT INTO chat_messages (session_id, role, content) 
         VALUES ($1, $2, $3)`,
        [
          sessionId,
          "assistant",
          "Welcome back! I'm Scriptor Umbra, your versatile literary companion. Ready to channel the voices of literary legends or craft original content in any style. What creative journey shall we embark on today?",
        ],
      );
    } else {
      sessionId = sessionResult.rows[0].id;
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
        },
        token,
        sessionId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  } finally {
    client.release();
  }
});

// Get current user info
router.get("/me", authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

// Logout (client-side token removal, but we can track this server-side if needed)
router.post("/logout", authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;
