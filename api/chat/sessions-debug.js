import getPool from "../lib/database.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Debug endpoint called:', req.method);
    console.log('Headers:', req.headers);
    
    // Test database connection
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT NOW() as current_time');
      console.log('Database connection successful:', result.rows[0]);
      
      res.status(200).json({
        success: true,
        message: "Database connection successful",
        timestamp: result.rows[0].current_time,
        environment: {
          DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
          NODE_ENV: process.env.NODE_ENV,
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      stack: error.stack
    });
  }
}