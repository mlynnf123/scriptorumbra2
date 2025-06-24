import getPool from "../../lib/database.js";
import { authenticateToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication middleware
  try {
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (error) {
    return; // Response already sent by auth middleware
  }

  const { sessionId } = req.query;
  const pool = getPool();
  const client = await pool.connect();

  try {
    if (req.method === 'GET') {
      // Get specific chat session with messages
      const sessionResult = await client.query(
        "SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = $1 AND user_id = $2",
        [sessionId, req.user.id],
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
      }

      // Get messages for the session
      const messagesResult = await client.query(
        `SELECT id, role, content, created_at 
         FROM chat_messages 
         WHERE session_id = $1 
         ORDER BY created_at ASC`,
        [sessionId],
      );

      const session = {
        ...sessionResult.rows[0],
        messages: messagesResult.rows,
      };

      res.json({
        success: true,
        data: { session },
      });
    } else if (req.method === 'PATCH') {
      // Update session title
      const { title } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title is required",
        });
      }

      const result = await client.query(
        `UPDATE chat_sessions 
         SET title = $1, updated_at = NOW() 
         WHERE id = $2 AND user_id = $3 
         RETURNING id, title, updated_at`,
        [title, sessionId, req.user.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
      }

      res.json({
        success: true,
        message: "Session title updated successfully",
        data: { session: result.rows[0] },
      });
    } else if (req.method === 'DELETE') {
      // Delete chat session
      const result = await client.query(
        "DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2",
        [sessionId, req.user.id],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
      }

      res.json({
        success: true,
        message: "Chat session deleted successfully",
      });
    } else {
      res.status(405).json({ success: false, message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Session API error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
    });
  } finally {
    client.release();
  }
}