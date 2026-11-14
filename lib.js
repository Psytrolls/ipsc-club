'use strict';
// Helpers: validation, phone normalisation, Israel time conversion.

class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
const bad = (msg, code) => new HttpError(400, msg, code);

// Phone is the username. Stored as 05XXXXXXXX.
function normalizePhone(raw) {
  if (typeof raw !== 'string') return null;
  let d = raw.replace(/[\s\-().]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (!/^\d+$/.test(d)) return null;
  if (d.startsWith('972')) d = '0' + d.slice(3);
  return /^05\d{8}$/.test(d) ? d : null;
}

// Password policy lives in ONE place: the club has not approved the final policy yet.
// Previous requirement: at least six alphanumeric characters.
const PASSWORD_POLICY = { minLength: 6, message: 'הסיסמה חייבת להכיל לפחות 6 תווים, כולל אות ומספר' };
function passwordOk(p) {
  return typeof p === 'string' && p.length >= PASSWORD_POLICY.minLength && p.length <= 100 &&
    /[A-Za-zא-ת]/.test(p) && /\d/.test(p);
}

function str(v, min, max, label) {
  if (typeof v !== 'string') throw bad(`${label}: ערך לא תקין`);
  const s = v.trim();
  if (s.length < min) throw bad(min === 1 ? `${label}: שדה חובה` : `${label}: קצר מדי`);
  if (s.length > max) throw bad(`${label}: ארוך מדי`);
  return s;
}
function optStr(v, max, label) {
  if (v === undefined || v === null || v === '') return null;
  return str(v, 0, max, label) || null;
}
function intIn(v, min, max, label) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) throw bad(`${label}: מספר שלם בין ${min} ל־${max}`);
  return n;
}
function numIn(v, min, max, label) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) throw bad(`${label}: ערך בין ${min} ל־${max}`);
  return n;
}
function idParam(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw bad('מזהה לא תקין');
  return n;
}
function dateOnly(v, label) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw bad(`${label}: תאריך לא תקין`);
  const d = new Date(v + 'T00:00:00Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) throw bad(`${label}: תאריך לא תקין`);
  if (v > new Date().toISOString().slice(0, 10) || v < '1900-01-01') throw bad(`${label}: תאריך לא הגיוני`);
  return v;
}
function safeUrl(v, label) {
  if (v === undefined || v === null || String(v).trim() === '') return '';
  const s = String(v).trim();
  if (s.length > 300) throw bad(`${label}: קישור ארוך מדי`);
  let u;
  try { u = new URL(s); } catch { throw bad(`${label}: קישור לא תקין`); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw bad(`${label}: הקישור חייב להתחיל ב־https://`);
  return u.toString();
}

// ---- Asia/Jerusalem time ----
const TZ = 'Asia/Jerusalem';
const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});
function tzOffsetMs(utcMs) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(utcMs)).map(x => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}
function utcToIsraelLocal(iso) {
  const ms = new Date(iso).getTime();
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
// "YYYY-MM-DDTHH:mm" entered as Israel local time -> UTC ISO string (null if invalid/non-existent)
function israelLocalToUtcIso(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s || '');
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let utc = guess - tzOffsetMs(guess);
  utc = guess - tzOffsetMs(utc);
  if (utcToIsraelLocal(new Date(utc).toISOString()) !== s) return null;
  return new Date(utc).toISOString();
}
function fmtIsrael(iso) {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

// Spreadsheet formula-injection guard for Excel export
function xlSafe(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

const ALL_ROLES = ['member', 'instructor', 'admin'];
const rolesOf = u => String(u.roles || u.role || '').split(',').filter(Boolean);
const hasRole = (u, r) => rolesOf(u).includes(r);
function parseRoles(v) {
  if (!Array.isArray(v) || !v.length || v.some(r => !ALL_ROLES.includes(r))) throw bad('יש לבחור לפחות תפקיד אחד תקין');
  return ALL_ROLES.filter(r => v.includes(r)); // canonical order, no duplicates
}

module.exports = {
  rolesOf, hasRole, parseRoles, ALL_ROLES,
  HttpError, bad, normalizePhone, passwordOk, PASSWORD_POLICY, str, optStr, intIn, numIn, idParam, dateOnly, safeUrl,
  israelLocalToUtcIso, utcToIsraelLocal, fmtIsrael, xlSafe,
};
