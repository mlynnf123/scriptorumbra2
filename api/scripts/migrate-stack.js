import pool from "../config/database.js";

const updateTablesForStack = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Starting Stack compatibility migration...");

    // Drop foreign key constraints first
    await client.query(`
      ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey;
      ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;
    `);

    // Drop and recreate users table with String ID
    await client.query(`DROP TABLE IF EXISTS users CASCADE;`);
    
    await client.query(`
      CREATE TABLE users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Update chat_sessions to use VARCHAR user_id
    await client.query(`
      ALTER TABLE chat_sessions 
      ALTER COLUMN user_id TYPE VARCHAR(255);
    `);

    // Recreate foreign key constraints
    await client.query(`
      ALTER TABLE chat_sessions 
      ADD CONSTRAINT chat_sessions_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    `);

    await client.query(`
      ALTER TABLE chat_messages 
      ADD CONSTRAINT chat_messages_session_id_fkey 
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;
    `);

    console.log("✅ Database updated for Stack compatibility!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
updateTablesForStack()
  .then(() => {
    console.log("🎉 Stack migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Stack migration failed:", error);
    process.exit(1);
  });