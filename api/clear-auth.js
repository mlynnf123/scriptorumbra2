export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // This endpoint just tells the client to clear credentials
    // The actual clearing happens on the client side
    res.json({
      success: true,
      message: "Clear all authentication data from localStorage",
      clearKeys: [
        'stack-native-access-token',
        'stack-native-refresh-token', 
        'stack-native-user'
      ]
    });
  } else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}