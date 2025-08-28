import pool from "../config/database.js";

async function cleanupDuplicateUsers() {
  const client = await pool.connect();
  
  try {
    console.log("🧹 Starting user cleanup...");
    
    // Find users with duplicate emails
    const duplicatesResult = await client.query(`
      SELECT email, COUNT(*) as count, array_agg(id) as user_ids
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);
    
    console.log(`Found ${duplicatesResult.rows.length} duplicate email addresses`);
    
    for (const dup of duplicatesResult.rows) {
      console.log(`\n📧 Email: ${dup.email}`);
      console.log(`   User IDs: ${dup.user_ids.join(', ')}`);
      
      // For now, just show what we found
      // In production, you'd decide which ID to keep
    }
    
    // Show all users
    const allUsersResult = await client.query(
      "SELECT id, email, name, created_at FROM users ORDER BY created_at DESC"
    );
    
    console.log("\n📋 All users in database:");
    for (const user of allUsersResult.rows) {
      console.log(`   ${user.id} - ${user.email} - ${user.name} - Created: ${user.created_at}`);
    }
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    client.release();
    pool.end();
  }
}

cleanupDuplicateUsers();