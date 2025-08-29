export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log("🧪 Test Simple: Method:", req.method);
  console.log("🧪 Test Simple: Headers:", req.headers);
  console.log("🧪 Test Simple: Body:", req.body);

  // Simple response for testing
  res.json({
    success: true,
    message: "Test endpoint working!",
    method: req.method,
    timestamp: new Date().toISOString(),
    data: {
      test: "This is a test response",
      canConnect: true
    }
  });
}