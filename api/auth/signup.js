const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(process.cwd(), 'user.db');

async function readDB(){
  try{
    const raw = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  }catch(e){
    return [];
  }
}

async function writeDB(data){
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function hashPassword(password, salt){
  const key = crypto.scryptSync(password, salt, 64);
  return key.toString('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try{
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const db = await readDB();
    const existing = db.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const salt = crypto.randomBytes(12).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const user = { id: crypto.randomUUID(), name, email: email.toLowerCase(), passwordHash, salt, createdAt: new Date().toISOString() };
    db.push(user);
    await writeDB(db);

    // Do not return passwordHash/salt
    const { passwordHash:ph, salt:s, ...safe } = user;
    return res.status(201).json({ ok: true, user: safe });
  }catch(err){
    console.error('signup error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
