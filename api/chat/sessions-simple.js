import getPool from "../lib/database.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pool = getPool();

  try {
    if (req.method === 'GET') {
      // Get all chat sessions (without user filtering for debugging)
      console.log("📋 Getting all sessions (debug mode)");
      
      const client = await pool.connect();

      try {
        const result = await client.query(
          `SELECT 
            s.id,
            s.title,
            s.created_at,
            s.updated_at,
            COUNT(m.id)::INTEGER as message_count
           FROM chat_sessions s
           LEFT JOIN chat_messages m ON s.id = m.session_id
           GROUP BY s.id, s.title, s.created_at, s.updated_at
           ORDER BY s.updated_at DESC
           LIMIT 10`
        );

        res.json({
          success: true,
          data: { sessions: result.rows },
          debug: true
        });
      } finally {
        client.release();
      }
    } else if (req.method === 'POST') {
      // Create new chat session (with dummy user)
      const client = await pool.connect();

      try {
        const { title = "Debug Conversation" } = req.body;
        const dummyUserId = "debug-user-123";

        // Ensure dummy user exists
        await client.query(
          `INSERT INTO users (id, email, name) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (id) DO NOTHING`,
          [dummyUserId, "debug@example.com", "Debug User"]
        );

        const result = await client.query(
          `INSERT INTO chat_sessions (user_id, title) 
           VALUES ($1, $2) 
           RETURNING id, title, created_at, updated_at`,
          [dummyUserId, title]
        );

        const session = result.rows[0];

        res.status(201).json({
          success: true,
          message: "Debug chat session created successfully",
          data: { session },
          debug: true
        });
      } finally {
        client.release();
      }
    } else {
      res.status(405).json({ success: false, message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Sessions API error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: error.message,
      stack: error.stack
    });
  }
}