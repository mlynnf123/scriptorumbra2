import pool from "../config/database.js";

async function fixMerandaUser() {
  const client = await pool.connect();
  
  try {
    console.log("🔧 Fixing user account for meranda@im-aiautomation.com...");
    
    // First, check current state
    const usersResult = await client.query(
      "SELECT id, email FROM users WHERE email LIKE '%meranda%'"
    );
    
    console.log("Current users with 'meranda' in email:");
    for (const user of usersResult.rows) {
      console.log(`  ${user.id} - ${user.email}`);
    }
    
    // Delete all users except the Stack Auth one
    const stackAuthUserId = '6670a7c8-66c2-4ee0-a4c6-d166c5bb9cba';
    
    // First, ensure the Stack Auth user exists
    await client.query(
      `INSERT INTO users (id, email, name) 
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [stackAuthUserId, `${stackAuthUserId}@stack-auth.local`, 'Meranda']
    );
    
    console.log(`\n✅ Created Stack Auth user ${stackAuthUserId}`);
    
    // Then update all chat sessions to use the Stack Auth ID
    const updateResult = await client.query(
      `UPDATE chat_sessions 
       SET user_id = $1 
       WHERE user_id IN (
         SELECT id FROM users 
         WHERE email = 'meranda@im-aiautomation.com' 
         AND id != $1
       )`,
      [stackAuthUserId]
    );
    
    console.log(`\n📊 Updated ${updateResult.rowCount} chat sessions to use Stack Auth ID`);
    
    // Delete other user records with the same email
    const deleteResult = await client.query(
      `DELETE FROM users 
       WHERE email = 'meranda@im-aiautomation.com' 
       AND id != $1`,
      [stackAuthUserId]
    );
    
    console.log(`🗑️  Deleted ${deleteResult.rowCount} duplicate user records`);
    
    console.log(`\n✅ User account fixed! Stack Auth ID ${stackAuthUserId} now owns all chat sessions`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    client.release();
    pool.end();
  }
}

fixMerandaUser();