export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Debug endpoint to see what requests are coming through
  const response = {
    success: true,
    message: "Debug request received",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  };

  console.log('Debug request:', response);
  res.status(200).json(response);
}