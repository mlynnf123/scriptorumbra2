import pool from "../config/database.js";

async function addMetadataColumn() {
  const client = await pool.connect();
  
  try {
    console.log("🔧 Adding metadata column to chat_messages table...");
    
    // Add metadata column if it doesn't exist
    await client.query(`
      ALTER TABLE chat_messages 
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
    `);
    
    console.log("✅ Metadata column added successfully!");
    
    // Create an index on metadata for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata 
      ON chat_messages USING GIN (metadata);
    `);
    
    console.log("✅ Metadata index created successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMetadataColumn()
  .then(() => {
    console.log("✅ Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });