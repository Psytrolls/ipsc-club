'use strict';
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const D = require('./db');
const { db, primaryRole, nowIso, audit, notify, hashPassword, createUser, getSetting, allSettings, setSetting, PHOTO_DIR, SETTING_DEFAULTS } = D;
const L = require('./lib');
const { HttpError, bad, str, optStr, intIn, numIn, idParam } = L;
const T = require('./training-logic');

const app = express();
app.disable('x-powered-by');
if (process.env.DF_TRUST_PROXY) app.set('trust proxy', 1);
const SECURE_COOKIES = process.env.DF_SECURE_COOKIES === '1';

// ---------- security headers ----------
app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  if (SECURE_COOKIES || req.secure) res.set('Strict-Transport-Security', 'max-age=31536000');
  next();
});

app.use(express.json({ limit: '100kb' }));

// ---------- tiny in-memory rate limiter ----------
const buckets = new Map();
function rateLimit(name, max, windowMs) {
  return (req, res, next) => {
    const key = name + ':' + req.ip;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || b.reset < now) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
    if (++b.n > max) return res.status(429).json({ error: 'יותר מדי בקשות. נסו שוב מאוחר יותר' });
    next();
  };
}
setInterval(() => { const n = Date.now(); for (const [k, b] of buckets) if (b.reset < n) buckets.delete(k); }, 60000).unref();

// ---------- auth ----------
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
function parseCookies(h) {
  const out = {};
  for (const p of (h || '').split(';')) { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }
  return out;
}
const SESSION_MS = 7 * 24 * 3600e3;
function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.prepare('INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').run(sha(token), userId, now, now + SESSION_MS);
  res.cookie('df_sid', token, { httpOnly: true, sameSite: 'lax', secure: SECURE_COOKIES, maxAge: SESSION_MS, path: '/' });
}
function killSessions(userId) { db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId); }

app.use((req, res, next) => {
  // CSRF: state-changing requests must carry a custom header (cross-site forms cannot set it) + SameSite=Lax cookie
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('x-df') !== '1') {
    return res.status(403).json({ error: 'בקשה לא מורשית' });
  }
  const tok = parseCookies(req.headers.cookie).df_sid;
  if (tok) {
    const u = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).get(sha(tok), Date.now());
    if (u && u.status === 'active') req.user = u;
  }
  next();
});

const MUST_CHANGE_OK = new Set(['/api/auth/me', '/api/auth/logout', '/api/auth/change-password']);
function needLogin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'נדרשת התחברות' });
  if (req.user.must_change_pw && !MUST_CHANGE_OK.has(req.originalUrl.split('?')[0])) {
    return res.status(403).json({ error: 'יש להחליף סיסמה לפני המשך', code: 'must_change_password' });
  }
  next();
}
const roles = (...allowed) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'נדרשת התחברות' });
  if (req.user.must_change_pw) return res.status(403).json({ error: 'יש להחליף סיסמה לפני המשך', code: 'must_change_password' });
  if (!allowed.some(r => L.hasRole(req.user, r))) return res.status(403).json({ error: 'אין הרשאה' });
  next();
};
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const publicUser = u => ({
  id: u.id, name: u.name, phone: u.phone, roles: L.rolesOf(u), is_super: !!u.is_super, membership: u.membership,
  must_change_pw: !!u.must_change_pw, photo: u.photo ? sha(u.photo).slice(0, 10) : null,
  birth_date: u.birth_date, shooter_no: u.shooter_no, classification: u.classification,
});

// ---------- public ----------
app.get('/api/public/info', (req, res) => {
  const s = allSettings();
  const links = {};
  for (const k of ['ipsc_global', 'ipsc_israel', 'facebook', 'instagram', 'youtube', 'whatsapp']) if (s['link_' + k]) links[k] = s['link_' + k];
  const placeName = s.location_name || '';
  const place = placeName ? { name: placeName, ...navFor({ location: placeName }) } : null;
  res.json({
    links, place,
    news: db.prepare('SELECT id,title,body,category,created_at FROM news WHERE published=1 ORDER BY created_at DESC, id DESC LIMIT 30').all(),
  });
});

app.post('/api/inquiries', rateLimit('inq', 6, 3600e3), wrap((req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot: bots fill hidden fields
  const type = b.type === 'join' ? 'join' : b.type === 'course' ? 'course' : null;
  if (!type) throw bad('סוג פנייה לא תקין');
  const name = str(b.name, 2, 60, 'שם');
  const phone = L.normalizePhone(b.phone);
  if (!phone) throw bad('מספר טלפון לא תקין. יש להזין מספר נייד ישראלי, למשל 050-1234567');
  const prev = type === 'join' ? str(b.previous_course, 2, 200, 'קורס קודם') : null;
  const dup = db.prepare(`SELECT 1 FROM inquiries WHERE phone=? AND type=? AND status='new'`).get(phone, type);
  if (!dup) {
    db.prepare(`INSERT INTO inquiries(type,name,phone,previous_course,created_at) VALUES(?,?,?,?,?)`).run(type, name, phone, prev, nowIso());
  }
  res.json({ ok: true });
}));

// ---------- login ----------
const MAX_FAILS = 5, LOCK_MS = 15 * 60e3;
const DUMMY_HASH = bcrypt.hashSync('x-dummy-password-1', 11);
app.post('/api/auth/login', rateLimit('login', 40, 15 * 60e3), wrap(async (req, res) => {
  const b = req.body || {};
  const phone = L.normalizePhone(b.phone);
  if (!phone || typeof b.password !== 'string' || b.password.length > 200) throw new HttpError(401, 'מספר טלפון או סיסמה שגויים');
  const lock = db.prepare('SELECT * FROM login_fail WHERE phone=?').get(phone);
  if (lock && lock.locked_until > Date.now()) {
    const mins = Math.ceil((lock.locked_until - Date.now()) / 60e3);
    throw new HttpError(429, `יותר מדי ניסיונות כושלים. הכניסה חסומה עוד ${mins} דקות`, 'locked');
  }
  const u = db.prepare('SELECT * FROM users WHERE phone=?').get(phone);
  const ok = await bcrypt.compare(b.password, u ? u.pass_hash : DUMMY_HASH);
  if (!u || !ok || u.status !== 'active') {
    const count = (lock ? lock.count : 0) + 1; // counter is reset to 0 whenever a lock is applied
    const lockedUntil = count >= MAX_FAILS ? Date.now() + LOCK_MS : 0;
    db.prepare(`INSERT INTO login_fail(phone,count,locked_until) VALUES(?,?,?)
      ON CONFLICT(phone) DO UPDATE SET count=excluded.count, locked_until=excluded.locked_until`).run(phone, lockedUntil ? 0 : count, lockedUntil);
    if (lockedUntil) {
      if (u) audit(u.id, 'login_locked', phone, null);
      throw new HttpError(429, 'יותר מדי ניסיונות כושלים. הכניסה חסומה ל־15 דקות', 'locked');
    }
    throw new HttpError(401, 'מספר טלפון או סיסמה שגויים');
  }
  db.prepare('DELETE FROM login_fail WHERE phone=?').run(phone);
  startSession(res, u.id);
  res.json({ user: publicUser(u) });
}));

app.post('/api/auth/logout', (req, res) => {
  const tok = parseCookies(req.headers.cookie).df_sid;
  if (tok) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(tok));
  res.clearCookie('df_sid', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  const unread = db.prepare('SELECT COUNT(*) n FROM notifications WHERE user_id=? AND read_at IS NULL').get(req.user.id).n;
  res.json({ user: publicUser(req.user), unread });
});

app.post('/api/auth/change-password', needLogin, wrap(async (req, res) => {
  const { current, next } = req.body || {};
  if (typeof current !== 'string' || !(await bcrypt.compare(current, req.user.pass_hash))) throw bad('הסיסמה הנוכחית שגויה');
  if (!L.passwordOk(next)) throw bad(L.PASSWORD_POLICY.message);
  if (next === current) throw bad('הסיסמה החדשה זהה לנוכחית');
  db.prepare('UPDATE users SET pass_hash=?, must_change_pw=0, updated_at=? WHERE id=?').run(hashPassword(next), nowIso(), req.user.id);
  const tok = parseCookies(req.headers.cookie).df_sid;
  db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').run(req.user.id, sha(tok)); // end other sessions
  res.json({ ok: true });
}));

// ---------- profile + private photos ----------
app.get('/api/me/profile', needLogin, (req, res) => res.json({ user: publicUser(req.user) }));
app.put('/api/me/profile', needLogin, wrap((req, res) => {
  const b = req.body || {};
  const name = str(b.name, 2, 60, 'שם');
  const birth = L.dateOnly(b.birth_date, 'תאריך לידה');
  const shooter = optStr(b.shooter_no, 30, 'מספר יורה');
  db.prepare('UPDATE users SET name=?, birth_date=?, shooter_no=?, updated_at=? WHERE id=?').run(name, birth, shooter, nowIso(), req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) });
}));

const MAGIC = [
  { ext: 'jpg', test: b => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF },
  { ext: 'png', test: b => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) },
  { ext: 'webp', test: b => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' },
];
const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
app.put('/api/me/photo', needLogin, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '2mb' }), wrap((req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw bad('יש לבחור תמונה (JPG, PNG או WebP עד 2MB)');
  const kind = MAGIC.find(m => m.test(req.body));
  if (!kind) throw bad('קובץ התמונה אינו תקין');
  const file = `${req.user.id}-${crypto.randomBytes(8).toString('hex')}.${kind.ext}`;
  fs.writeFileSync(path.join(PHOTO_DIR, file), req.body, { mode: 0o600 });
  if (req.user.photo) fs.rmSync(path.join(PHOTO_DIR, path.basename(req.user.photo)), { force: true });
  db.prepare('UPDATE users SET photo=?, updated_at=? WHERE id=?').run(file, nowIso(), req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) });
}));
app.delete('/api/me/photo', needLogin, (req, res) => {
  if (req.user.photo) fs.rmSync(path.join(PHOTO_DIR, path.basename(req.user.photo)), { force: true });
  db.prepare('UPDATE users SET photo=NULL, updated_at=? WHERE id=?').run(nowIso(), req.user.id);
  res.json({ ok: true });
});
app.get('/api/photos/:uid', needLogin, wrap((req, res) => {
  const uid = idParam(req.params.uid);
  let allowed = uid === req.user.id || L.hasRole(req.user, 'admin');
  if (!allowed && L.hasRole(req.user, 'instructor')) {
    allowed = !!db.prepare(`SELECT 1 FROM registrations r JOIN trainings t ON t.id=r.training_id
      WHERE r.user_id=? AND t.instructor_id=? LIMIT 1`).get(uid, req.user.id);
  }
  if (!allowed) throw new HttpError(403, 'אין הרשאה');
  const u = db.prepare('SELECT photo FROM users WHERE id=?').get(uid);
  if (!u || !u.photo) throw new HttpError(404, 'אין תמונה');
  const file = path.join(PHOTO_DIR, path.basename(u.photo));
  if (!fs.existsSync(file)) throw new HttpError(404, 'אין תמונה');
  res.set({ 'Content-Type': MIME[path.extname(file).slice(1)] || 'application/octet-stream', 'Cache-Control': 'private, max-age=300' });
  res.sendFile(file);
}));

// ---------- notifications ----------
app.get('/api/notifications', needLogin, (req, res) => {
  res.json({ items: db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100').all(req.user.id) });
});
app.post('/api/notifications/read', needLogin, (req, res) => {
  db.prepare('UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL').run(nowIso(), req.user.id);
  res.json({ ok: true });
});

// ---------- member: trainings ----------
// Navigation links for a training: the club range uses the saved map link / address, any other place is searched by its text.
function navFor(t) {
  const enc = encodeURIComponent;
  const name = getSetting('location_name'), address = getSetting('location_address'), mapUrl = getSetting('location_map_url');
  const isClub = name && t.location.trim() === name.trim();
  const q = isClub ? (address || name) : t.location;
  return {
    maps: isClub && mapUrl ? mapUrl : `https://www.google.com/maps/search/?api=1&query=${enc(q)}`,
    waze: `https://waze.com/ul?q=${enc(q)}&navigate=yes`,
    address: isClub ? address : ''
  };
}
function trainingView(t, userId) {
  const c = T.counts(t.id);
  const instr = db.prepare('SELECT name FROM users WHERE id=?').get(t.instructor_id);
  const mine = userId ? db.prepare(`SELECT * FROM registrations WHERE training_id=? AND user_id=? ORDER BY
      (status IN ('confirmed','waitlist','offered')) DESC, id DESC LIMIT 1`).get(t.id, userId) : null;
  let position = null;
  if (mine && mine.status === 'waitlist') {
    position = db.prepare(`SELECT COUNT(*) n FROM registrations WHERE training_id=? AND status='waitlist'
      AND (waitlist_at < ? OR (waitlist_at = ? AND id <= ?))`).get(t.id, mine.waitlist_at, mine.waitlist_at, mine.id).n;
  }
  const hours = Number(getSetting('cancel_deadline_hours')) || 0;
  return {
    id: t.id, title: t.title, starts_at: t.starts_at, location: t.location, nav: navFor(t), status: t.status, notes: t.notes,
    capacity: t.capacity, instructor: instr ? instr.name : null,
    seats_taken: c.confirmed, seats_held: c.offered, seats_free: Math.max(0, t.capacity - c.confirmed - c.offered),
    waitlist_count: c.waitlist,
    mine: mine ? {
      status: mine.status, offer_expires_at: mine.offer_expires_at, waitlist_position: position, cancelled_by: mine.cancelled_by,
      can_cancel: mine.status === 'confirmed' && new Date(t.starts_at).getTime() - hours * 3600e3 > Date.now(),
    } : null,
    cancel_deadline_hours: hours,
  };
}

app.get('/api/trainings', roles('member'), (req, res) => {
  T.sweep();
  const rows = db.prepare(`SELECT * FROM trainings WHERE starts_at > ? AND (status='open' OR (id IN
    (SELECT training_id FROM registrations WHERE user_id=? AND status IN ('confirmed','waitlist','offered')) AND status='closed'))
    ORDER BY starts_at`).all(nowIso(), req.user.id);
  res.json({ items: rows.map(t => trainingView(t, req.user.id)) });
});
app.get('/api/trainings/:id', roles('member'), wrap((req, res) => {
  T.sweep();
  const t = T.getTraining(idParam(req.params.id));
  const v = trainingView(t, req.user.id);
  if (t.status === 'draft' || (!v.mine && !['open'].includes(t.status))) throw new HttpError(404, 'האימון לא נמצא');
  res.json({ training: v });
}));
const memberAction = fn => [roles('member'), wrap((req, res) => {
  const id = idParam(req.params.id);
  fn(id, req.user);
  res.json({ training: trainingView(T.getTraining(id), req.user.id) });
})];
app.post('/api/trainings/:id/register', ...memberAction(T.register));
app.post('/api/trainings/:id/cancel', ...memberAction(T.cancelRegistration));
app.post('/api/trainings/:id/waitlist/join', ...memberAction(T.joinWaitlist));
app.post('/api/trainings/:id/waitlist/leave', ...memberAction(T.leaveWaitlist));
app.post('/api/trainings/:id/offer/accept', ...memberAction(T.acceptOffer));
app.post('/api/trainings/:id/offer/decline', ...memberAction(T.declineOffer));

app.get('/api/me/registrations', roles('member'), (req, res) => {
  T.sweep();
  const rows = db.prepare(`SELECT t.* FROM trainings t WHERE t.id IN (SELECT training_id FROM registrations WHERE user_id=?)
    AND t.starts_at > ? ORDER BY t.starts_at`).all(req.user.id, new Date(Date.now() - 30 * 86400e3).toISOString());
  res.json({ items: rows.map(t => trainingView(t, req.user.id)).filter(v => v.mine) });
});

// ---------- member: results + progress ----------
const resultOut = r => ({
  id: r.id, exercise_id: r.exercise_id, name: r.exercise_name || r.manual_name, manual: r.exercise_id == null,
  target_type: r.target_type, a: r.a, c: r.c, d: r.d, misses: r.misses, time_sec: r.time_sec,
  edited_at: r.edited_at,
});
app.get('/api/me/results', roles('member'), (req, res) => {
  const rows = db.prepare(`SELECT r.*, e.name exercise_name, t.starts_at, t.title FROM results r
    JOIN trainings t ON t.id=r.training_id LEFT JOIN exercises e ON e.id=r.exercise_id
    WHERE r.user_id=? AND r.published=1 ORDER BY t.starts_at DESC, r.id`).all(req.user.id);
  const fbs = db.prepare(`SELECT f.*, t.starts_at, t.title FROM feedback f JOIN trainings t ON t.id=f.training_id
    WHERE f.user_id=? AND f.published=1`).all(req.user.id);
  const byT = new Map();
  const ensure = (id, starts_at, title) => { if (!byT.has(id)) byT.set(id, { training_id: id, starts_at, title, results: [], feedback: null }); return byT.get(id); };
  for (const r of rows) ensure(r.training_id, r.starts_at, r.title).results.push(resultOut(r));
  for (const f of fbs) ensure(f.training_id, f.starts_at, f.title).feedback = f.text;
  res.json({ items: [...byT.values()].sort((a, b) => b.starts_at.localeCompare(a.starts_at)) });
});
app.get('/api/me/stats', roles('member'), (req, res) => {
  const att = db.prepare(`SELECT COUNT(*) n FROM attendance WHERE user_id=? AND status='present'`).get(req.user.id).n;
  const r = db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(a),0) a, COALESCE(SUM(a+c+d+misses),0) total FROM results WHERE user_id=? AND published=1`).get(req.user.id);
  res.json({ attended: att, results: r.n, alpha_pct: r.total ? Math.round(r.a / r.total * 100) : null });
});
app.get('/api/me/exercises', roles('member'), (req, res) => {
  res.json({ items: db.prepare(`SELECT e.id, e.name, COUNT(*) n FROM results r JOIN exercises e ON e.id=r.exercise_id
    WHERE r.user_id=? AND r.published=1 GROUP BY e.id ORDER BY e.name`).all(req.user.id) });
});
app.get('/api/me/progress', roles('member'), wrap((req, res) => {
  const ex = idParam(req.query.exercise_id);
  const e = db.prepare('SELECT id,name,description FROM exercises WHERE id=?').get(ex);
  if (!e) throw new HttpError(404, 'התרגיל לא נמצא');
  // comparison is by the fixed exercise id; manual results never appear here
  const points = db.prepare(`SELECT r.id, r.training_id, t.starts_at, r.time_sec, r.misses, r.a, r.c, r.d, r.target_type
    FROM results r JOIN trainings t ON t.id=r.training_id
    WHERE r.user_id=? AND r.exercise_id=? AND r.published=1 ORDER BY t.starts_at, r.id`).all(req.user.id, ex);
  const ids = [...new Set(points.map(p => p.training_id))];
  const feedback = ids.length ? db.prepare(`SELECT f.training_id, f.text, t.starts_at FROM feedback f JOIN trainings t ON t.id=f.training_id
    WHERE f.user_id=? AND f.published=1 AND f.training_id IN (${ids.map(() => '?').join(',')}) ORDER BY t.starts_at`).all(req.user.id, ...ids) : [];
  res.json({ exercise: e, points, feedback });
}));

// ---------- instructor ----------
const instructorTraining = (req) => {
  const t = T.getTraining(idParam(req.params.id));
  if (t.instructor_id !== req.user.id) throw new HttpError(403, 'האימון הזה אינו משויך אליך');
  return t;
};
app.get('/api/instructor/trainings', roles('instructor'), (req, res) => {
  const rows = db.prepare(`SELECT * FROM trainings WHERE instructor_id=? AND status<>'draft' ORDER BY starts_at DESC LIMIT 100`).all(req.user.id);
  res.json({ items: rows.map(t => ({ ...trainingView(t, null), registered: T.counts(t.id).confirmed })) });
});
function participants(t) {
  return db.prepare(`SELECT u.id, u.name, u.phone, u.photo IS NOT NULL has_photo, a.status attendance,
      (SELECT COUNT(*) FROM results r WHERE r.training_id=? AND r.user_id=u.id) results_count,
      (SELECT COALESCE(MAX(published),0) FROM results r WHERE r.training_id=? AND r.user_id=u.id) published
    FROM registrations g JOIN users u ON u.id=g.user_id
    LEFT JOIN attendance a ON a.training_id=g.training_id AND a.user_id=u.id
    WHERE g.training_id=? AND g.status='confirmed' ORDER BY u.name`).all(t.id, t.id, t.id);
}
app.get('/api/instructor/trainings/:id', roles('instructor'), wrap((req, res) => {
  T.sweep();
  const t = instructorTraining(req);
  res.json({ training: trainingView(t, null), participants: participants(t) });
}));
app.post('/api/instructor/trainings/:id/attendance', roles('instructor'), wrap((req, res) => {
  const t = instructorTraining(req);
  if (['draft', 'cancelled'].includes(t.status)) throw new HttpError(409, 'לא ניתן לסמן נוכחות באימון זה');
  const uid = idParam(req.body && req.body.user_id);
  const status = req.body.status;
  if (!['present', 'absent', null].includes(status)) throw bad('סטטוס נוכחות לא תקין');
  const reg = db.prepare(`SELECT 1 FROM registrations WHERE training_id=? AND user_id=? AND status='confirmed'`).get(t.id, uid);
  if (!reg) throw new HttpError(404, 'המשתתף אינו רשום לאימון');
  if (status === null) db.prepare('DELETE FROM attendance WHERE training_id=? AND user_id=?').run(t.id, uid);
  else db.prepare(`INSERT INTO attendance(training_id,user_id,status,marked_by,marked_at) VALUES(?,?,?,?,?)
    ON CONFLICT(training_id,user_id) DO UPDATE SET status=excluded.status, marked_by=excluded.marked_by, marked_at=excluded.marked_at`)
    .run(t.id, uid, status, req.user.id, nowIso());
  res.json({ ok: true });
}));

const TARGETS = ['paper', 'steel', 'popper', 'mixed'];
function loadMemberSheet(tid, uid) {
  const records = db.prepare(`SELECT r.*, e.name exercise_name FROM results r LEFT JOIN exercises e ON e.id=r.exercise_id
    WHERE r.training_id=? AND r.user_id=? ORDER BY r.id`).all(tid, uid);
  const fb = db.prepare('SELECT text, published FROM feedback WHERE training_id=? AND user_id=?').get(tid, uid);
  return {
    records: records.map(r => ({ ...resultOut(r), published: !!r.published })),
    feedback: fb ? fb.text : '', published: records.some(r => r.published) || !!(fb && fb.published),
  };
}
function assertConfirmed(tid, uid) {
  const u = db.prepare(`SELECT u.id,u.name FROM registrations g JOIN users u ON u.id=g.user_id
    WHERE g.training_id=? AND g.user_id=? AND g.status='confirmed'`).get(tid, uid);
  if (!u) throw new HttpError(404, 'המשתתף אינו רשום לאימון');
  return u;
}
app.get('/api/instructor/trainings/:id/members/:uid', roles('instructor'), wrap((req, res) => {
  const t = instructorTraining(req);
  const uid = idParam(req.params.uid);
  const m = assertConfirmed(t.id, uid);
  res.json({ member: m, training: trainingView(t, null), ...loadMemberSheet(t.id, uid) });
}));

// live training mode: roll call + who shot what, in one request (the instructor's own training)
app.get('/api/instructor/trainings/:id/live', roles('instructor'), wrap((req, res) => {
  T.sweep();
  const t = instructorTraining(req);
  const rows = db.prepare(`SELECT r.*, e.name exercise_name FROM results r LEFT JOIN exercises e ON e.id=r.exercise_id WHERE r.training_id=? ORDER BY r.id`).all(t.id);
  const byUser = new Map();
  for (const r of rows) { if (!byUser.has(r.user_id)) byUser.set(r.user_id, []); byUser.get(r.user_id).push({ ...resultOut(r), published: !!r.published }); }
  res.json({ training: trainingView(t, null), participants: participants(t).map(p => ({ ...p, records: byUser.get(p.id) || [] })) });
}));
// add or correct ONE result record without touching the participant's other records or feedback
app.post('/api/instructor/trainings/:id/members/:uid/record', roles('instructor'), wrap((req, res) => {
  const t = instructorTraining(req);
  const uid = idParam(req.params.uid);
  assertConfirmed(t.id, uid);
  if (['draft', 'cancelled'].includes(t.status)) throw new HttpError(409, 'לא ניתן להזין תוצאות באימון זה');
  const body = req.body || {};
  const att = db.prepare('SELECT status FROM attendance WHERE training_id=? AND user_id=?').get(t.id, uid);
  if (att && att.status === 'absent') throw new HttpError(409, 'המשתתף סומן כלא הגיע');
  const existing = db.prepare('SELECT * FROM results WHERE training_id=? AND user_id=? ORDER BY id').all(t.id, uid);
  const fb = db.prepare('SELECT text FROM feedback WHERE training_id=? AND user_id=?').get(t.id, uid);
  const keep = r => ({ id: r.id, exercise_id: r.exercise_id, manual_name: r.manual_name, target_type: r.target_type, a: r.a, c: r.c, d: r.d, misses: r.misses, time_sec: r.time_sec });
  const recs = existing.map(keep);
  const nr = { id: body.id || null, exercise_id: body.exercise_id, manual_name: body.manual_name, target_type: body.target_type, a: body.a, c: body.c, d: body.d, misses: body.misses, time_sec: body.time_sec };
  const parsed = parseRecord(nr, 0);
  if (parsed.id) { const i = recs.findIndex(r => r.id === parsed.id); if (i < 0) throw bad('רשומה לא שייכת לאימון/משתתף זה'); recs[i] = parsed; } else recs.push(parsed);
  saveSheet(t, uid, req.user, { records: recs, feedback: fb ? fb.text : '', publish: false });
  res.json(loadMemberSheet(t.id, uid));
}));

function parseRecord(r, i) {
  const label = `רשומה ${i + 1}`;
  if (!r || typeof r !== 'object') throw bad(`${label}: נתונים לא תקינים`);
  const target = r.target_type;
  if (!TARGETS.includes(target)) throw bad(`${label}: סוג מטרה לא תקין`);
  const exId = r.exercise_id ? idParam(r.exercise_id) : null;
  const manual = exId ? null : str(r.manual_name, 2, 80, `${label} - שם תרגיל`);
  if (exId && !db.prepare('SELECT 1 FROM exercises WHERE id=?').get(exId)) throw bad(`${label}: תרגיל לא קיים במאגר`);
  return {
    id: r.id ? idParam(r.id) : null, exercise_id: exId, manual_name: manual, target_type: target,
    a: intIn(r.a ?? 0, 0, 999, `${label} - A`), c: intIn(r.c ?? 0, 0, 999, `${label} - C`), d: intIn(r.d ?? 0, 0, 999, `${label} - D`),
    misses: intIn(r.misses ?? 0, 0, 999, `${label} - החטאות`),
    time_sec: numIn(r.time_sec, 0.01, 3600, `${label} - זמן (שניות)`),
  };
}
const saveSheet = db.transaction((t, uid, actor, body) => {
  const recs = (Array.isArray(body.records) ? body.records : []).map(parseRecord);
  if (recs.length > 30) throw bad('יותר מדי רשומות');
  const feedback = body.feedback == null ? '' : str(String(body.feedback), 0, 2000, 'משוב');
  const existing = db.prepare('SELECT * FROM results WHERE training_id=? AND user_id=?').all(t.id, uid);
  const byId = new Map(existing.map(r => [r.id, r]));
  const fbRow = db.prepare('SELECT * FROM feedback WHERE training_id=? AND user_id=?').get(t.id, uid);
  const wasPublished = existing.some(r => r.published) || !!(fbRow && fbRow.published);
  const publish = wasPublished || body.publish === true;
  const now = nowIso();
  const keep = new Set();
  const changes = [];
  for (const r of recs) {
    if (r.id) {
      const old = byId.get(r.id);
      if (!old) throw bad('רשומה לא שייכת לאימון/משתתף זה');
      keep.add(r.id);
      const diff = ['exercise_id', 'manual_name', 'target_type', 'a', 'c', 'd', 'misses', 'time_sec'].filter(k => old[k] !== r[k]);
      if (diff.length) {
        const edited = old.published ? [actor.id, now] : [old.edited_by, old.edited_at]; // who/when only tracked after publication
        db.prepare(`UPDATE results SET exercise_id=?, manual_name=?, target_type=?, a=?, c=?, d=?, misses=?, time_sec=?,
          published=?, edited_by=?, edited_at=? WHERE id=?`).run(r.exercise_id, r.manual_name, r.target_type, r.a, r.c, r.d, r.misses, r.time_sec,
          publish ? 1 : old.published, edited[0], edited[1], r.id);
        if (old.published) changes.push({ id: r.id, before: Object.fromEntries(diff.map(k => [k, old[k]])), after: Object.fromEntries(diff.map(k => [k, r[k]])) });
      } else if (publish && !old.published) {
        db.prepare('UPDATE results SET published=1 WHERE id=?').run(r.id);
      }
    } else {
      const ins = db.prepare(`INSERT INTO results(training_id,user_id,exercise_id,manual_name,target_type,a,c,d,misses,time_sec,published,created_by,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(t.id, uid, r.exercise_id, r.manual_name, r.target_type, r.a, r.c, r.d, r.misses, r.time_sec, publish ? 1 : 0, actor.id, now);
      keep.add(Number(ins.lastInsertRowid));
      if (wasPublished) changes.push({ id: Number(ins.lastInsertRowid), added: true });
    }
  }
  for (const old of existing) if (!keep.has(old.id)) {
    db.prepare('DELETE FROM results WHERE id=?').run(old.id);
    if (old.published) changes.push({ id: old.id, removed: true });
  }
  if (feedback) {
    const fbChanged = fbRow && fbRow.published && fbRow.text !== feedback;
    db.prepare(`INSERT INTO feedback(training_id,user_id,text,published,author_id,updated_at) VALUES(?,?,?,?,?,?)
      ON CONFLICT(training_id,user_id) DO UPDATE SET text=excluded.text, published=excluded.published, author_id=excluded.author_id, updated_at=excluded.updated_at`)
      .run(t.id, uid, feedback, publish ? 1 : 0, actor.id, now);
    if (fbChanged) changes.push({ feedback: true });
  } else if (fbRow) {
    db.prepare('DELETE FROM feedback WHERE training_id=? AND user_id=?').run(t.id, uid);
  }
  if (changes.length) audit(actor.id, 'result_edit', `training:${t.id} user:${uid}`, changes);
  if (publish && !wasPublished && (recs.length || feedback)) {
    notify(uid, 'results_published', 'פורסמו תוצאות חדשות', `התוצאות והמשוב מהאימון "${t.title}" זמינים באזור האישי.`, t.id);
  }
});
app.put('/api/instructor/trainings/:id/members/:uid', roles('instructor'), wrap((req, res) => {
  const t = instructorTraining(req);
  const uid = idParam(req.params.uid);
  assertConfirmed(t.id, uid);
  if (['draft', 'cancelled'].includes(t.status)) throw new HttpError(409, 'לא ניתן להזין תוצאות באימון זה');
  saveSheet(t, uid, req.user, req.body || {});
  res.json(loadMemberSheet(t.id, uid));
}));

// ---------- calendar (.ics) ----------
const icsEsc = v => String(v ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsTime = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function icsFold(line) { // RFC 5545: lines are at most 75 octets, continuation lines start with a space
  const out = []; let cur = '', bytes = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch);
    if (bytes + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch; bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}
app.get('/api/trainings/:id/calendar.ics', needLogin, wrap((req, res) => {
  const t = db.prepare('SELECT * FROM trainings WHERE id=?').get(idParam(req.params.id));
  const mine = t && (db.prepare(`SELECT 1 FROM registrations WHERE training_id=? AND user_id=? AND status IN ('confirmed','offered','waitlist')`).get(t.id, req.user.id)
    || t.instructor_id === req.user.id || L.hasRole(req.user, 'admin'));
  if (!t || !mine) throw new HttpError(404, 'האימון לא נמצא');
  if (t.status === 'cancelled') throw new HttpError(409, 'האימון בוטל');
  const nav = navFor(t);
  const start = new Date(t.starts_at), end = new Date(start.getTime() + 2 * 3600e3); // trainings have no end time; 2h is a placeholder
  const alarm = (trigger, text) => ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(text), 'TRIGGER:' + trigger, 'END:VALARM'];
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Desert Falcon//IPSC Club//HE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:training-${t.id}@desert-falcon`, 'DTSTAMP:' + icsTime(new Date()), `SEQUENCE:${Math.floor(new Date(t.updated_at).getTime() / 60000)}`,
    'DTSTART:' + icsTime(start), 'DTEND:' + icsTime(end), 'SUMMARY:' + icsEsc(t.title), 'LOCATION:' + icsEsc(t.location + (nav.address ? ', ' + nav.address : '')),
    'DESCRIPTION:' + icsEsc('נץ המדבר. ' + (t.notes || '') + ' משך האימון בקירוב: שעתיים. ניווט: ' + nav.maps),
    ...alarm('-P1D', 'מחר: ' + t.title), ...alarm('-PT1H', 'בעוד שעה: ' + t.title), 'END:VEVENT', 'END:VCALENDAR'];
  res.set({ 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="training-${t.id}.ics"`, 'Cache-Control': 'private, no-store' });
  res.send(lines.map(icsFold).join('\r\n') + '\r\n');
}));

// publish every draft result sheet of a training in one step (the instructor's own training)
app.post('/api/instructor/trainings/:id/publish-drafts', roles('instructor'), wrap((req, res) => {
  const t = instructorTraining(req);
  if (['draft', 'cancelled'].includes(t.status)) throw new HttpError(409, 'לא ניתן לפרסם תוצאות באימון זה');
  const n = db.transaction(() => {
    const rows = db.prepare(`SELECT DISTINCT user_id FROM (
        SELECT user_id FROM results WHERE training_id=? AND published=0 UNION SELECT user_id FROM feedback WHERE training_id=? AND published=0)`).all(t.id, t.id);
    let count = 0;
    for (const { user_id } of rows) {
      if (!db.prepare(`SELECT 1 FROM registrations WHERE training_id=? AND user_id=? AND status='confirmed'`).get(t.id, user_id)) continue;
      db.prepare('UPDATE results SET published=1 WHERE training_id=? AND user_id=? AND published=0').run(t.id, user_id);
      db.prepare('UPDATE feedback SET published=1 WHERE training_id=? AND user_id=? AND published=0').run(t.id, user_id);
      notify(user_id, 'results_published', 'פורסמו תוצאות חדשות', `התוצאות והמשוב מהאימון "${t.title}" זמינים באזור האישי.`, t.id);
      count++;
    }
    if (count) audit(req.user.id, 'publish_drafts', `training:${t.id}`, { count });
    return count;
  })();
  res.json({ published: n });
}));

// ---------- exercise builder: optional plan of stages per training ----------
const LAYOUT_TYPES = new Set(['paper', 'noshoot', 'popper', 'wall', 'start']);
const MAX_STAGES = 20;
function parseLayout(v) {
  if (v === undefined || v === null) return { items: [] };
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch { throw bad('סכמת התרגיל לא תקינה'); } }
  if (!v || !Array.isArray(v.items)) throw bad('סכמת התרגיל לא תקינה');
  if (v.items.length > 60) throw bad('בסכמה אפשר עד 60 פריטים');
  const r1 = n => Math.round(n * 10) / 10;
  return { items: v.items.map(it => {
    if (!it || !LAYOUT_TYPES.has(it.t)) throw bad('סוג פריט לא תקין בסכמה');
    const rot = numIn(it.r === undefined ? 0 : it.r, -720, 720, 'סיבוב');
    return { t: it.t, x: r1(numIn(it.x, 0, 400, 'מיקום')), y: r1(numIn(it.y, 0, 300, 'מיקום')), r: ((Math.round(rot) % 360) + 360) % 360 };
  }) };
}
const stageOut = r => ({ id: r.id, training_id: r.training_id, position: r.position, name: r.name, description: r.description || '', exercise_id: r.exercise_id, exercise_name: r.exercise_name || null, layout: JSON.parse(r.layout) });
const stageRows = tid => db.prepare(`SELECT s.*, e.name exercise_name FROM stages s LEFT JOIN exercises e ON e.id=s.exercise_id WHERE s.training_id=? ORDER BY s.position, s.id`).all(tid).map(stageOut);
function stageBody(b) {
  const name = str(b.name, 2, 80, 'שם התרגיל');
  const description = optStr(b.description, 1500, 'תיאור');
  let exId = null;
  if (b.exercise_id !== undefined && b.exercise_id !== null && b.exercise_id !== '') {
    exId = intIn(b.exercise_id, 1, 1e9, 'תרגיל');
    if (!db.prepare('SELECT 1 FROM exercises WHERE id=? AND active=1').get(exId)) throw bad('התרגיל שנבחר אינו קיים במאגר');
  }
  return { name, description, exId, layout: JSON.stringify(parseLayout(b.layout)) };
}
function ownedStage(req) {
  const s = db.prepare('SELECT * FROM stages WHERE id=?').get(idParam(req.params.sid));
  if (!s) throw new HttpError(404, 'התרגיל לא נמצא');
  const t = T.getTraining(s.training_id);
  if (t.instructor_id !== req.user.id) throw new HttpError(403, 'האימון הזה אינו משויך אליך');
  if (t.status === 'cancelled') throw new HttpError(409, 'האימון בוטל');
  return { s, t };
}
app.get('/api/trainings/:id/stages', roles('member'), wrap((req, res) => {
  const t = T.getTraining(idParam(req.params.id));
  const mine = T.liveReg(t.id, req.user.id);
  if (t.status === 'draft' || (!mine && t.status !== 'open')) throw new HttpError(404, 'האימון לא נמצא');
  res.json({ items: stageRows(t.id) });
}));
app.get('/api/instructor/trainings/:id/stages', roles('instructor'), wrap((req, res) => {
  const t = instructorTraining(req);
  res.json({ items: stageRows(t.id) });
}));
app.post('/api/instructor/trainings/:id/stages', roles('instructor'), wrap((req, res) => {
  const t = instructorTraining(req);
  if (t.status === 'cancelled') throw new HttpError(409, 'האימון בוטל');
  if (db.prepare('SELECT COUNT(*) n FROM stages WHERE training_id=?').get(t.id).n >= MAX_STAGES) throw bad(`אפשר עד ${MAX_STAGES} תרגילים באימון`);
  const b = stageBody(req.body || {});
  const pos = db.prepare('SELECT COALESCE(MAX(position),0)+1 p FROM stages WHERE training_id=?').get(t.id).p;
  const now = nowIso();
  const id = Number(db.prepare(`INSERT INTO stages(training_id,position,name,description,exercise_id,layout,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(t.id, pos, b.name, b.description, b.exId, b.layout, req.user.id, now, now).lastInsertRowid);
  audit(req.user.id, 'stage_create', `training:${t.id} stage:${id}`, null);
  res.json({ stage: stageRows(t.id).find(x => x.id === id) });
}));
app.put('/api/instructor/stages/:sid', roles('instructor'), wrap((req, res) => {
  const { s, t } = ownedStage(req);
  const b = stageBody(req.body || {});
  db.prepare('UPDATE stages SET name=?, description=?, exercise_id=?, layout=?, updated_at=? WHERE id=?').run(b.name, b.description, b.exId, b.layout, nowIso(), s.id);
  audit(req.user.id, 'stage_edit', `training:${t.id} stage:${s.id}`, null);
  res.json({ stage: stageRows(t.id).find(x => x.id === s.id) });
}));
app.delete('/api/instructor/stages/:sid', roles('instructor'), wrap((req, res) => {
  const { s, t } = ownedStage(req);
  db.prepare('DELETE FROM stages WHERE id=?').run(s.id);
  audit(req.user.id, 'stage_delete', `training:${t.id} stage:${s.id}`, null);
  res.json({ ok: true });
}));
app.post('/api/instructor/stages/:sid/move', roles('instructor'), wrap((req, res) => {
  const { s, t } = ownedStage(req);
  const dir = req.body && req.body.dir;
  if (!['up', 'down'].includes(dir)) throw bad('כיוון לא תקין');
  const all = stageRows(t.id), i = all.findIndex(x => x.id === s.id), j = dir === 'up' ? i - 1 : i + 1;
  if (j >= 0 && j < all.length) {
    db.transaction(() => { const up = db.prepare('UPDATE stages SET position=? WHERE id=?'); up.run(j + 1, all[i].id); up.run(i + 1, all[j].id); })();
  }
  res.json({ items: stageRows(t.id) });
}));
app.post('/api/instructor/stages/:sid/copy', roles('instructor'), wrap((req, res) => {
  const { s } = ownedStage(req);
  const target = req.body && req.body.training_id ? T.getTraining(intIn(req.body.training_id, 1, 1e9, 'אימון')) : T.getTraining(s.training_id);
  if (target.instructor_id !== req.user.id) throw new HttpError(403, 'האימון הזה אינו משויך אליך');
  if (target.status === 'cancelled') throw new HttpError(409, 'האימון בוטל');
  if (db.prepare('SELECT COUNT(*) n FROM stages WHERE training_id=?').get(target.id).n >= MAX_STAGES) throw bad(`אפשר עד ${MAX_STAGES} תרגילים באימון`);
  const pos = db.prepare('SELECT COALESCE(MAX(position),0)+1 p FROM stages WHERE training_id=?').get(target.id).p;
  const now = nowIso();
  const id = Number(db.prepare(`INSERT INTO stages(training_id,position,name,description,exercise_id,layout,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(target.id, pos, s.name + (target.id === s.training_id ? ' (עותק)' : ''), s.description, s.exercise_id, s.layout, req.user.id, now, now).lastInsertRowid);
  res.json({ stage: stageRows(target.id).find(x => x.id === id) });
}));
// the instructor's other trainings, to copy a stage into
app.get('/api/instructor/trainings-lite', roles('instructor'), (req, res) => {
  res.json({ items: db.prepare(`SELECT id,title,starts_at FROM trainings WHERE instructor_id=? AND status<>'cancelled' ORDER BY starts_at DESC LIMIT 40`).all(req.user.id) });
});

app.get('/api/exercises', needLogin, (req, res) => {
  const all = L.hasRole(req.user, 'admin');
  res.json({ items: db.prepare(`SELECT id,name,description,active FROM exercises ${all ? '' : 'WHERE active=1'} ORDER BY name`).all() });
});

// ---------- admin ----------
const admin = roles('admin');

// inquiries
app.get('/api/admin/inquiries', admin, (req, res) => {
  const st = req.query.status;
  const rows = st && ['new', 'handled', 'approved', 'rejected'].includes(st)
    ? db.prepare('SELECT * FROM inquiries WHERE status=? ORDER BY id DESC LIMIT 300').all(st)
    : db.prepare('SELECT * FROM inquiries ORDER BY (status=\'new\') DESC, id DESC LIMIT 300').all();
  res.json({ items: rows });
});
app.patch('/api/admin/inquiries/:id', admin, wrap((req, res) => {
  const id = idParam(req.params.id);
  const inq = db.prepare('SELECT * FROM inquiries WHERE id=?').get(id);
  if (!inq) throw new HttpError(404, 'הפנייה לא נמצאה');
  const b = req.body || {};
  const status = b.status ?? inq.status;
  if (!['new', 'handled', 'rejected'].includes(status) && status !== inq.status) throw bad('סטטוס לא תקין');
  if (inq.status === 'approved' && status !== 'approved') throw bad('פנייה שאושרה לא ניתנת לשינוי');
  const note = b.note === undefined ? inq.note : optStr(b.note, 500, 'הערה');
  db.prepare('UPDATE inquiries SET status=?, note=?, handled_by=?, updated_at=? WHERE id=?').run(status, note, req.user.id, nowIso(), id);
  res.json({ ok: true });
}));
function tempPassword() {
  const al = 'abcdefghjkmnpqrstuvwxyz', dg = '23456789';
  const pick = s => s[crypto.randomInt(s.length)];
  let p = ''; for (let i = 0; i < 6; i++) p += pick(al);
  for (let i = 0; i < 3; i++) p += pick(dg);
  return p;
}
app.post('/api/admin/inquiries/:id/approve', admin, wrap((req, res) => {
  const id = idParam(req.params.id);
  const inq = db.prepare('SELECT * FROM inquiries WHERE id=?').get(id);
  if (!inq || inq.type !== 'join') throw new HttpError(404, 'בקשת הצטרפות לא נמצאה');
  if (inq.status === 'approved') throw new HttpError(409, 'הבקשה כבר אושרה');
  if (db.prepare('SELECT 1 FROM users WHERE phone=?').get(inq.phone)) throw new HttpError(409, 'כבר קיים חשבון עם מספר הטלפון הזה');
  const pw = tempPassword();
  const uid = db.transaction(() => {
    const u = createUser({ phone: inq.phone, name: inq.name, password: pw, role: 'member', mustChange: true });
    db.prepare(`UPDATE inquiries SET status='approved', user_id=?, handled_by=?, updated_at=? WHERE id=?`).run(u, req.user.id, nowIso(), id);
    audit(req.user.id, 'account_approved', `user:${u}`, { inquiry: id });
    return u;
  })();
  // The temporary password is shown once to the admin, who delivers it to the member.
  res.json({ user_id: uid, phone: inq.phone, temp_password: pw });
}));

// users
const adminUserOut = u => ({
  id: u.id, name: u.name, phone: u.phone, roles: L.rolesOf(u), is_super: !!u.is_super, status: u.status, membership: u.membership,
  birth_date: u.birth_date, shooter_no: u.shooter_no, classification: u.classification, has_photo: !!u.photo, created_at: u.created_at,
});
app.get('/api/admin/users', admin, (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 40) : '';
  const rows = q
    ? db.prepare(`SELECT * FROM users WHERE name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' ORDER BY name LIMIT 300`)
      .all(`%${q.replace(/[\\%_]/g, '\\$&')}%`, `%${q.replace(/[\\%_]/g, '\\$&')}%`)
    : db.prepare('SELECT * FROM users ORDER BY name LIMIT 500').all();
  res.json({ items: rows.map(adminUserOut) });
});
app.post('/api/admin/users', admin, wrap((req, res) => {
  const b = req.body || {};
  const phone = L.normalizePhone(b.phone);
  if (!phone) throw bad('מספר טלפון לא תקין');
  if (db.prepare('SELECT 1 FROM users WHERE phone=?').get(phone)) throw new HttpError(409, 'כבר קיים חשבון עם מספר הטלפון הזה');
  const roles = b.roles === undefined ? ['member'] : L.parseRoles(b.roles);
  const pw = tempPassword();
  const id = createUser({ phone, name: str(b.name, 2, 60, 'שם'), password: pw, roles, mustChange: true });
  audit(req.user.id, 'account_created', `user:${id}`, { roles });
  res.json({ user_id: id, phone, temp_password: pw });
}));
function lastActiveAdmin(excludeId) {
  return db.prepare(`SELECT COUNT(*) n FROM users WHERE (','||roles||',') LIKE '%,admin,%' AND status='active' AND id<>?`).get(excludeId).n === 0;
}
app.patch('/api/admin/users/:id', admin, wrap((req, res) => {
  const id = idParam(req.params.id);
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if (!u) throw new HttpError(404, 'המשתמש לא נמצא');
  const b = req.body || {};
  const next = { ...u };
  const log = {};
  if (b.name !== undefined) next.name = str(b.name, 2, 60, 'שם');
  if (b.phone !== undefined) {
    const p = L.normalizePhone(b.phone);
    if (!p) throw bad('מספר טלפון לא תקין');
    if (p !== u.phone && db.prepare('SELECT 1 FROM users WHERE phone=?').get(p)) throw new HttpError(409, 'מספר הטלפון כבר בשימוש');
    next.phone = p;
  }
  if (b.birth_date !== undefined) next.birth_date = L.dateOnly(b.birth_date, 'תאריך לידה');
  if (b.shooter_no !== undefined) next.shooter_no = optStr(b.shooter_no, 30, 'מספר יורה');
  if (b.classification !== undefined) next.classification = optStr(b.classification, 30, 'סיווג');
  // protected: the super-admin cannot be demoted, disabled or have membership removed through the normal UI
  const protectedSuper = !!u.is_super;
  if (b.roles !== undefined) {
    const nr = L.parseRoles(b.roles), cur = L.rolesOf(u);
    if (nr.join() !== cur.join()) {
      if (protectedSuper) throw new HttpError(403, 'חשבון מנהל־על מוגן משינוי הרשאות');
      if (cur.includes('admin') && !nr.includes('admin') && lastActiveAdmin(id)) throw new HttpError(409, 'לא ניתן להוריד את המנהל הפעיל האחרון');
      if (cur.includes('instructor') && !nr.includes('instructor') && db.prepare(`SELECT 1 FROM trainings WHERE instructor_id=? AND status IN ('draft','open','closed')`).get(id))
        throw new HttpError(409, 'המדריך משויך לאימונים פעילים. יש להחליף מדריך קודם');
      next.roles = nr.join(','); next.role = primaryRole(nr); log.roles = [cur, nr];
    }
  }
  if (b.membership !== undefined && b.membership !== u.membership) {
    if (!['active', 'inactive'].includes(b.membership)) throw bad('סטטוס חברות לא תקין');
    if (protectedSuper) throw new HttpError(403, 'חשבון מנהל־על מוגן');
    next.membership = b.membership; log.membership = [u.membership, b.membership];
  }
  if (b.status !== undefined && b.status !== u.status) {
    if (!['active', 'disabled'].includes(b.status)) throw bad('סטטוס חשבון לא תקין');
    if (protectedSuper) throw new HttpError(403, 'חשבון מנהל־על מוגן מהשבתה');
    if (b.status === 'disabled') {
      if (id === req.user.id) throw new HttpError(409, 'לא ניתן להשבית את החשבון שלך');
      if (L.hasRole(u, 'admin') && lastActiveAdmin(id)) throw new HttpError(409, 'לא ניתן להשבית את המנהל הפעיל האחרון');
    }
    next.status = b.status; log.status = [u.status, b.status];
  }
  db.transaction(() => {
    db.prepare(`UPDATE users SET name=?, phone=?, birth_date=?, shooter_no=?, classification=?, role=?, roles=?, membership=?, status=?, updated_at=? WHERE id=?`)
      .run(next.name, next.phone, next.birth_date, next.shooter_no, next.classification, next.role, next.roles, next.membership, next.status, nowIso(), id);
    if (next.status === 'disabled') killSessions(id); // disabling ends active sessions; history is kept
    if (next.phone !== u.phone) { log.phone = [u.phone, next.phone]; killSessions(id); }
    if (Object.keys(log).length) audit(req.user.id, 'user_update', `user:${id}`, log);
  })();
  res.json({ user: adminUserOut(db.prepare('SELECT * FROM users WHERE id=?').get(id)) });
}));
app.post('/api/admin/users/:id/reset-password', admin, wrap((req, res) => {
  const id = idParam(req.params.id);
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if (!u) throw new HttpError(404, 'המשתמש לא נמצא');
  if (u.is_super && u.id !== req.user.id) throw new HttpError(403, 'חשבון מנהל־על מוגן');
  const pw = tempPassword();
  db.transaction(() => {
    db.prepare('UPDATE users SET pass_hash=?, must_change_pw=1, updated_at=? WHERE id=?').run(hashPassword(pw), nowIso(), id);
    killSessions(id);
    db.prepare('DELETE FROM login_fail WHERE phone=?').run(u.phone);
    audit(req.user.id, 'password_reset', `user:${id}`, null);
  })();
  res.json({ temp_password: pw, phone: u.phone });
}));

app.get('/api/admin/dashboard', admin, (req, res) => {
  T.sweep();
  const now = nowIso(), week = new Date(Date.now() + 7 * 86400e3).toISOString();
  const one = (q, ...a) => db.prepare(q).get(...a).n;
  res.json({
    active_members: one(`SELECT COUNT(*) n FROM users WHERE (','||roles||',') LIKE '%,member,%' AND status='active' AND membership='active'`),
    new_inquiries: one(`SELECT COUNT(*) n FROM inquiries WHERE status='new'`),
    trainings_week: one(`SELECT COUNT(*) n FROM trainings WHERE status IN ('open','closed') AND starts_at BETWEEN ? AND ?`, now, week),
    latest: db.prepare(`SELECT id,type,name,phone,created_at FROM inquiries WHERE status='new' ORDER BY id DESC LIMIT 3`).all(),
    upcoming: db.prepare(`SELECT * FROM trainings WHERE status IN ('open','closed') AND starts_at > ? ORDER BY starts_at LIMIT 3`).all(now).map(adminTrainingOut),
  });
});

// trainings (admin)
const adminTrainingOut = t => ({
  ...trainingView(t, null), instructor_id: t.instructor_id, starts_local: L.utcToIsraelLocal(t.starts_at), registered: T.counts(t.id).confirmed,
});
app.get('/api/admin/trainings', admin, (req, res) => {
  T.sweep();
  res.json({ items: db.prepare('SELECT * FROM trainings ORDER BY starts_at DESC LIMIT 300').all().map(adminTrainingOut) });
});
app.get('/api/admin/instructors', admin, (req, res) => {
  res.json({ items: db.prepare(`SELECT id,name FROM users WHERE (','||roles||',') LIKE '%,instructor,%' AND status='active' ORDER BY name`).all() });
});
function parseTrainingBody(b, partial) {
  const out = {};
  if (!partial || b.title !== undefined) out.title = str(b.title, 2, 100, 'שם האימון');
  if (!partial || b.starts_local !== undefined) {
    out.starts_at = L.israelLocalToUtcIso(b.starts_local);
    if (!out.starts_at) throw bad('תאריך או שעה לא תקינים');
  }
  if (!partial || b.location !== undefined) out.location = str(b.location, 2, 150, 'מקום');
  if (!partial || b.instructor_id !== undefined) {
    out.instructor_id = idParam(b.instructor_id);
    const i = db.prepare(`SELECT 1 FROM users WHERE id=? AND (','||roles||',') LIKE '%,instructor,%' AND status='active'`).get(out.instructor_id);
    if (!i) throw bad('יש לבחור מדריך פעיל');
  }
  if (!partial || b.capacity !== undefined) out.capacity = intIn(b.capacity, 1, 500, 'קיבולת');
  if (!partial || b.notes !== undefined) out.notes = optStr(b.notes, 1000, 'הערות');
  return out;
}
app.post('/api/admin/trainings', admin, wrap((req, res) => {
  const v = parseTrainingBody(req.body || {}, false);
  if (new Date(v.starts_at).getTime() <= Date.now()) throw bad('לא ניתן ליצור אימון בעבר');
  const n = nowIso();
  const r = db.prepare(`INSERT INTO trainings(title,starts_at,location,instructor_id,capacity,notes,status,created_at,updated_at)
    VALUES(?,?,?,?,?,?, 'draft', ?,?)`).run(v.title, v.starts_at, v.location, v.instructor_id, v.capacity, v.notes, n, n);
  audit(req.user.id, 'training_create', `training:${r.lastInsertRowid}`, null);
  res.json({ training: adminTrainingOut(T.getTraining(Number(r.lastInsertRowid))) });
}));
app.patch('/api/admin/trainings/:id', admin, wrap((req, res) => {
  const id = idParam(req.params.id);
  const before = T.getTraining(id);
  if (['cancelled', 'done'].includes(before.status)) throw new HttpError(409, 'לא ניתן לערוך אימון שבוטל או הסתיים');
  const v = parseTrainingBody(req.body || {}, true);
  const after = { ...before, ...v };
  db.transaction(() => {
    const c = T.counts(id);
    if (after.capacity < c.confirmed + c.offered) throw new HttpError(409, 'הקיבולת קטנה ממספר הרשומים. יש לבטל הרשמות קודם');
    if (after.starts_at !== before.starts_at && new Date(after.starts_at).getTime() <= Date.now()) throw bad('לא ניתן להעביר אימון לעבר');
    db.prepare(`UPDATE trainings SET title=?, starts_at=?, location=?, instructor_id=?, capacity=?, notes=?, updated_at=? WHERE id=?`)
      .run(after.title, after.starts_at, after.location, after.instructor_id, after.capacity, after.notes, nowIso(), id);
    const sent = T.notifyChange(id, before, after);
    if (after.capacity > before.capacity) T.promote(id);
    if (sent) audit(req.user.id, 'training_change_notified', `training:${id}`, { recipients: sent });
  })();
  res.json({ training: adminTrainingOut(T.getTraining(id)) });
}));
app.post('/api/admin/trainings/:id/status', admin, wrap((req, res) => {
  const id = idParam(req.params.id);
  const action = req.body && req.body.action;
  const t = T.getTraining(id);
  const allowed = { open: ['draft', 'closed'], close: ['open'], done: ['open', 'closed'], cancel: ['draft', 'open', 'closed'] };
  if (!allowed[action]) throw bad('פעולה לא תקינה');
  if (!allowed[action].includes(t.status)) throw new HttpError(409, 'הפעולה אינה אפשרית במצב הנוכחי של האימון');
  if (action === 'open') {
    if (new Date(t.starts_at).getTime() <= Date.now()) throw new HttpError(409, 'לא ניתן לפתוח להרשמה אימון שמועדו עבר');
    db.prepare(`UPDATE trainings SET status='open', updated_at=? WHERE id=?`).run(nowIso(), id);
    T.promote(id);
  } else if (action === 'close') {
    db.prepare(`UPDATE trainings SET status='closed', updated_at=? WHERE id=?`).run(nowIso(), id);
  } else if (action === 'done') {
    db.prepare(`UPDATE trainings SET status='done', updated_at=? WHERE id=?`).run(nowIso(), id);
  } else {
    const n = T.cancelTraining(id);
    audit(req.user.id, 'training_cancel', `training:${id}`, { notified: n });
  }
  res.json({ training: adminTrainingOut(T.getTraining(id)) });
}));

// attendance report + Excel (same data source for both)
const REG_LABEL = { confirmed: 'רשום', waitlist: 'ברשימת המתנה', offered: 'הוצע מקום', cancelled: 'ביטל הרשמה', declined: 'דחה הצעה', expired: 'ההצעה פגה' };
const ATT_LABEL = { present: 'הגיע', absent: 'לא הגיע' };
function buildReport(t) {
  const rows = db.prepare(`SELECT g.*, u.name, u.phone, a.status att FROM registrations g JOIN users u ON u.id=g.user_id
    LEFT JOIN attendance a ON a.training_id=g.training_id AND a.user_id=g.user_id
    WHERE g.training_id=? ORDER BY u.name, g.id`).all(t.id);
  const byUser = new Map(); // one row per member: the live registration, else the latest
  for (const r of rows) {
    const cur = byUser.get(r.user_id);
    const live = ['confirmed', 'waitlist', 'offered'].includes(r.status);
    if (!cur || live || (!['confirmed', 'waitlist', 'offered'].includes(cur.status) && r.id > cur.id)) byUser.set(r.user_id, r);
  }
  return [...byUser.values()].map(r => ({
    name: r.name, phone: r.phone,
    registration: r.status === 'cancelled' && r.cancelled_by === 'training' ? 'האימון בוטל' : REG_LABEL[r.status],
    attendance: ATT_LABEL[r.att] || 'טרם סומן',
  }));
}
app.get('/api/admin/trainings/:id/report', admin, wrap((req, res) => {
  const t = T.getTraining(idParam(req.params.id));
  res.json({ training: adminTrainingOut(t), rows: buildReport(t) });
}));
app.get('/api/admin/trainings/:id/report.xlsx', admin, wrap(async (req, res) => {
  const t = T.getTraining(idParam(req.params.id));
  const rows = buildReport(t);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('דוח אימון', { views: [{ rightToLeft: true }] });
  ws.addRow([L.xlSafe(t.title)]).font = { bold: true, size: 14 };
  ws.addRow([L.fmtIsrael(t.starts_at)]);
  ws.addRow([L.xlSafe(t.location)]);
  ws.addRow([]);
  const head = ws.addRow(['שם', 'טלפון', 'מצב הרשמה', 'מצב נוכחות']);
  head.font = { bold: true };
  for (const r of rows) ws.addRow([L.xlSafe(r.name), r.phone, r.registration, r.attendance]);
  ws.columns = [{ width: 28 }, { width: 16 }, { width: 20 }, { width: 16 }];
  ws.getColumn(2).numFmt = '@';
  const buf = await wb.xlsx.writeBuffer();
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="training-${t.id}-report.xlsx"`,
  });
  res.send(Buffer.from(buf));
}));

// exercise library
app.post('/api/admin/exercises', admin, wrap((req, res) => {
  const name = str(req.body && req.body.name, 2, 80, 'שם התרגיל');
  if (db.prepare('SELECT 1 FROM exercises WHERE name=?').get(name)) throw new HttpError(409, 'תרגיל בשם הזה כבר קיים');
  const r = db.prepare('INSERT INTO exercises(name,description) VALUES(?,?)').run(name, optStr(req.body.description, 500, 'תיאור'));
  res.json({ id: Number(r.lastInsertRowid) });
}));
app.patch('/api/admin/exercises/:id', admin, wrap((req, res) => {
  const id = idParam(req.params.id);
  const e = db.prepare('SELECT * FROM exercises WHERE id=?').get(id);
  if (!e) throw new HttpError(404, 'התרגיל לא נמצא');
  const b = req.body || {};
  const name = b.name !== undefined ? str(b.name, 2, 80, 'שם התרגיל') : e.name;
  if (name !== e.name && db.prepare('SELECT 1 FROM exercises WHERE name=?').get(name)) throw new HttpError(409, 'תרגיל בשם הזה כבר קיים');
  db.prepare('UPDATE exercises SET name=?, description=?, active=? WHERE id=?')
    .run(name, b.description !== undefined ? optStr(b.description, 500, 'תיאור') : e.description, b.active === undefined ? e.active : (b.active ? 1 : 0), id);
  res.json({ ok: true }); // the id is stable, so history keeps comparing even after a rename
}));

// news
const NEWS_CATS = ['club', 'israel', 'world'];
app.get('/api/admin/news', admin, (req, res) => res.json({ items: db.prepare('SELECT * FROM news ORDER BY id DESC').all() }));
app.post('/api/admin/news', admin, wrap((req, res) => {
  const b = req.body || {};
  db.prepare('INSERT INTO news(title,body,category,published,created_at) VALUES(?,?,?,?,?)').run(str(b.title, 2, 120, 'כותרת'), str(b.body, 2, 5000, 'תוכן'), NEWS_CATS.includes(b.category) ? b.category : 'club', b.published === false ? 0 : 1, nowIso());
  res.json({ ok: true });
}));
app.patch('/api/admin/news/:id', admin, wrap((req, res) => {
  const id = idParam(req.params.id);
  const n = db.prepare('SELECT * FROM news WHERE id=?').get(id);
  if (!n) throw new HttpError(404, 'הידיעה לא נמצאה');
  const b = req.body || {};
  db.prepare('UPDATE news SET title=?, body=?, category=?, published=? WHERE id=?').run(
    b.title !== undefined ? str(b.title, 2, 120, 'כותרת') : n.title, b.body !== undefined ? str(b.body, 2, 5000, 'תוכן') : n.body,
    NEWS_CATS.includes(b.category) ? b.category : n.category, b.published === undefined ? n.published : (b.published ? 1 : 0), id);
  res.json({ ok: true });
}));
app.delete('/api/admin/news/:id', admin, wrap((req, res) => {
  db.prepare('DELETE FROM news WHERE id=?').run(idParam(req.params.id));
  res.json({ ok: true });
}));

// settings + audit
app.get('/api/admin/settings', admin, (req, res) => res.json({ settings: allSettings() }));
app.put('/api/admin/settings', admin, wrap((req, res) => {
  const b = req.body || {};
  const out = {};
  for (const k of Object.keys(SETTING_DEFAULTS)) {
    if (b[k] === undefined) continue;
    if (k === 'cancel_deadline_hours') out[k] = String(intIn(b[k], 0, 168, 'מועד אחרון לביטול'));
    else if (k === 'offer_hours') out[k] = String(intIn(b[k], 1, 72, 'זמן לאישור מקום'));
    else if (k === 'location_name') out[k] = str(b[k], 2, 100, 'שם המקום');
    else if (k === 'location_address') out[k] = optStr(b[k], 150, 'כתובת') || '';
    else out[k] = L.safeUrl(b[k], k);
  }
  db.transaction(() => { for (const [k, v] of Object.entries(out)) setSetting(k, v); audit(req.user.id, 'settings_update', null, out); })();
  res.json({ settings: allSettings() });
}));
app.get('/api/admin/audit', admin, (req, res) => {
  res.json({ items: db.prepare(`SELECT a.*, u.name actor FROM audit a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 200`).all() });
});

// ---------- static + errors ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'לא נמצא' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: '5m', setHeaders: (res, file) => { if (/[\\/]sw\.js$/.test(file)) res.set('Cache-Control', 'no-cache'); } }));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'הקובץ גדול מדי' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'בקשה לא תקינה' });
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'הפעולה כבר בוצעה' });
  console.error(err);
  res.status(500).json({ error: 'שגיאה בשרת' });
});

// expire waitlist offers periodically (also swept lazily on every relevant request)
setInterval(() => { try { T.sweep(); T.remind(); } catch (e) { console.error('sweep failed', e); } }, 20000).unref();
T.sweep();

module.exports = app;
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const n = db.prepare('SELECT COUNT(*) n FROM users').get().n;
  if (!n) {
    if (process.env.DF_ADMIN_PHONE && process.env.DF_ADMIN_PASSWORD) {
      try {
        const phone = L.normalizePhone(process.env.DF_ADMIN_PHONE);
        const name = process.env.DF_ADMIN_NAME || 'מנהל המועדון';
        const password = process.env.DF_ADMIN_PASSWORD;
        if (phone && L.passwordOk(password)) {
          const id = createUser({ phone, name, password, role: 'admin', isSuper: true });
          audit(id, 'super_admin_created', `user:${id}`, null);
          console.log('Initial super-admin automatically created from environment:', phone);
        }
      } catch (e) {
        console.error('Failed to auto-create admin from environment:', e);
      }
    } else {
      console.log('No users yet. Create the first super-admin:  npm run init-admin -- 0501234567 "Name" "Password1"');
    }
  }
  app.listen(port, host, () => console.log(`Desert Falcon on http://${host}:${port}`));
}
