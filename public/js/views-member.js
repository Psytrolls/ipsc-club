import { h, s, api, field, formAlert, busy, toast, fmtDateTime, fmtDay, fmtFull, TRAINING_STATUS, MY_STATUS, TARGET, avatar, uploadPhoto } from './util.js';
import { icon } from './icons.js';
import { state, go, homeFor } from './state.js';
import { targetBox, hitsFor, countdown } from './live.js';

const statusChip = t => {
  if (t.mine) {
    const m = t.mine.status;
    const cls = m === 'confirmed' ? 'ok' : (m === 'offered' ? 'warn' : (m === 'waitlist' ? 'warn' : 'bad'));
    const label = t.status === 'cancelled' ? 'האימון בוטל' : MY_STATUS[m];
    return h('span', { class: 'chip ' + cls }, label + (m === 'waitlist' && t.mine.waitlist_position ? ` · מקום ${t.mine.waitlist_position}` : ''));
  }
  return null;
};
export function seatsBar(t) {
  const pct = n => Math.min(100, Math.round(n / t.capacity * 100)) + '%';
  const bar = h('div', { class: 'seats', role: 'img', 'aria-label': `${t.seats_taken} מתוך ${t.capacity} מקומות תפוסים` });
  const a = h('i'), b = h('i', { class: 'held' });
  a.style.width = pct(t.seats_taken); b.style.width = pct(t.seats_held);
  bar.append(a, b);
  return bar;
}
export const trainingCard = (t, href) => h('a', { class: 'item link', href: '#' + href },
  h('div', { class: 'row' }, h('h3', { class: 'grow' }, t.title), statusChip(t) || h('span', { class: 'chip' }, TRAINING_STATUS[t.status])),
  h('div', { class: 'meta' }, h('span', null, fmtDateTime(t.starts_at)), h('span', null, t.location), t.instructor ? h('span', null, 'מדריך: ' + t.instructor) : null),
  seatsBar(t),
  h('div', { class: 'meta' }, h('span', null, t.seats_free > 0 ? `${t.seats_free} מקומות פנויים מתוך ${t.capacity}` : 'האימון מלא'),
    t.waitlist_count ? h('span', null, `${t.waitlist_count} ברשימת המתנה`) : null));

const subtabs = cur => h('nav', { class: 'tabrow', 'aria-label': 'אימונים' },
  h('a', { href: '#/m/trainings', 'aria-current': cur === 'upcoming' ? 'page' : null }, 'אימונים קרובים'),
  h('a', { href: '#/m/mine', 'aria-current': cur === 'mine' ? 'page' : null }, 'ההרשמות שלי'));

export async function trainings() {
  const { items } = await api('GET', '/api/trainings');
  const un = state.unread;
  return h('div', { class: 'wrap' }, h('div', { class: 'page-head' }, h('h1', null, 'אימונים')), subtabs('upcoming'),
    un ? h('div', { class: 'alert info' }, `יש לך ${un} הודעות חדשות. `, h('a', { href: '#/notifications' }, 'לצפייה בהודעות')) : null,
    state.user.membership !== 'active' ? h('div', { class: 'alert err' }, 'החברות שלך אינה פעילה כרגע, ולכן לא ניתן להירשם לאימונים. יש לפנות להנהלת המועדון.') : null,
    items.length ? h('div', { class: 'list' }, items.map(t => trainingCard(t, '/m/training/' + t.id))) : h('p', { class: 'muted' }, 'אין כרגע אימונים פתוחים להרשמה. כדאי לבדוק שוב בקרוב.'));
}

function trainingActions(t, rerender) {
  const act = async (btn, path, okMsg) => busy(btn, async () => {
    try { const r = await api('POST', `/api/trainings/${t.id}/${path}`); toast(okMsg); rerender(r.training); }
    catch (e) { toast(e.message, true); try { rerender((await api('GET', '/api/trainings/' + t.id)).training); } catch { /* ignore */ } }
  });
  const btn = (label, path, msg, cls = '') => { const b = h('button', { class: 'btn ' + cls, type: 'button' }, label); b.onclick = () => act(b, path, msg); return b; };
  const m = t.mine;
  const box = h('div', { class: 'card', 'aria-live': 'polite' });
  if (t.status === 'cancelled') box.append(h('div', { class: 'alert err' }, 'האימון בוטל.'));
  else if (t.status === 'done') box.append(h('p', null, 'האימון התקיים.'));
  else if (!m || ['cancelled', 'declined', 'expired'].includes(m.status)) {
    if (m && m.status === 'expired') box.append(h('div', { class: 'alert info' }, 'ההצעה למקום פגה בזמן.'));
    if (t.status !== 'open') box.append(h('p', null, 'ההרשמה לאימון סגורה.'));
    else if (t.seats_free > 0) box.append(h('p', null, `יש ${t.seats_free} מקומות פנויים.`), btn('הרשמה לאימון', 'register', 'נרשמת לאימון'));
    else box.append(h('p', null, 'האימון מלא. אפשר להצטרף לרשימת ההמתנה, וכשיתפנה מקום תקבלו הודעה.'), btn('הצטרפות לרשימת המתנה', 'waitlist/join', 'נוספת לרשימת ההמתנה', 'dark'));
  } else if (m.status === 'confirmed') {
    box.append(h('div', { class: 'alert ok' }, 'אתם רשומים לאימון הזה.'));
    box.append(m.can_cancel ? btn('ביטול הרשמה', 'cancel', 'ההרשמה בוטלה', 'ghost')
      : h('p', { class: 'small muted' }, `ביטול עצמי אפשרי עד ${t.cancel_deadline_hours} שעות לפני האימון. לביטול מאוחר יותר יש לפנות למדריך.`));
  } else if (m.status === 'waitlist') {
    box.append(h('div', { class: 'alert info' }, `אתם ברשימת ההמתנה (מקום ${m.waitlist_position}). נשלח אליכם עדכון כשיתפנה מקום.`), btn('יציאה מרשימת ההמתנה', 'waitlist/leave', 'יצאת מרשימת ההמתנה', 'ghost'));
  } else if (m.status === 'offered') {
    box.append(h('div', { class: 'alert info' }, h('strong', null, 'התפנה מקום! '), `יש לאשר עד ${fmtFull(m.offer_expires_at)}. אחרת המקום יוצע לבא בתור.`),
      h('div', { class: 'row' }, btn('אישור המקום', 'offer/accept', 'המקום אושר'), btn('לא מעוניין', 'offer/decline', 'ההצעה נדחתה', 'ghost')));
  }
  return box;
}

export async function trainingDetail({ params }) {
  const wrap = h('div', { class: 'wrap' });
  const draw = t => {
    wrap.replaceChildren(
      h('p', { class: 'gap' }, h('a', { href: '#/m/trainings' }, '→ חזרה לאימונים')),
      h('div', { class: 'page-head' }, h('h1', null, t.title), statusChip(t) || h('span', { class: 'chip' }, TRAINING_STATUS[t.status])),
      h('div', { class: 'card' }, h('dl', { class: 'grid two' },
        dt('מועד', fmtDateTime(t.starts_at)), dt('מקום', t.location), dt('מדריך', t.instructor || '—'),
        dt('מקומות', `${t.seats_taken} תפוסים מתוך ${t.capacity}` + (t.seats_held ? ` · ${t.seats_held} שמורים להצעה` : '')),
        t.notes ? dt('הערות', t.notes) : null), seatsBar(t)),
      h('div', { class: 'gap' }), trainingActions(t, draw));
  };
  draw((await api('GET', '/api/trainings/' + params.id)).training);
  return wrap;
}
const dt = (k, v) => h('div', null, h('dt', { class: 'small muted' }, k), h('dd', { class: 'dd' }, v));

export async function mine() {
  const { items } = await api('GET', '/api/me/registrations');
  const active = items.filter(t => t.mine && ['confirmed', 'waitlist', 'offered'].includes(t.mine.status) && !['cancelled'].includes(t.status));
  const other = items.filter(t => !active.includes(t));
  return h('div', { class: 'wrap' }, h('div', { class: 'page-head' }, h('h1', null, 'אימונים')), subtabs('mine'),
    h('h2', null, 'פעילות'), active.length ? h('div', { class: 'list' }, active.map(t => trainingCard(t, '/m/training/' + t.id))) : h('p', { class: 'muted' }, 'אין הרשמות פעילות.'),
    other.length ? [h('h2', { class: 'gap2' }, 'בוטלו ועדכונים'), h('div', { class: 'list' }, other.map(t => trainingCard(t, '/m/training/' + t.id)))] : null);
}

// ---------- results + progress ----------
const METRICS = { time_sec: 'זמן (שניות)', misses: 'החטאות', a: 'פגיעות A', c: 'פגיעות C', d: 'פגיעות D' };
export function lineChart(points, metric) {
  const W = 420, H = 300, P = { l: 44, r: 30, t: 24, b: 48 };
  const svg = s('svg', { class: 'chart', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `גרף ${METRICS[metric]} לפי תאריך אימון` });
  const xs = points.map(p => new Date(p.starts_at).getTime());
  const vals = points.map(p => p[metric]);
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x0 === x1) { x0 -= 3 * 864e5; x1 += 3 * 864e5; } // single measurement: centre it
  let y0 = Math.min(0, ...vals), y1 = Math.max(...vals);
  if (y1 === y0) y1 = y0 + 1;
  const pad = (y1 - y0) * .1; y1 += pad;
  const xr = t => P.l + (t - x0) / (x1 - x0) * (W - P.l - P.r); // time runs left to right (numeric axis convention)
  const Y = v => H - P.b - (v - y0) / (y1 - y0) * (H - P.t - P.b);
  for (let i = 0; i <= 4; i++) {
    const v = y0 + (y1 - y0) * i / 4, y = Y(v);
    svg.append(s('line', { class: 'grid', x1: P.l, x2: W - P.r, y1: y, y2: y }), s('text', { x: P.l - 8, y: y + 4, 'text-anchor': 'end' }, (Math.round(v * 10) / 10).toString()));
  }
  svg.append(s('line', { class: 'axis', x1: P.l, x2: W - P.r, y1: H - P.b, y2: H - P.b }));
  const fmt = new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric', year: '2-digit' });
  const seen = new Set();
  points.forEach((p, i) => {
    const t = xs[i], key = fmt.format(t);
    if (seen.has(key) || (points.length > 6 && i % Math.ceil(points.length / 6))) return;
    seen.add(key);
    svg.append(s('text', { x: xr(t), y: H - P.b + 20, 'text-anchor': 'middle' }, key));
  });
  svg.append(s('text', { x: P.l, y: 12, 'text-anchor': 'start' }, METRICS[metric]));
  if (points.length > 1) svg.append(s('polygon', { class: 'area', points: `${xr(xs[0])},${Y(Math.max(y0, 0))} ` + points.map((p, i) => `${xr(xs[i])},${Y(vals[i])}`).join(' ') + ` ${xr(xs[xs.length - 1])},${Y(Math.max(y0, 0))}` }));
  if (points.length > 1) svg.append(s('polyline', { class: 'line', pathLength: 1, points: points.map((p, i) => `${xr(xs[i])},${Y(vals[i])}`).join(' ') }));
  points.forEach((p, i) => svg.append(s('circle', { class: 'dot', cx: xr(xs[i]), cy: Y(vals[i]), r: 6 }, s('title', null, `${fmtDay(p.starts_at)}: ${vals[i]}`))));
  return svg;
}

// Exercise + metric pickers, chart and per-date results/feedback. Used on the dashboard and on the progress page.
async function progressBlock({ withDetails }) {
  const { items: exs } = await api('GET', '/api/me/exercises');
  if (!exs.length) return h('p', { class: 'muted' }, 'עדיין אין תוצאות מפורסמות מתרגילי המאגר.');
  const chartBox = h('div');
  const details = h('div', { class: 'gap' });
  const sel = h('select', { name: 'exercise', 'aria-label': 'תרגיל' }, exs.map(e => h('option', { value: e.id }, `${e.name} (${e.n})`)));
  const met = h('select', { name: 'metric', 'aria-label': 'מדד' }, Object.entries(METRICS).map(([k, v]) => h('option', { value: k }, v)));
  let data = null;
  const draw = () => {
    if (!data) return;
    const { points, feedback } = data;
    if (!points.length) { chartBox.replaceChildren(h('p', { class: 'muted' }, 'אין עדיין תוצאות מפורסמות לתרגיל הזה.')); details.replaceChildren(); return; }
    chartBox.replaceChildren(lineChart(points, met.value), points.length === 1 ? h('p', { class: 'small muted' }, 'קיימת מדידה אחת בלבד. עם עוד אימונים ייווצר קו התקדמות.') : null);
    if (!withDetails) return;
    const byTraining = new Map();
    points.forEach(p => { (byTraining.get(p.training_id) || byTraining.set(p.training_id, { date: p.starts_at, pts: [] }).get(p.training_id)).pts.push(p); });
    details.replaceChildren(h('h2', null, 'תוצאות ומשוב לפי תאריך'), h('ul', { class: 'timeline' },
      [...byTraining.entries()].reverse().map(([tid, g]) => {
        const fb = feedback.find(f => f.training_id === tid);
        return h('li', null, h('strong', null, fmtDay(g.date)),
          g.pts.map(p => h('div', null, `זמן ${p.time_sec} ש׳ · A ${p.a} · C ${p.c} · D ${p.d} · החטאות ${p.misses}`)),
          fb ? h('div', { class: 'muted' }, 'משוב המדריך: ' + fb.text) : null);
      })));
  };
  const load = async () => { data = await api('GET', '/api/me/progress?exercise_id=' + sel.value); draw(); };
  sel.onchange = () => load().catch(e => toast(e.message, true)); met.onchange = draw;
  await load();
  return h('div', null, h('div', { class: 'progress-head' }, sel, met), chartBox, details);
}

export async function results() {
  const [{ items: hist }, block] = await Promise.all([api('GET', '/api/me/results'), progressBlock({ withDetails: true })]);
  return h('div', { class: 'wrap' }, h('div', { class: 'page-head' }, h('h1', null, 'התקדמות')),
    h('section', { class: 'card' }, h('h2', { class: 'section-title' }, icon('trend'), 'ההתקדמות שלי'), block),
    h('section', { class: 'gap2' }, h('h2', null, 'היסטוריית אימונים'), hist.length ? h('div', { class: 'list' }, hist.map(g =>
      h('article', { class: 'item' }, h('h3', null, g.title), h('div', { class: 'meta' }, fmtDay(g.starts_at)),
        g.results.length ? h('div', { class: 'table-wrap' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['תרגיל', 'מטרה', 'זמן', 'A', 'C', 'D', 'החטאות'].map(x => h('th', { scope: 'col' }, x)))),
          h('tbody', null, g.results.map(r => h('tr', null, h('td', null, r.name, r.manual ? h('span', { class: 'chip' }, 'ידני') : null), h('td', null, TARGET[r.target_type]), h('td', null, r.time_sec), h('td', null, r.a), h('td', null, r.c), h('td', null, r.d), h('td', null, r.misses)))))) : null,
        g.feedback ? h('div', { class: 'alert info' }, h('strong', null, 'משוב המדריך: '), g.feedback) : null))) : h('p', { class: 'muted' }, 'עדיין אין תוצאות מפורסמות.')));
}

export async function dashboard() {
  const u = state.user;
  const [stats, regs, hist, block] = await Promise.all([api('GET', '/api/me/stats'), api('GET', '/api/me/registrations'), api('GET', '/api/me/results'), progressBlock({ withDetails: false })]);
  const next = regs.items.find(t => t.mine && ['confirmed', 'offered'].includes(t.mine.status) && t.status !== 'cancelled' && new Date(t.starts_at).getTime() > Date.now() - 3 * 3600e3);
  const lastFb = hist.items.find(g => g.feedback);
  const latest = hist.items.flatMap(g => g.results.map(r => ({ ...r, date: g.starts_at, title: g.title }))).slice(0, 3);
  const tile = (ic, n, label) => h('div', { class: 'tile' }, icon(ic), h('b', null, n), h('span', null, label));
  return h('div', { class: 'wrap' },
    h('div', { class: 'hello' }, h('h1', null, 'האזור האישי שלי'), h('p', null, 'שלום, ' + u.name.split(' ')[0])),
    h('section', { class: 'card gap' }, h('div', { class: 'profile-card' }, avatar({ id: u.id, name: u.name, has_photo: !!u.photo, photo: u.photo }, true),
      h('div', { class: 'grow' }, h('h2', null, u.name),
        h('div', null, h('span', { class: 'chip ' + (u.membership === 'active' ? 'ok' : 'warn') }, u.membership === 'active' ? 'חבר מועדון פעיל' : 'חברות לא פעילה')),
        h('div', { class: 'muted small gap' }, u.shooter_no ? 'מספר יורה: ' + u.shooter_no : 'מספר יורה: —', u.classification ? ' · ' + u.classification : '')),
    ), h('a', { class: 'btn ghost sm gap', href: '#/profile' }, icon('pencil'), 'עריכת פרופיל')),
    h('section', { class: 'grid tiles gap' }, tile('calendar', stats.attended, 'אימונים שהשתתפתי'), tile('target', stats.alpha_pct == null ? '—' : stats.alpha_pct + '%', 'דיוק אלפא'), tile('chart', stats.results, 'תוצאות שפורסמו')),
    latest[0] ? liveTarget(latest[0]) : null,
    h('section', { class: 'card gap' }, h('h2', { class: 'section-title' }, icon('trend'), 'ההתקדמות שלי'), block),
    h('div', { class: 'grid two gap' },
      h('section', { class: 'card' }, h('h3', { class: 'section-title' }, icon('calendar'), 'האימון הבא'),
        next ? h('div', { class: 'next-card' }, countdown(next.starts_at), h('div', { class: 'when' }, fmtDateTime(next.starts_at)), h('div', null, next.title),
          h('div', { class: 'meta muted' }, icon('pin'), next.location), statusLine(next), h('a', { class: 'btn block', href: '#/m/training/' + next.id }, 'פרטי האימון', icon('left')))
          : h('div', { class: 'next-card' }, h('p', { class: 'muted' }, 'אין לך אימון קרוב.'), h('a', { class: 'btn block', href: '#/m/trainings' }, 'הרשמה לאימון', icon('left')))),
      h('section', { class: 'card' }, h('h3', { class: 'section-title' }, icon('chat'), 'דגשים מהמדריך'),
        lastFb ? h('div', { class: 'quote' }, h('p', null, lastFb.feedback), h('span', { class: 'small muted' }, lastFb.title + ' · ' + fmtDay(lastFb.starts_at))) : h('p', { class: 'muted' }, 'עדיין אין משוב מפורסם.'))),
    h('section', { class: 'card gap' }, h('h3', { class: 'section-title' }, icon('doc'), 'תוצאות אחרונות'),
      latest.length ? h('div', { class: 'list' }, latest.map(r => h('a', { class: 'result-row', href: '#/m/results', style: null }, icon('chart'), h('span', { class: 'grow' }, `${r.name} · ${r.time_sec} ש׳`), h('span', { class: 'muted small' }, fmtDay(r.date)), icon('left'))))
        : h('p', { class: 'muted' }, 'עדיין אין תוצאות.')));
}
function liveTarget(r) {
  const chip = (z, n) => h('div', { class: 'sim-stat z' + z }, h('b', null, n), h('span', null, z));
  return h('section', { class: 'card gap live-target' }, h('h2', { class: 'section-title' }, icon('target'), 'התוצאה האחרונה שלי'),
    h('div', { class: 'lt-grid' }, targetBox(hitsFor(r), { animate: true, label: `מטרה עם ${r.a} פגיעות A, ${r.c} פגיעות C, ${r.d} פגיעות D` }),
      h('div', { class: 'lt-info' }, h('p', { class: 'muted small' }, `${r.name} · ${fmtDay(r.date)}`),
        h('div', null, h('span', { class: 'sim-label' }, 'זמן (שניות)'), h('div', { class: 'sim-time', dir: 'ltr' }, String(r.time_sec))),
        h('div', { class: 'sim-stats' }, chip('A', r.a), chip('C', r.c), chip('D', r.d)),
        h('p', { class: 'small muted' }, `החטאות: ${r.misses}`))));
}
const statusLine = t => t.mine.status === 'offered' ? h('div', { class: 'chip warn' }, 'יש לאשר את המקום שהוצע לך') : h('div', { class: 'chip ok' }, icon('check'), 'נרשמת');

// ---------- profile / password / notifications ----------
export function profile() {
  const u = state.user;
  const alert = formAlert();
  const name = h('input', { type: 'text', value: u.name, maxlength: 60, required: true, autocomplete: 'name' });
  const birth = h('input', { type: 'date', value: u.birth_date || '', max: new Date().toISOString().slice(0, 10) });
  const shooter = h('input', { type: 'text', value: u.shooter_no || '', maxlength: 30, dir: 'ltr' });
  const fName = field('שם', name);
  const submit = h('button', { class: 'btn', type: 'submit' }, 'שמירה');
  const photoBox = h('div', { class: 'row' });
  const drawPhoto = () => photoBox.replaceChildren(avatar(state.user, true),
    h('div', null, h('label', { class: 'btn ghost sm', for: 'photo-in' }, 'החלפת תמונה'),
      state.user.photo ? h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await api('DELETE', '/api/me/photo'); state.user.photo = null; drawPhoto(); toast('התמונה הוסרה'); } }, 'הסרה') : null,
      h('p', { class: 'small muted' }, 'JPG, PNG או WebP, עד 2MB. התמונה פרטית ונראית רק לך, למדריך שלך ולמנהל.')));
  const fileIn = h('input', { id: 'photo-in', type: 'file', accept: 'image/jpeg,image/png,image/webp', class: 'hp', onchange: async () => {
    const f = fileIn.files[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast('התמונה גדולה מ־2MB', true);
    try { const r = await uploadPhoto(f); state.user = r.user; drawPhoto(); toast('התמונה עודכנה'); } catch (e) { toast(e.message, true); }
    fileIn.value = '';
  } });
  drawPhoto();
  const form = h('form', { class: 'form', novalidate: true, onsubmit: async e => {
    e.preventDefault(); alert.show('');
    if (name.value.trim().length < 2) { fName.setError('יש להזין שם'); return; } fName.setError('');
    await busy(submit, async () => {
      try { const r = await api('PUT', '/api/me/profile', { name: name.value, birth_date: birth.value || null, shooter_no: shooter.value || null }); state.user = r.user; window.dispatchEvent(new Event('df:session')); toast('הפרופיל נשמר'); }
      catch (err) { alert.show(err.message); }
    });
  } }, alert, fName,
  field('טלפון (שם משתמש)', h('input', { type: 'text', value: u.phone, dir: 'ltr', readonly: true }), { hint: 'שינוי מספר טלפון מתבצע דרך מנהל המועדון' }),
  field('תאריך לידה', birth), field('מספר יורה', shooter),
  field('סיווג', h('input', { type: 'text', value: u.classification || '—', readonly: true }), { hint: 'הסיווג מעודכן על ידי הנהלת המועדון' }), submit);
  return h('div', { class: 'wrap' }, h('div', { class: 'page-head' }, h('h1', null, 'הפרופיל שלי')), photoBox, fileIn, h('div', { class: 'gap' }), form,
    h('p', { class: 'gap2' }, h('a', { class: 'btn ghost', href: '#/password' }, 'החלפת סיסמה')));
}

export function password() {
  const forced = state.user.must_change_pw;
  const alert = formAlert();
  const cur = h('input', { type: 'password', autocomplete: 'current-password', required: true });
  const nw = h('input', { type: 'password', autocomplete: 'new-password', required: true });
  const nw2 = h('input', { type: 'password', autocomplete: 'new-password', required: true });
  const f1 = field('סיסמה נוכחית', cur), f2 = field('סיסמה חדשה', nw, { hint: 'לפחות 6 תווים, כולל אות ומספר' }), f3 = field('אימות סיסמה חדשה', nw2);
  const submit = h('button', { class: 'btn', type: 'submit' }, 'החלפת סיסמה');
  return h('div', { class: 'wrap' }, h('div', { class: 'page-head' }, h('h1', null, 'החלפת סיסמה')),
    forced ? h('div', { class: 'alert info' }, 'זו כניסה ראשונה או שהסיסמה אופסה. יש לבחור סיסמה חדשה כדי להמשיך.') : null,
    h('form', { class: 'form', novalidate: true, onsubmit: async e => {
      e.preventDefault(); alert.show('');
      f1.setError(cur.value ? '' : 'יש להזין את הסיסמה הנוכחית');
      const okPw = nw.value.length >= 6 && /\d/.test(nw.value) && /[A-Za-zא-ת]/.test(nw.value);
      f2.setError(okPw ? '' : 'הסיסמה חייבת להכיל לפחות 6 תווים, כולל אות ומספר');
      f3.setError(nw.value === nw2.value ? '' : 'הסיסמאות אינן זהות');
      if (!cur.value || !okPw || nw.value !== nw2.value) return;
      await busy(submit, async () => {
        try { await api('POST', '/api/auth/change-password', { current: cur.value, next: nw.value }); state.user.must_change_pw = false; toast('הסיסמה הוחלפה'); window.dispatchEvent(new Event('df:session')); go(homeFor(state.user)); }
        catch (err) { alert.show(err.message); }
      });
    } }, alert, f1, f2, f3, submit));
}

export async function notifications() {
  const { items } = await api('GET', '/api/notifications');
  await api('POST', '/api/notifications/read', {});
  state.unread = 0; window.dispatchEvent(new Event('df:unread'));
  return h('div', { class: 'wrap' }, h('div', { class: 'page-head' }, h('h1', null, 'הודעות')),
    items.length ? h('ul', { class: 'list' }, items.map(n => h('li', { class: 'item' },
      h('div', { class: 'row' }, h('h3', { class: 'grow' }, n.title), !n.read_at ? h('span', { class: 'chip dark' }, 'חדש') : null),
      h('p', null, n.body), h('div', { class: 'meta' }, fmtFull(n.created_at)),
      n.training_id && state.user.roles.includes('member') ? h('a', { href: '#/m/training/' + n.training_id }, 'לפרטי האימון') : null)))
      : h('p', { class: 'muted' }, 'אין הודעות.'));
}
