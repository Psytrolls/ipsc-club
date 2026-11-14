'use strict';
// Registration, capacity and waitlist rules. Everything that changes seats runs inside a
// transaction (better-sqlite3 serialises writers), so two members taking the last seat can
// never both succeed — and a partial unique index backs that up at the DB level.
const { db, nowIso, notify, getSetting } = require('./db');
const { HttpError, fmtIsrael, hasRole } = require('./lib');

const LIVE = ['confirmed', 'waitlist', 'offered'];

function getTraining(id) {
  const t = db.prepare('SELECT * FROM trainings WHERE id=?').get(id);
  if (!t) throw new HttpError(404, 'האימון לא נמצא');
  return t;
}

function counts(trainingId) {
  const r = db.prepare(`SELECT
      SUM(status='confirmed') confirmed, SUM(status='offered') offered, SUM(status='waitlist') waitlist
      FROM registrations WHERE training_id=?`).get(trainingId);
  return { confirmed: r.confirmed || 0, offered: r.offered || 0, waitlist: r.waitlist || 0 };
}

// Seats that are taken or temporarily held for a waitlist offer.
const taken = c => c.confirmed + c.offered;

function offerDeadline(t) {
  const hours = Number(getSetting('offer_hours')) || 12;
  const byPolicy = Date.now() + hours * 3600e3;
  const byStart = new Date(t.starts_at).getTime();
  return new Date(Math.min(byPolicy, byStart)).toISOString();
}

// Give free seats to the first people in the waitlist queue (by join time).
// No new offers once registration is closed / training is cancelled / already started.
const promote = db.transaction((trainingId) => {
  const t = getTraining(trainingId);
  if (t.status !== 'open' || new Date(t.starts_at).getTime() <= Date.now()) return;
  let c = counts(trainingId);
  while (taken(c) < t.capacity) {
    const next = db.prepare(`SELECT * FROM registrations WHERE training_id=? AND status='waitlist'
      ORDER BY waitlist_at, id LIMIT 1`).get(trainingId);
    if (!next) break; // nobody waiting: seat returns to regular registration
    const exp = offerDeadline(t);
    db.prepare(`UPDATE registrations SET status='offered', offer_expires_at=?, updated_at=? WHERE id=?`)
      .run(exp, nowIso(), next.id);
    notify(next.user_id, 'waitlist_offer', 'התפנה מקום באימון',
      `התפנה מקום באימון "${t.title}" (${fmtIsrael(t.starts_at)}). יש לאשר עד ${fmtIsrael(exp)}, אחרת המקום יוצע לבא בתור.`, t.id);
    c = counts(trainingId);
  }
});

// Expire stale offers, pass them to the next in line.
const sweep = db.transaction(() => {
  const stale = db.prepare(`SELECT * FROM registrations WHERE status='offered' AND offer_expires_at <= ?`).all(nowIso());
  const touched = new Set();
  for (const r of stale) {
    db.prepare(`UPDATE registrations SET status='expired', updated_at=? WHERE id=? AND status='offered'`).run(nowIso(), r.id);
    const t = db.prepare('SELECT title FROM trainings WHERE id=?').get(r.training_id);
    notify(r.user_id, 'offer_expired', 'ההצעה למקום פגה',
      `לא אישרת בזמן את המקום באימון "${t.title}". המקום הוצע לבא בתור.`, r.training_id);
    touched.add(r.training_id);
  }
  for (const id of touched) promote(id);
  return touched.size;
});

function assertMemberCanRegister(user) {
  if (!hasRole(user, 'member')) throw new HttpError(403, 'ההרשמה פתוחה לחברים בלבד');
  if (user.membership !== 'active') throw new HttpError(403, 'החברות שלך אינה פעילה. יש לפנות להנהלת המועדון');
}
function assertRegistrationOpen(t) {
  if (t.status !== 'open') throw new HttpError(409, 'ההרשמה לאימון אינה פתוחה');
  if (new Date(t.starts_at).getTime() <= Date.now()) throw new HttpError(409, 'האימון כבר התחיל');
}
const liveReg = (tid, uid) => db.prepare(
  `SELECT * FROM registrations WHERE training_id=? AND user_id=? AND status IN ('confirmed','waitlist','offered')`).get(tid, uid);

const register = db.transaction((trainingId, user) => {
  assertMemberCanRegister(user);
  const t = getTraining(trainingId);
  assertRegistrationOpen(t);
  if (liveReg(trainingId, user.id)) throw new HttpError(409, 'כבר קיימת לך הרשמה לאימון הזה');
  if (taken(counts(trainingId)) >= t.capacity) throw new HttpError(409, 'האימון מלא. אפשר להצטרף לרשימת ההמתנה', 'full');
  const n = nowIso();
  db.prepare(`INSERT INTO registrations(training_id,user_id,status,created_at,updated_at) VALUES(?,?,'confirmed',?,?)`)
    .run(trainingId, user.id, n, n);
});

const joinWaitlist = db.transaction((trainingId, user) => {
  assertMemberCanRegister(user);
  const t = getTraining(trainingId);
  assertRegistrationOpen(t);
  if (liveReg(trainingId, user.id)) throw new HttpError(409, 'כבר קיימת לך הרשמה או המתנה לאימון הזה');
  if (taken(counts(trainingId)) < t.capacity) throw new HttpError(409, 'יש מקום פנוי באימון. אפשר להירשם ישירות', 'not_full');
  const n = nowIso();
  db.prepare(`INSERT INTO registrations(training_id,user_id,status,waitlist_at,created_at,updated_at) VALUES(?,?,'waitlist',?,?,?)`)
    .run(trainingId, user.id, n, n, n);
});

const leaveWaitlist = db.transaction((trainingId, user) => {
  const r = liveReg(trainingId, user.id);
  if (!r || r.status !== 'waitlist') throw new HttpError(409, 'אינך ברשימת המתנה לאימון הזה');
  db.prepare(`UPDATE registrations SET status='cancelled', cancelled_by='member', updated_at=? WHERE id=?`).run(nowIso(), r.id);
});

const cancelRegistration = db.transaction((trainingId, user) => {
  const r = liveReg(trainingId, user.id);
  if (!r || r.status !== 'confirmed') throw new HttpError(409, 'אין לך הרשמה מאושרת לאימון הזה');
  const t = getTraining(trainingId);
  const hours = Number(getSetting('cancel_deadline_hours')) || 0;
  if (new Date(t.starts_at).getTime() - hours * 3600e3 <= Date.now()) {
    throw new HttpError(409, `ניתן לבטל הרשמה עד ${hours} שעות לפני האימון. לביטול מאוחר יש לפנות למדריך`, 'too_late');
  }
  db.prepare(`UPDATE registrations SET status='cancelled', cancelled_by='member', updated_at=? WHERE id=?`).run(nowIso(), r.id);
  promote(trainingId);
});

const acceptOffer = db.transaction((trainingId, user) => {
  const r = liveReg(trainingId, user.id);
  if (!r || r.status !== 'offered') throw new HttpError(409, 'אין לך הצעה פעילה לאימון הזה, או שהיא פגה');
  if (new Date(r.offer_expires_at).getTime() <= Date.now()) throw new HttpError(409, 'ההצעה פגה');
  // idempotent against double-clicks: the WHERE clause only matches an 'offered' row once
  const res = db.prepare(`UPDATE registrations SET status='confirmed', offer_expires_at=NULL, updated_at=?
    WHERE id=? AND status='offered'`).run(nowIso(), r.id);
  if (res.changes !== 1) throw new HttpError(409, 'ההצעה כבר טופלה');
});

const declineOffer = db.transaction((trainingId, user) => {
  const r = liveReg(trainingId, user.id);
  if (!r || r.status !== 'offered') throw new HttpError(409, 'אין לך הצעה פעילה לאימון הזה');
  db.prepare(`UPDATE registrations SET status='declined', updated_at=? WHERE id=?`).run(nowIso(), r.id);
  promote(trainingId);
});

// Admin cancels the whole training: all live registrations and offers are cancelled and notified.
const cancelTraining = db.transaction((trainingId) => {
  const t = getTraining(trainingId);
  const live = db.prepare(`SELECT * FROM registrations WHERE training_id=? AND status IN ('confirmed','waitlist','offered')`).all(trainingId);
  db.prepare(`UPDATE trainings SET status='cancelled', updated_at=? WHERE id=?`).run(nowIso(), trainingId);
  db.prepare(`UPDATE registrations SET status='cancelled', cancelled_by='training', offer_expires_at=NULL, updated_at=?
    WHERE training_id=? AND status IN ('confirmed','waitlist','offered')`).run(nowIso(), trainingId);
  for (const r of live) {
    notify(r.user_id, 'training_cancelled', 'האימון בוטל',
      `האימון "${t.title}" שהיה מתוכנן ל־${fmtIsrael(t.starts_at)} ב${t.location} בוטל.`, trainingId);
  }
  return live.length;
});

function notifyChange(trainingId, before, after) {
  const live = db.prepare(`SELECT user_id FROM registrations WHERE training_id=? AND status IN ('confirmed','waitlist','offered')`).all(trainingId);
  const lines = [];
  if (before.starts_at !== after.starts_at) lines.push(`מועד חדש: ${fmtIsrael(after.starts_at)} (במקום ${fmtIsrael(before.starts_at)})`);
  if (before.location !== after.location) lines.push(`מקום חדש: ${after.location} (במקום ${before.location})`);
  if (!lines.length) return 0;
  for (const r of live) {
    notify(r.user_id, 'training_changed', 'עדכון באימון',
      `האימון "${after.title}" עודכן. ${lines.join('. ')}.`, trainingId);
  }
  return live.length;
}

// Expired offers are swept (and committed) BEFORE an action runs, so a rejected action
// (e.g. accepting an expired offer) cannot roll the expiry back.
const sweeping = fn => (...args) => { sweep(); return fn(...args); };

module.exports = {
  LIVE, getTraining, counts, taken, promote, sweep, liveReg, cancelTraining, notifyChange,
  register: sweeping(register), joinWaitlist: sweeping(joinWaitlist), leaveWaitlist: sweeping(leaveWaitlist),
  cancelRegistration: sweeping(cancelRegistration), acceptOffer: sweeping(acceptOffer), declineOffer: sweeping(declineOffer),
};
