import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DB_FILE = join(DATA_DIR, 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-please';
const PORT = process.env.PORT || 4000;

// ───────────────────────── Tiny JSON DB ─────────────────────────
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const load = () => {
  if (!existsSync(DB_FILE)) return { users: [], states: {}, nextId: 1 };
  try { return JSON.parse(readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: [], states: {}, nextId: 1 }; }
};
let db = load();
// Migration: ensure at least one admin exists (promote oldest user)
if (db.users.length > 0 && !db.users.some(u => u.is_admin)) {
  db.users[0].is_admin = true;
  console.log(`👑 Promoted ${db.users[0].email} to admin`);
}
let writeTimer = null;
const persist = () => {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }, 100);
};

const findUserByEmail = (email) => db.users.find(u => u.email === email.toLowerCase());
const findUserById = (id) => db.users.find(u => u.id === id);

// ───────────────────────── App ─────────────────────────
const app = express();
app.set('trust proxy', 1);
app.use(helmet());
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS,
  credentials: false
}));
app.use(express.json({ limit: '2mb' }));

// Rate limit auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' }
});
app.use(['/api/login', '/api/register'], authLimiter);

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

const auth = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, is_admin: !!u.is_admin });

const requireAdmin = (req, res, next) => {
  const user = findUserById(req.user.id);
  if (!user || !user.is_admin) return res.status(403).json({ error: 'Admin only' });
  next();
};

// ───────────────────────── Routes ─────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, users: db.users.length }));

app.post('/api/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || password.length < 6)
    return res.status(400).json({ error: 'Email and password (min 6 chars) required' });

  if (findUserByEmail(email))
    return res.status(409).json({ error: 'Email already registered' });

  const user = {
    id: db.nextId++,
    email: email.toLowerCase(),
    name: name || null,
    password_hash: bcrypt.hashSync(password, 10),
    // First registered user automatically becomes admin
    is_admin: db.users.length === 0,
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  persist();
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

app.get('/api/state', auth, (req, res) => {
  const entry = db.states[req.user.id];
  if (!entry) return res.json({ data: null, updated_at: null });
  res.json(entry);
});

app.put('/api/state', auth, (req, res) => {
  const data = req.body?.data;
  if (!data || typeof data !== 'object')
    return res.status(400).json({ error: 'Invalid state' });
  const updated_at = new Date().toISOString();
  db.states[req.user.id] = { data, updated_at };
  persist();
  res.json({ ok: true, updated_at });
});

app.delete('/api/account', auth, (req, res) => {
  db.users = db.users.filter(u => u.id !== req.user.id);
  delete db.states[req.user.id];
  persist();
  res.json({ ok: true });
});

app.post('/api/change-password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 chars' });
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!bcrypt.compareSync(currentPassword || '', user.password_hash))
    return res.status(401).json({ error: 'Current password is incorrect' });
  user.password_hash = bcrypt.hashSync(newPassword, 10);
  persist();
  res.json({ ok: true });
});

// ───────────────────────── Admin Routes ─────────────────────────
app.get('/api/admin/users', auth, requireAdmin, (_req, res) => {
  const users = db.users.map(u => {
    const s = db.states[u.id];
    const data = s?.data;
    return {
      ...publicUser(u),
      created_at: u.created_at,
      last_active: s?.updated_at || null,
      workouts: data?.logs?.length || 0,
      exercises: data?.exercises?.length || 0,
      goals: data?.goals?.length || 0,
      metrics: data?.metrics?.length || 0,
      has_data: !!s
    };
  });
  res.json({ users, total: users.length });
});

app.get('/api/admin/users/:id', auth, requireAdmin, (req, res) => {
  const id = +req.params.id;
  const user = findUserById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const state = db.states[id] || null;
  res.json({ user: publicUser(user), created_at: user.created_at, state });
});

app.delete('/api/admin/users/:id', auth, requireAdmin, (req, res) => {
  const id = +req.params.id;
  if (id === req.user.id) return res.status(400).json({ error: "Can't delete yourself" });
  db.users = db.users.filter(u => u.id !== id);
  delete db.states[id];
  persist();
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/toggle-admin', auth, requireAdmin, (req, res) => {
  const id = +req.params.id;
  if (id === req.user.id) return res.status(400).json({ error: "Can't change your own admin status" });
  const user = findUserById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.is_admin = !user.is_admin;
  persist();
  res.json({ ok: true, user: publicUser(user) });
});

app.post('/api/admin/users/:id/reset-password', auth, requireAdmin, (req, res) => {
  const id = +req.params.id;
  const user = findUserById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Generate a memorable 12-char temporary password
  const tempPassword = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
  user.password_hash = bcrypt.hashSync(tempPassword, 10);
  persist();
  res.json({ ok: true, tempPassword, email: user.email });
});

app.get('/api/admin/stats', auth, requireAdmin, (_req, res) => {
  const totalUsers = db.users.length;
  const totalAdmins = db.users.filter(u => u.is_admin).length;
  let totalWorkouts = 0, totalVolume = 0, totalSets = 0;
  Object.values(db.states).forEach(s => {
    const logs = s.data?.logs || [];
    totalWorkouts += logs.length;
    logs.forEach(l => {
      (l.entries || []).forEach(e => {
        (e.sets || []).forEach(set => {
          if (set.done) {
            totalSets++;
            totalVolume += (set.reps || 0) * (set.weight || 0);
          }
        });
      });
    });
  });
  res.json({
    totalUsers, totalAdmins,
    totalWorkouts, totalSets,
    totalVolumeKg: Math.round(totalVolume),
    activeUsers: Object.keys(db.states).length
  });
});

app.listen(PORT, () => {
  console.log(`🏋️  Gym tracker API listening on http://localhost:${PORT}`);
  console.log(`    Data file: ${DB_FILE}`);
});
