
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const TMP_DB = path.join(os.tmpdir(), 'user.db');
const BUNDLED_DB = path.join(process.cwd(), 'user.db');

async function ensureDB() {
  try { await fs.access(TMP_DB); return TMP_DB; } catch (e) {
    try { await fs.access(BUNDLED_DB); await fs.copyFile(BUNDLED_DB, TMP_DB); return TMP_DB; } catch (err) { await fs.writeFile(TMP_DB, '[]', 'utf8'); return TMP_DB; }
  }
}

async function readDB(){
  try{ const p = await ensureDB(); const raw = await fs.readFile(p, 'utf8'); return JSON.parse(raw || '[]'); }catch(e){ return []; }
}

function hashPassword(password, salt){
  const key = crypto.scryptSync(password, salt, 64);
  return key.toString('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try{
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const db = await readDB();
    const user = db.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(404).json({ error: 'No account' });
    const candidate = hashPassword(password, user.salt);
    const match = crypto.timingSafeEqual(Buffer.from(candidate,'hex'), Buffer.from(user.passwordHash,'hex'));
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const { passwordHash, salt, ...safe } = user;
    return res.json({ ok: true, user: safe });
  }catch(err){ console.error('login error', err); return res.status(500).json({ error: 'Internal error' }); }
};
