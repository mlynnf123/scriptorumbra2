import getPool from "./lib/database.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed. Use GET." 
    });
  }

  try {
    console.log("🧪 Starting database connectivity test...");
    
    const pool = getPool();
    const client = await pool.connect();

    try {
      // Test 1: Basic connectivity
      console.log("✅ Database connection established");
      
      // Test 2: Check database version
      const versionResult = await client.query("SELECT version()");
      const dbVersion = versionResult.rows[0].version;
      console.log("📊 Database version:", dbVersion);
      
      // Test 3: Check if required tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'chat_sessions', 'chat_messages')
      `);
      
      const existingTables = tablesResult.rows.map(row => row.table_name);
      console.log("📋 Existing tables:", existingTables);
      
      // Test 4: Check table structures
      const tableStructures = {};
      for (const tableName of existingTables) {
        const structureResult = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);
        
        tableStructures[tableName] = structureResult.rows;
      }
      
      // Test 5: Test insert/select operations (if users table exists)
      let testOperationResult = null;
      if (existingTables.includes('users')) {
        try {
          // Try a safe select operation
          const testSelect = await client.query("SELECT COUNT(*) as user_count FROM users");
          testOperationResult = {
            operation: "SELECT COUNT(*) FROM users",
            result: testSelect.rows[0].user_count,
            status: "success"
          };
        } catch (selectError) {
          testOperationResult = {
            operation: "SELECT COUNT(*) FROM users",
            error: selectError.message,
            status: "error"
          };
        }
      }

      // Test 6: Check database performance with a simple query
      const performanceStart = Date.now();
      await client.query("SELECT NOW()");
      const performanceTime = Date.now() - performanceStart;

      console.log("🎯 Database test completed successfully");

      res.json({
        success: true,
        message: "Database connectivity test completed",
        data: {
          connection: "established",
          version: dbVersion,
          tables: {
            existing: existingTables,
            expected: ['users', 'chat_sessions', 'chat_messages'],
            structures: tableStructures
          },
          performance: {
            simpleQueryTime: `${performanceTime}ms`
          },
          testOperation: testOperationResult,
          timestamp: new Date().toISOString()
        }
      });

    } finally {
      client.release();
      console.log("🔄 Database connection released");
    }

  } catch (error) {
    console.error("❌ Database test failed:", error);
    
    res.status(500).json({
      success: false,
      message: "Database connectivity test failed",
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN',
        detail: error.detail || null,
        timestamp: new Date().toISOString()
      }
    });
  }
}