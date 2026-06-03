module.exports = (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ ok: true, pong: true, time: new Date().toISOString() });
  } catch (err) {
    console.error('Ping endpoint error:', err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  }
};
