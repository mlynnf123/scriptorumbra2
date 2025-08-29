import OpenAI from "openai";
import getPool from "../lib/database.js";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log("🐛 Debug Sessions: Method:", req.method);
  console.log("🐛 Debug Sessions: Headers:", req.headers);
  console.log("🐛 Debug Sessions: Body:", req.body);

  try {
    // Simple hardcoded user for testing (bypassing auth)
    const testUser = {
      id: "test-user-123",
      email: "test@example.com",
      name: "Test User"
    };

    if (req.method === 'POST') {
      console.log("🐛 Creating session without auth middleware");
      
      const { title = "Debug Test Session" } = req.body;
      
      // Check if we can connect to database
      console.log("🐛 Attempting database connection...");
      const pool = getPool();
      const client = await pool.connect();
      
      try {
        console.log("🐛 Database connected successfully");
        
        // Try to create/update user
        console.log("🐛 Upserting test user...");
        await client.query(
          `INSERT INTO users (id, email, name) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (id) DO UPDATE SET 
             name = EXCLUDED.name,
             updated_at = NOW()`,
          [testUser.id, testUser.email, testUser.name],
        );
        console.log("🐛 User upserted successfully");

        // Create session
        console.log("🐛 Creating chat session...");
        const result = await client.query(
          `INSERT INTO chat_sessions (user_id, title) 
           VALUES ($1, $2) 
           RETURNING id, title, created_at`,
          [testUser.id, title],
        );
        console.log("🐛 Session created successfully");

        const session = result.rows[0];

        res.json({
          success: true,
          data: { session },
          debug: "Session created without auth middleware"
        });
      } finally {
        client.release();
      }
    } else if (req.method === 'GET') {
      console.log("🐛 Getting sessions without auth middleware");
      
      const pool = getPool();
      const client = await pool.connect();
      
      try {
        const result = await client.query(
          `SELECT cs.id, cs.title, cs.created_at, cs.updated_at,
                  COALESCE(
                    json_agg(
                      json_build_object(
                        'id', m.id,
                        'content', m.content,
                        'role', m.role,
                        'created_at', m.created_at,
                        'metadata', m.metadata
                      ) ORDER BY m.created_at ASC
                    ) FILTER (WHERE m.id IS NOT NULL), '[]'::json
                  ) as messages
           FROM chat_sessions cs
           LEFT JOIN messages m ON cs.id = m.session_id
           WHERE cs.user_id = $1
           GROUP BY cs.id, cs.title, cs.created_at, cs.updated_at
           ORDER BY cs.updated_at DESC`,
          [testUser.id],
        );

        const sessions = result.rows.map(session => ({
          ...session,
          messages: session.messages || []
        }));

        res.json({
          success: true,
          data: { sessions },
          debug: "Sessions fetched without auth middleware"
        });
      } finally {
        client.release();
      }
    } else {
      res.status(405).json({ success: false, message: "Method not allowed" });
    }
  } catch (error) {
    console.error("🐛 Debug Sessions Error:", error);
    res.status(500).json({
      success: false,
      message: "Debug session failed",
      error: error.message,
      stack: error.stack,
      detail: error.detail
    });
  }
}