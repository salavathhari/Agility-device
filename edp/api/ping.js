module.exports = (req, res) => {
  // Restrict CORS to same-origin only; update the allowlist for production domains
  const allowedOrigins = [
    'https://agility-device.vercel.app',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true, pong: true, time: new Date().toISOString() });
};
