export default async function handler(req, res) {
  console.log(`🧪 Test message endpoint called - Method: ${req.method}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      message: "Test endpoint working!",
      data: { 
        method: req.method, 
        body: req.body,
        timestamp: new Date().toISOString()
      }
    });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}