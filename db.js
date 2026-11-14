'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DATA_DIR = process.env.DF_DATA_DIR || path.join(__dirname, 'data');
const PHOTO_DIR = path.join(DATA_DIR, 'private', 'photos'); // never served statically
fs.mkdirSync(PHOTO_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'df.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member','instructor','admin')),  -- primary (highest) role, kept for compatibility
  roles TEXT NOT NULL DEFAULT 'member',                                 -- authoritative: comma list, e.g. 'member,instructor'
  is_super INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  membership TEXT NOT NULL DEFAULT 'active' CHECK (membership IN ('active','inactive')),
  birth_date TEXT, shooter_no TEXT, classification TEXT, photo TEXT,
  must_change_pw INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS login_fail (
  phone TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, locked_until INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('course','join')),
  name TEXT NOT NULL, phone TEXT NOT NULL, previous_course TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','handled','approved','rejected')),
  note TEXT, user_id INTEGER REFERENCES users(id), handled_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS trainings (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL, starts_at TEXT NOT NULL, location TEXT NOT NULL,
  instructor_id INTEGER NOT NULL REFERENCES users(id),
  capacity INTEGER NOT NULL CHECK (capacity >= 1), notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed','cancelled','done')),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY,
  training_id INTEGER NOT NULL REFERENCES trainings(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('confirmed','waitlist','offered','cancelled','declined','expired')),
  waitlist_at TEXT, offer_expires_at TEXT, cancelled_by TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
-- one live registration per member per training, enforced by the database itself
CREATE UNIQUE INDEX IF NOT EXISTS reg_one_live ON registrations(training_id, user_id)
  WHERE status IN ('confirmed','waitlist','offered');
CREATE INDEX IF NOT EXISTS reg_training ON registrations(training_id, status);
CREATE TABLE IF NOT EXISTS attendance (
  training_id INTEGER NOT NULL REFERENCES trainings(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('present','absent')),
  marked_by INTEGER REFERENCES users(id), marked_at TEXT NOT NULL,
  PRIMARY KEY (training_id, user_id)
);
CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY,
  training_id INTEGER NOT NULL REFERENCES trainings(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  exercise_id INTEGER REFERENCES exercises(id),
  manual_name TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('paper','steel','popper','mixed')),
  a INTEGER NOT NULL DEFAULT 0, c INTEGER NOT NULL DEFAULT 0, d INTEGER NOT NULL DEFAULT 0,
  misses INTEGER NOT NULL DEFAULT 0, time_sec REAL NOT NULL,
  published INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id), created_at TEXT NOT NULL,
  edited_by INTEGER REFERENCES users(id), edited_at TEXT,
  CHECK ((exercise_id IS NOT NULL) <> (manual_name IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS results_user ON results(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS results_training ON results(training_id, user_id);
CREATE TABLE IF NOT EXISTS feedback (
  training_id INTEGER NOT NULL REFERENCES trainings(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0,
  author_id INTEGER REFERENCES users(id), updated_at TEXT NOT NULL,
  PRIMARY KEY (training_id, user_id)
);
CREATE TABLE IF NOT EXISTS stages (
  id INTEGER PRIMARY KEY,
  training_id INTEGER NOT NULL REFERENCES trainings(id),
  position INTEGER NOT NULL,
  name TEXT NOT NULL, description TEXT,
  exercise_id INTEGER REFERENCES exercises(id),
  layout TEXT NOT NULL DEFAULT '{"items":[]}',
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS stages_training ON stages(training_id, position);
CREATE TABLE IF NOT EXISTS reminders_sent (
  training_id INTEGER NOT NULL REFERENCES trainings(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('24h','1h')),
  sent_at TEXT NOT NULL,
  PRIMARY KEY (training_id, user_id, kind)
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
  training_id INTEGER REFERENCES trainings(id),
  created_at TEXT NOT NULL, read_at TEXT
);
CREATE INDEX IF NOT EXISTS notif_user ON notifications(user_id, read_at);
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1, category TEXT NOT NULL DEFAULT 'club', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY, actor_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL, target TEXT, details TEXT, at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

// light migrations for databases created by earlier versions
const cols = t => db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name);
if (!cols('users').includes('roles')) { db.exec(`ALTER TABLE users ADD COLUMN roles TEXT NOT NULL DEFAULT 'member'`); db.exec('UPDATE users SET roles=role'); }
if (!cols('news').includes('category')) db.exec(`ALTER TABLE news ADD COLUMN category TEXT NOT NULL DEFAULT 'club'`);

// Values the club has not approved yet are settings, not hard-coded constants.
const SETTING_DEFAULTS = {
  cancel_deadline_hours: '3',   // member may cancel until N hours before start (pending club decision)
  offer_hours: '12',            // time a member has to confirm a waitlist offer (pending club decision)
  link_ipsc_global: 'https://www.ipsc.org',
  link_ipsc_israel: '',
  link_facebook: '', link_instagram: '', link_youtube: '', link_whatsapp: '',
};
const getSetting = k => {
  const r = db.prepare('SELECT value FROM settings WHERE key=?').get(k);
  return r ? r.value : SETTING_DEFAULTS[k];
};
const allSettings = () => Object.fromEntries(Object.keys(SETTING_DEFAULTS).map(k => [k, getSetting(k)]));
const setSetting = (k, v) => db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v));

const nowIso = () => new Date().toISOString();

function audit(actorId, action, target, details) {
  db.prepare('INSERT INTO audit(actor_id,action,target,details,at) VALUES(?,?,?,?,?)')
    .run(actorId ?? null, action, target ?? null, details ? JSON.stringify(details) : null, nowIso());
}

function notify(userId, kind, title, body, trainingId) {
  db.prepare('INSERT INTO notifications(user_id,kind,title,body,training_id,created_at) VALUES(?,?,?,?,?,?)')
    .run(userId, kind, title, body, trainingId ?? null, nowIso());
}

const BCRYPT_COST = 11;
const hashPassword = p => bcrypt.hashSync(p, BCRYPT_COST);

const primaryRole = rs => ['admin', 'instructor', 'member'].find(r => rs.includes(r)) || 'member';
function createUser({ phone, name, password, role = 'member', roles, isSuper = false, mustChange = false, membership = 'active' }) {
  const t = nowIso();
  const rs = roles && roles.length ? roles : [role];
  const r = db.prepare(`INSERT INTO users(phone,name,pass_hash,role,roles,is_super,membership,must_change_pw,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)`).run(phone, name, hashPassword(password), primaryRole(rs), rs.join(','), isSuper ? 1 : 0, membership, mustChange ? 1 : 0, t, t);
  return Number(r.lastInsertRowid);
}

module.exports = { primaryRole, db, DATA_DIR, PHOTO_DIR, nowIso, audit, notify, hashPassword, createUser, getSetting, allSettings, setSetting, SETTING_DEFAULTS };
