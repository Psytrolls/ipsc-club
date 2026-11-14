// Small DOM helpers. Text is ALWAYS inserted as text nodes, never as HTML (no XSS surface).
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, kids);
  return el;
}
export function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return el;
}
// replaceChildren() would render null/false as the text "null"/"false"; filter them like h() does.
const nativeReplace = Element.prototype.replaceChildren;
Element.prototype.replaceChildren = function (...kids) {
  return nativeReplace.apply(this, kids.flat(Infinity).filter(k => k != null && k !== false));
};
const SVG_NS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs, ...kids) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, String(v));
  append(el, kids);
  return el;
}

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}
export async function api(method, url, body) {
  const opts = { method, headers: { 'x-df': '1' }, credentials: 'same-origin' };
  if (body !== undefined) { opts.headers['content-type'] = 'application/json'; opts.body = JSON.stringify(body); }
  let r;
  try { r = await fetch(url, opts); } catch { throw new ApiError('אין חיבור לשרת. בדקו את החיבור ונסו שוב', 0); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(data.error || 'אירעה שגיאה', r.status, data.code);
  return data;
}
export async function uploadPhoto(file) {
  const r = await fetch('/api/me/photo', { method: 'PUT', headers: { 'x-df': '1', 'content-type': file.type }, body: file, credentials: 'same-origin' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(data.error || 'העלאת התמונה נכשלה', r.status);
  return data;
}

export function toast(msg, bad = false) {
  const t = h('div', { class: 'toast' + (bad ? ' bad' : ''), role: bad ? 'alert' : 'status' }, msg);
  document.getElementById('toasts').append(t);
  setTimeout(() => t.remove(), bad ? 6000 : 3500);
}

const dtf = new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const dtfYear = new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'long', year: 'numeric' });
const dtfFull = new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', dateStyle: 'medium', timeStyle: 'short' });
export const fmtDateTime = iso => dtf.format(new Date(iso));
export const fmtDay = iso => dtfYear.format(new Date(iso));
export const fmtFull = iso => dtfFull.format(new Date(iso));

export const TRAINING_STATUS = { draft: 'טיוטה', open: 'פתוח להרשמה', closed: 'ההרשמה סגורה', cancelled: 'בוטל', done: 'התקיים' };
export const MY_STATUS = { confirmed: 'רשום', waitlist: 'ברשימת המתנה', offered: 'הוצע לך מקום', cancelled: 'ההרשמה בוטלה', declined: 'דחית הצעה', expired: 'ההצעה פגה' };
export const ROLE = { member: 'חבר', instructor: 'מדריך', admin: 'מנהל' };
export const rolesLabel = rs => rs.map(r => ROLE[r]).join(' · ');
export const TARGET = { paper: 'נייר', steel: 'מתכת', popper: 'פופר', mixed: 'משולב' };

export function normalizePhone(raw) {
  let d = String(raw || '').replace(/[\s\-().]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (!/^\d+$/.test(d)) return null;
  if (d.startsWith('972')) d = '0' + d.slice(3);
  return /^05\d{8}$/.test(d) ? d : null;
}

let uid = 0;
// Labelled field with an inline error slot (aria-describedby wired up)
export function field(label, input, { hint, error, icon } = {}) {
  const id = input.id || (input.id = 'f' + ++uid);
  const wrap = h('div', { class: 'field' });
  const lab = h('label', { for: id }, label);
  wrap.append(lab);
  if (icon) { const box = h('div', { class: 'ctl has-ico' }, input, icon); wrap.append(box); } else wrap.append(input);
  const desc = [];
  if (hint) { const p = h('p', { class: 'hint', id: id + '-h' }, hint); wrap.append(p); desc.push(p.id); }
  const e = h('p', { class: 'err', id: id + '-e', role: 'alert', hidden: true });
  wrap.append(e); desc.push(e.id);
  input.setAttribute('aria-describedby', desc.join(' '));
  wrap.setError = msg => {
    e.textContent = msg || ''; e.hidden = !msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  };
  return wrap;
}
export function formAlert() {
  const el = h('div', { class: 'alert err', role: 'alert', hidden: true });
  el.show = m => { el.textContent = m; el.hidden = !m; if (m) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  return el;
}

export function dialog(build) {
  return new Promise(resolve => {
    const d = h('dialog');
    const close = v => { d.close(); d.remove(); resolve(v); };
    build(d, close);
    d.addEventListener('cancel', e => { e.preventDefault(); close(false); });
    document.body.append(d);
    d.showModal();
  });
}
export const confirmDialog = (title, msg, { ok = 'אישור', danger = false } = {}) => dialog((d, close) => {
  d.append(h('h3', null, title), h('p', null, msg),
    h('div', { class: 'row' },
      h('button', { class: 'btn ghost', type: 'button', onclick: () => close(false) }, 'חזרה'),
      h('button', { class: 'btn' + (danger ? ' danger' : ''), type: 'button', onclick: () => close(true) }, ok)));
  d.querySelector('.btn.ghost').focus();
});
export const secretDialog = (title, intro, secret) => dialog((d, close) => {
  d.append(h('h3', null, title), h('p', null, intro), h('div', { class: 'secret' }, secret),
    h('p', { class: 'small muted gap' }, 'הסיסמה מוצגת פעם אחת בלבד. יש למסור אותה לחבר בצורה בטוחה; בכניסה הראשונה תידרש החלפת סיסמה.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn ghost', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(secret); toast('הועתק'); } catch { toast('לא ניתן להעתיק אוטומטית', true); } } }, 'העתקה'),
      h('button', { class: 'btn', type: 'button', onclick: () => close(true) }, 'סגירה')));
});

// Disable a button while an async action runs (prevents double submit)
export async function busy(btn, fn) {
  if (btn.disabled) return;
  btn.disabled = true;
  try { return await fn(); } finally { btn.disabled = false; }
}

export const initial = name => (name || '?').trim().slice(0, 1);
export function avatar(user, big = false) {
  const cls = 'avatar' + (big ? ' lg' : '');
  if (user.photo || user.has_photo) {
    const img = h('img', { class: cls, alt: '', src: `/api/photos/${user.id}?v=${user.photo || ''}`, loading: 'lazy' });
    img.addEventListener('error', () => img.replaceWith(h('span', { class: cls, 'aria-hidden': 'true' }, initial(user.name))));
    return img;
  }
  return h('span', { class: cls, 'aria-hidden': 'true' }, initial(user.name));
}
