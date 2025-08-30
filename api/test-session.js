export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log("🧪 Test Session - Method:", req.method);
  console.log("🧪 Test Session - Body:", req.body);

  if (req.method === 'POST') {
    try {
      // Import database
      const getPool = (await import('./lib/database.js')).default;
      const pool = getPool();
      const client = await pool.connect();
      
      try {
        const { title = "Test Chat Session" } = req.body;
        const testUserId = "test-user-456";
        
        console.log("🧪 Creating session for user:", testUserId);
        const result = await client.query(
          `INSERT INTO chat_sessions (user_id, title) 
           VALUES ($1, $2) 
           RETURNING id, title, created_at`,
          [testUserId, title]
        );
        
        const session = result.rows[0];
        console.log("🧪 Session created successfully:", session);
        
        return res.json({
          success: true,
          data: { session },
          debug: "Test session endpoint working"
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("🧪 Test session error:", error);
      return res.status(500).json({
        success: false,
        message: "Test session creation failed",
        error: error.message,
        stack: error.stack
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    message: "Method not allowed" 
  });
}