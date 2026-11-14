import { h, api, field, formAlert, busy, toast, confirmDialog, secretDialog, dialog, fmtDateTime, fmtFull, fmtDay, TRAINING_STATUS, ROLE, rolesLabel } from './util.js';
import { state, go } from './state.js';
import { icon } from './icons.js';

function roleChecks(current, disabled = false) {
  const boxes = Object.entries(ROLE).map(([k, v]) => ({ k, i: h('input', { type: 'checkbox', value: k, checked: current.includes(k), disabled })}));
  const el = h('div', { class: 'checks', role: 'group', id: 'rolechecks' }, boxes.map(({ k, i }) => h('label', { class: 'check' }, i, ROLE[k])));
  el.value = () => boxes.filter(b => b.i.checked).map(b => b.k);
  return el;
}
const head = (t, extra) => h('div', { class: 'page-head row' }, h('h1', { class: 'grow' }, t), extra);
const INQ_STATUS = { new: 'חדשה', handled: 'טופלה', approved: 'אושרה', rejected: 'נדחתה' };

// ---------- inquiries ----------
export async function inquiries({ query }) {
  const filter = query.get('status') || '';
  const { items } = await api('GET', '/api/admin/inquiries' + (filter ? '?status=' + filter : ''));
  const sel = h('select', { 'aria-label': 'סינון לפי סטטוס', onchange: e => go('/a/inquiries' + (e.target.value ? '?status=' + e.target.value : '')) },
    h('option', { value: '' }, 'הכול'), Object.entries(INQ_STATUS).map(([k, v]) => h('option', { value: k, selected: k === filter }, v)));
  const list = h('ul', { class: 'list' });
  const reload = () => go('/a/inquiries' + (filter ? '?status=' + filter : '') + '#r' + Date.now()); // force re-render
  items.forEach(i => {
    const note = h('input', { type: 'text', value: i.note || '', maxlength: 500, placeholder: 'הערה פנימית', 'aria-label': 'הערה פנימית' });
    const patch = async (status, btn) => busy(btn, async () => {
      try { await api('PATCH', '/api/admin/inquiries/' + i.id, { status, note: note.value }); toast('עודכן'); window.dispatchEvent(new Event('hashchange')); } catch (e) { toast(e.message, true); }
    });
    const mkBtn = (label, status, cls = 'ghost sm') => { const b = h('button', { class: 'btn ' + cls, type: 'button' }, label); b.onclick = () => patch(status, b); return b; };
    const approve = h('button', { class: 'btn sm', type: 'button' }, 'אישור וחשבון חדש');
    approve.onclick = async () => {
      if (!(await confirmDialog('אישור בקשת הצטרפות', `ייפתח חשבון חבר עבור ${i.name} (${i.phone}).`, { ok: 'אישור ופתיחת חשבון' }))) return;
      await busy(approve, async () => {
        try { const r = await api('POST', `/api/admin/inquiries/${i.id}/approve`); await secretDialog('החשבון נפתח', `סיסמה זמנית עבור ${r.phone}:`, r.temp_password); window.dispatchEvent(new Event('hashchange')); }
        catch (e) { toast(e.message, true); }
      });
    };
    list.append(h('li', { class: 'item' },
      h('div', { class: 'row' }, h('h3', { class: 'grow' }, i.name), h('span', { class: 'chip ' + (i.status === 'new' ? 'warn' : i.status === 'approved' ? 'ok' : i.status === 'rejected' ? 'bad' : '') }, INQ_STATUS[i.status]),
        h('span', { class: 'chip dark' }, i.type === 'join' ? 'בקשת הצטרפות' : 'פרטי קורס')),
      h('div', { class: 'meta' }, h('a', { href: 'tel:' + i.phone, dir: 'ltr' }, i.phone), h('span', null, fmtFull(i.created_at)), i.previous_course ? h('span', null, 'קורס קודם: ' + i.previous_course) : null),
      i.status === 'approved' ? null : h('div', { class: 'row' }, h('div', { class: 'grow' }, note),
        i.type === 'join' && i.status !== 'rejected' ? approve : null, i.status !== 'handled' ? mkBtn('סימון כטופלה', 'handled') : null,
        i.status !== 'rejected' ? mkBtn('דחייה', 'rejected') : null, i.status !== 'new' ? mkBtn('החזרה לחדשות', 'new') : null)));
  });
  void reload;
  return h('div', { class: 'wrap' }, head('פניות', field('סטטוס', sel)), items.length ? list : h('p', { class: 'muted' }, 'אין פניות.'));
}

// ---------- members ----------
export async function members({ query }) {
  const q = query.get('q') || '';
  const { items } = await api('GET', '/api/admin/users' + (q ? '?q=' + encodeURIComponent(q) : ''));
  const search = h('input', { type: 'search', value: q, placeholder: 'חיפוש לפי שם או טלפון', 'aria-label': 'חיפוש' });
  const form = h('form', { class: 'row', onsubmit: e => { e.preventDefault(); go('/a/members' + (search.value ? '?q=' + encodeURIComponent(search.value) : '')); } },
    h('div', { class: 'grow' }, search), h('button', { class: 'btn', type: 'submit' }, 'חיפוש'), h('a', { class: 'btn dark', href: '#/a/members/new' }, '+ חשבון חדש'));
  return h('div', { class: 'wrap' }, head('חברים והרשאות'), form, h('div', { class: 'gap' }),
    h('ul', { class: 'list' }, items.map(u => h('li', null, h('a', { class: 'item link', href: '#/a/members/' + u.id },
      h('div', { class: 'row' }, h('h3', { class: 'grow' }, u.name), u.roles.map(r => h('span', { class: 'chip dark' }, ROLE[r])),
        u.is_super ? h('span', { class: 'chip warn' }, 'מנהל־על') : null, u.status === 'disabled' ? h('span', { class: 'chip bad' }, 'מושבת') : null,
        u.roles.includes('member') && u.membership === 'inactive' ? h('span', { class: 'chip' }, 'חברות לא פעילה') : null),
      h('div', { class: 'meta' }, h('span', { dir: 'ltr' }, u.phone), u.shooter_no ? h('span', null, 'יורה: ' + u.shooter_no) : null, u.classification ? h('span', null, 'סיווג: ' + u.classification) : null))))));
}

export async function memberEdit({ params }) {
  const isNew = params.id === 'new';
  const alert = formAlert();
  if (isNew) {
    const name = h('input', { type: 'text', maxlength: 60, required: true }), phone = h('input', { type: 'tel', dir: 'ltr', required: true });
    const roleBox = roleChecks(['member']);
    const submit = h('button', { class: 'btn', type: 'submit' }, 'יצירת חשבון');
    return h('div', { class: 'wrap' }, head('חשבון חדש'), h('form', { class: 'form', onsubmit: async e => {
      e.preventDefault(); alert.show('');
      await busy(submit, async () => {
        try { const r = await api('POST', '/api/admin/users', { name: name.value, phone: phone.value, roles: roleBox.value() }); await secretDialog('החשבון נוצר', `סיסמה זמנית עבור ${r.phone}:`, r.temp_password); go('/a/members/' + r.user_id); }
        catch (err) { alert.show(err.message); }
      });
    } }, alert, field('שם', name), field('טלפון', phone), field('תפקידים', roleBox, { hint: 'אפשר לשלב: למשל מדריך שהוא גם חבר' }), submit));
  }
  const { items } = await api('GET', '/api/admin/users');
  const u = items.find(x => String(x.id) === params.id);
  if (!u) return h('div', { class: 'wrap' }, h('p', { class: 'alert err' }, 'המשתמש לא נמצא'));
  const mk = (v, o = {}) => h('input', { type: 'text', value: v || '', ...o });
  const name = mk(u.name, { maxlength: 60 }), phone = mk(u.phone, { dir: 'ltr' }), birth = h('input', { type: 'date', value: u.birth_date || '' });
  const shooter = mk(u.shooter_no, { maxlength: 30, dir: 'ltr' }), cls = mk(u.classification, { maxlength: 30 });
  const opts = (map, cur) => Object.entries(map).map(([k, v]) => h('option', { value: k, selected: k === cur }, v));
  const roleBox = roleChecks(u.roles, u.is_super);
  const mem = h('select', { disabled: u.is_super }, opts({ active: 'פעילה', inactive: 'לא פעילה' }, u.membership));
  const st = h('select', { disabled: u.is_super }, opts({ active: 'פעיל', disabled: 'מושבת' }, u.status));
  const submit = h('button', { class: 'btn', type: 'submit' }, 'שמירה');
  const reset = h('button', { class: 'btn ghost', type: 'button' }, 'איפוס סיסמה');
  reset.onclick = async () => {
    if (!(await confirmDialog('איפוס סיסמה', `תיווצר סיסמה זמנית עבור ${u.name}, וההפעלות הפעילות שלו יסתיימו.`, { ok: 'איפוס' }))) return;
    await busy(reset, async () => { try { const r = await api('POST', `/api/admin/users/${u.id}/reset-password`); await secretDialog('הסיסמה אופסה', `סיסמה זמנית עבור ${r.phone}:`, r.temp_password); } catch (e) { toast(e.message, true); } });
  };
  return h('div', { class: 'wrap' }, h('p', { class: 'gap' }, h('a', { href: '#/a/members' }, '→ חברים')),
    head(u.name, u.is_super ? h('span', { class: 'chip warn' }, 'מנהל־על מוגן') : null),
    u.is_super ? h('div', { class: 'alert info' }, 'חשבון מנהל־על מוגן ממחיקה, השבתה והורדת הרשאות דרך הממשק הרגיל.') : null,
    h('form', { class: 'form', novalidate: true, onsubmit: async e => {
      e.preventDefault(); alert.show('');
      await busy(submit, async () => {
        const body = { name: name.value, phone: phone.value, birth_date: birth.value || null, shooter_no: shooter.value || null, classification: cls.value || null };
        if (!u.is_super) Object.assign(body, { roles: roleBox.value(), membership: mem.value, status: st.value });
        try { await api('PATCH', '/api/admin/users/' + u.id, body); toast('נשמר'); } catch (err) { alert.show(err.message); }
      });
    } }, alert, field('שם', name), field('טלפון (שם משתמש)', phone), field('תפקידים', roleBox, { hint: 'אפשר לשלב כמה תפקידים' }), field('סטטוס חברות', mem), field('סטטוס חשבון', st, { hint: 'השבתה חוסמת כניסה ומסיימת הפעלות, וההיסטוריה נשמרת' }),
    field('תאריך לידה', birth), field('מספר יורה', shooter), field('סיווג', cls), h('div', { class: 'row' }, submit, reset)));
}

// ---------- trainings ----------
export async function trainings() {
  const { items } = await api('GET', '/api/admin/trainings');
  return h('div', { class: 'wrap' }, head('אימונים', h('a', { class: 'btn', href: '#/a/trainings/new' }, '+ אימון חדש')),
    items.length ? h('ul', { class: 'list' }, items.map(t => h('li', null, h('a', { class: 'item link', href: '#/a/trainings/' + t.id },
      h('div', { class: 'row' }, h('h3', { class: 'grow' }, t.title), h('span', { class: 'chip ' + (t.status === 'open' ? 'ok' : t.status === 'cancelled' ? 'bad' : '') }, TRAINING_STATUS[t.status])),
      h('div', { class: 'meta' }, h('span', null, fmtDateTime(t.starts_at)), h('span', null, t.location), h('span', null, 'מדריך: ' + t.instructor), h('span', null, `${t.registered}/${t.capacity} רשומים`), t.waitlist_count ? h('span', null, `${t.waitlist_count} בהמתנה`) : null))))) : h('p', { class: 'muted' }, 'אין אימונים.'));
}

export async function trainingEdit({ params }) {
  const isNew = params.id === 'new';
  const [{ items: instr }, existing] = await Promise.all([api('GET', '/api/admin/instructors'), isNew ? null : api('GET', '/api/admin/trainings')]);
  const t = isNew ? null : existing.items.find(x => String(x.id) === params.id);
  if (!isNew && !t) return h('div', { class: 'wrap' }, h('p', { class: 'alert err' }, 'האימון לא נמצא'));
  const locked = t && ['cancelled', 'done'].includes(t.status);
  const alert = formAlert();
  const title = h('input', { type: 'text', value: t?.title || '', maxlength: 100, required: true, disabled: locked });
  const when = h('input', { type: 'datetime-local', value: t?.starts_local || '', required: true, disabled: locked });
  const place = h('input', { type: 'text', value: t?.location || '', maxlength: 150, required: true, disabled: locked });
  const cap = h('input', { type: 'number', min: 1, max: 500, value: t?.capacity || 12, required: true, inputmode: 'numeric', disabled: locked });
  const ins = h('select', { required: true, disabled: locked }, h('option', { value: '' }, 'בחירת מדריך'), instr.map(i => h('option', { value: i.id, selected: t && t.instructor_id === i.id }, i.name)));
  const notes = h('textarea', { maxlength: 1000, disabled: locked }, t?.notes || '');
  const submit = h('button', { class: 'btn', type: 'submit', disabled: locked }, isNew ? 'שמירה כטיוטה' : 'שמירת שינויים');
  const statusRow = h('div', { class: 'row gap' });
  const act = (label, action, cls, msg, danger) => {
    const b = h('button', { class: 'btn ' + cls, type: 'button' }, label);
    b.onclick = async () => {
      if (msg && !(await confirmDialog(label, msg, { ok: label, danger }))) return;
      await busy(b, async () => { try { await api('POST', `/api/admin/trainings/${t.id}/status`, { action }); toast('עודכן'); window.dispatchEvent(new Event('hashchange')); } catch (e) { toast(e.message, true); } });
    };
    return b;
  };
  if (t) {
    if (['draft', 'closed'].includes(t.status)) statusRow.append(act('פתיחה להרשמה', 'open', ''));
    if (t.status === 'open') statusRow.append(act('סגירת הרשמה', 'close', 'dark', 'ההרשמה תיסגר. נרשמים קיימים יישארו, ולא יוצעו מקומות חדשים מרשימת ההמתנה.'));
    if (['open', 'closed'].includes(t.status)) statusRow.append(act('סימון כהתקיים', 'done', 'ghost', 'האימון יסומן כאימון שהתקיים.'));
    if (['draft', 'open', 'closed'].includes(t.status)) statusRow.append(act('ביטול אימון', 'cancel', 'danger', `כל הנרשמים (${t.registered}) והממתינים (${t.waitlist_count}) יקבלו הודעת ביטול, וההרשמה וההצעות הפעילות יבוטלו. אי אפשר לשחזר.`, true));
  }
  return h('div', { class: 'wrap' }, h('p', { class: 'gap' }, h('a', { href: '#/a/trainings' }, '→ אימונים')),
    head(isNew ? 'אימון חדש' : t.title, t ? h('span', { class: 'chip' }, TRAINING_STATUS[t.status]) : null),
    t ? h('div', { class: 'stat-row' }, stat(t.registered, 'רשומים'), stat(t.seats_held, 'שמורים להצעה'), stat(t.waitlist_count, 'בהמתנה'), stat(t.seats_free, 'פנויים')) : null,
    t && t.waitlist_count && t.status === 'open' ? null : null,
    statusRow, h('div', { class: 'gap2' }),
    t && !locked ? h('div', { class: 'alert info' }, 'שינוי תאריך, שעה או מקום ישלח הודעה לכל הרשומים והממתינים. השעה בשעון ישראל.') : null,
    h('form', { class: 'form', novalidate: true, onsubmit: async e => {
      e.preventDefault(); alert.show('');
      if (!when.value) return alert.show('יש לבחור תאריך ושעה');
      if (!ins.value) return alert.show('יש לבחור מדריך');
      const body = { title: title.value, starts_local: when.value, location: place.value, instructor_id: Number(ins.value), capacity: Number(cap.value), notes: notes.value || null };
      await busy(submit, async () => {
        try {
          const r = await api(isNew ? 'POST' : 'PATCH', isNew ? '/api/admin/trainings' : '/api/admin/trainings/' + t.id, body);
          toast('נשמר'); if (isNew) go('/a/trainings/' + r.training.id); else window.dispatchEvent(new Event('hashchange'));
        } catch (err) { alert.show(err.message); }
      });
    } }, alert, field('שם האימון', title), field('תאריך ושעה (שעון ישראל)', when), field('מקום', place), field('מדריך', ins), field('קיבולת', cap), field('הערות', notes), submit));
}
const stat = (n, l) => h('div', { class: 'stat' }, h('b', null, n), l);

// ---------- attendance reports ----------
export async function reports({ query }) {
  const id = query.get('id');
  if (id) {
    const { training: t, rows } = await api('GET', `/api/admin/trainings/${id}/report`);
    return h('div', { class: 'wrap' }, h('p', { class: 'gap' }, h('a', { href: '#/a/reports' }, '→ דוחות')),
      head(t.title, h('a', { class: 'btn', href: `/api/admin/trainings/${t.id}/report.xlsx`, download: '' }, 'ייצוא ל־Excel')),
      h('p', { class: 'muted' }, fmtDateTime(t.starts_at) + ' · ' + t.location),
      rows.length ? h('div', { class: 'table-wrap' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['שם', 'טלפון', 'מצב הרשמה', 'מצב נוכחות'].map(x => h('th', { scope: 'col' }, x)))),
        h('tbody', null, rows.map(r => h('tr', null, h('td', null, r.name), h('td', { dir: 'ltr' }, r.phone), h('td', null, r.registration), h('td', null, r.attendance)))))) : h('p', { class: 'muted' }, 'אין נרשמים לאימון הזה.'));
  }
  const { items } = await api('GET', '/api/admin/trainings');
  return h('div', { class: 'wrap' }, head('דוחות נוכחות'), h('ul', { class: 'list' }, items.filter(t => t.status !== 'draft').map(t =>
    h('li', null, h('a', { class: 'item link', href: '#/a/reports?id=' + t.id },
      h('div', { class: 'row' }, h('h3', { class: 'grow' }, t.title), h('span', { class: 'chip' }, TRAINING_STATUS[t.status])), h('div', { class: 'meta' }, h('span', null, fmtDateTime(t.starts_at)), h('span', null, `${t.registered} רשומים`)))))));
}

// ---------- exercise library ----------
export async function exercises() {
  const { items } = await api('GET', '/api/exercises');
  const alert = formAlert();
  const name = h('input', { type: 'text', maxlength: 80, required: true });
  const desc = h('input', { type: 'text', maxlength: 500 });
  const add = h('button', { class: 'btn', type: 'submit' }, 'הוספה');
  return h('div', { class: 'wrap' }, head('מאגר תרגילים'),
    h('p', { class: 'muted' }, 'המעקב האישי משווה תוצאות לפי מזהה קבוע של התרגיל, כך ששינוי שם לא שובר את ההיסטוריה.'),
    h('form', { class: 'card form', onsubmit: async e => {
      e.preventDefault(); alert.show('');
      await busy(add, async () => { try { await api('POST', '/api/admin/exercises', { name: name.value, description: desc.value || null }); toast('התרגיל נוסף'); window.dispatchEvent(new Event('hashchange')); } catch (err) { alert.show(err.message); } });
    } }, h('h3', null, 'תרגיל חדש'), alert, field('שם', name), field('תיאור (אופציונלי)', desc), add),
    h('ul', { class: 'list gap' }, items.map(x => {
      const n = h('input', { type: 'text', value: x.name, maxlength: 80, 'aria-label': 'שם תרגיל' });
      const save = h('button', { class: 'btn ghost sm', type: 'button' }, 'שמירת שם');
      save.onclick = () => busy(save, async () => { try { await api('PATCH', '/api/admin/exercises/' + x.id, { name: n.value }); toast('נשמר'); } catch (e) { toast(e.message, true); } });
      const tog = h('button', { class: 'btn ghost sm', type: 'button' }, x.active ? 'השבתה' : 'הפעלה');
      tog.onclick = () => busy(tog, async () => { try { await api('PATCH', '/api/admin/exercises/' + x.id, { active: !x.active }); window.dispatchEvent(new Event('hashchange')); } catch (e) { toast(e.message, true); } });
      return h('li', { class: 'item' }, h('div', { class: 'row' }, h('div', { class: 'grow' }, n), save, tog, !x.active ? h('span', { class: 'chip' }, 'מושבת') : null));
    })));
}

// ---------- news ----------
export async function news() {
  const { items } = await api('GET', '/api/admin/news');
  const alert = formAlert();
  const title = h('input', { type: 'text', maxlength: 120, required: true });
  const body = h('textarea', { maxlength: 5000, required: true });
  const cat = h('select', null, [['club', 'מועדון'], ['israel', 'ישראל'], ['world', 'עולם']].map(([k, l]) => h('option', { value: k }, l)));
  const add = h('button', { class: 'btn', type: 'submit' }, 'פרסום');
  const reload = () => window.dispatchEvent(new Event('hashchange'));
  return h('div', { class: 'wrap' }, head('חדשות'),
    h('form', { class: 'card form', onsubmit: async e => {
      e.preventDefault(); alert.show('');
      await busy(add, async () => { try { await api('POST', '/api/admin/news', { title: title.value, body: body.value, category: cat.value }); toast('פורסם'); reload(); } catch (err) { alert.show(err.message); } });
    } }, h('h3', null, 'ידיעה חדשה'), alert, field('כותרת', title), field('קטגוריה', cat), field('תוכן', body), add),
    h('ul', { class: 'list gap' }, items.map(n => h('li', { class: 'item' },
      h('div', { class: 'row' }, h('h3', { class: 'grow' }, n.title), h('span', { class: 'chip ' + (n.published ? 'ok' : '') }, n.published ? 'מפורסם' : 'מוסתר')),
      h('p', { class: 'muted' }, n.body), h('div', { class: 'meta' }, fmtDay(n.created_at)),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await api('PATCH', '/api/admin/news/' + n.id, { published: !n.published }); reload(); } }, n.published ? 'הסתרה' : 'פרסום'),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { if (await confirmDialog('מחיקת ידיעה', `למחוק את "${n.title}"?`, { ok: 'מחיקה', danger: true })) { await api('DELETE', '/api/admin/news/' + n.id); reload(); } } }, 'מחיקה'))))));
}

// ---------- settings + audit ----------
const ACTIONS = { login_locked: 'נעילת כניסה', account_approved: 'אישור חשבון', account_created: 'יצירת חשבון', user_update: 'עדכון משתמש', password_reset: 'איפוס סיסמה', training_create: 'יצירת אימון', training_cancel: 'ביטול אימון', training_change_notified: 'עדכון אימון והודעה', result_edit: 'עריכת תוצאה שפורסמה', settings_update: 'עדכון הגדרות', super_admin_created: 'יצירת מנהל־על' };
export async function settings() {
  const { settings: st } = await api('GET', '/api/admin/settings');
  const { items: log } = await api('GET', '/api/admin/audit');
  const alert = formAlert();
  const ins = {};
  const mk = (k, label, o = {}, hint) => { ins[k] = h('input', { type: o.type || 'url', value: st[k], dir: 'ltr', ...o }); return field(label, ins[k], { hint }); };
  const save = h('button', { class: 'btn', type: 'submit' }, 'שמירה');
  return h('div', { class: 'wrap' }, head('הגדרות ויומן'),
    h('div', { class: 'alert info' }, 'הערכים הסמוכים לסעיף "החלטות לאישור המועדון" ניתנים לשינוי כאן עד שהמועדון יחליט סופית.'),
    h('form', { class: 'form', novalidate: true, onsubmit: async e => {
      e.preventDefault(); alert.show('');
      const body = Object.fromEntries(Object.entries(ins).map(([k, i]) => [k, i.value]));
      body.cancel_deadline_hours = Number(body.cancel_deadline_hours); body.offer_hours = Number(body.offer_hours);
      await busy(save, async () => { try { await api('PUT', '/api/admin/settings', body); toast('ההגדרות נשמרו'); } catch (err) { alert.show(err.message); } });
    } }, alert,
    mk('cancel_deadline_hours', 'ביטול הרשמה עד כמה שעות לפני האימון', { type: 'number', min: 0, max: 168 }),
    mk('offer_hours', 'שעות לאישור מקום מרשימת המתנה', { type: 'number', min: 1, max: 72 }),
    h('h3', null, 'קישורים'),
    mk('link_ipsc_global', 'IPSC העולמי'), mk('link_ipsc_israel', 'IPSC ישראל'), mk('link_facebook', 'פייסבוק'), mk('link_instagram', 'אינסטגרם'), mk('link_youtube', 'יוטיוב'), mk('link_whatsapp', 'וואטסאפ'),
    save),
    h('h2', { class: 'gap2' }, 'יומן פעולות ניהול'),
    log.length ? h('div', { class: 'table-wrap' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['מועד', 'מבצע', 'פעולה', 'יעד'].map(x => h('th', { scope: 'col' }, x)))),
      h('tbody', null, log.map(a => h('tr', null, h('td', null, fmtFull(a.at)), h('td', null, a.actor || '—'), h('td', null, ACTIONS[a.action] || a.action), h('td', { dir: 'ltr' }, a.target || '')))))) : h('p', { class: 'muted' }, 'אין רשומות.'));
}

// ---------- dashboard + "more" ----------
export async function dashboard() {
  const d = await api('GET', '/api/admin/dashboard');
  const tile = (ic, n, l, href) => h('a', { class: 'tile', href: '#' + href }, icon(ic), h('b', null, n), h('span', null, l));
  const act = (ic, l, href) => h('a', { class: 'tile', href: '#' + href }, icon(ic), h('span', null, l));
  return h('div', { class: 'wrap' },
    h('div', { class: 'hello' }, h('h1', null, 'ניהול המועדון'), h('p', null, 'שלום, ' + state.user.name.split(' ')[0])),
    h('div', { class: 'grid tiles gap' }, tile('calendar', d.trainings_week, 'אימונים השבוע', '/a/trainings'), tile('inbox', d.new_inquiries, 'פניות חדשות', '/a/inquiries?status=new'), tile('users', d.active_members, 'חברים פעילים', '/a/members')),
    h('section', { class: 'card gap' }, h('h3', null, 'פעולות מהירות'), h('div', { class: 'grid tiles' },
      act('calendar', 'אימון חדש', '/a/trainings/new'), act('users', 'חשבון חדש', '/a/members/new'), act('doc', 'חדשות', '/a/news'))),
    h('section', { class: 'card gap' }, h('div', { class: 'row' }, h('h3', { class: 'grow' }, 'פניות אחרונות'), h('a', { href: '#/a/inquiries' }, 'הצג הכול')),
      d.latest.length ? h('ul', { class: 'list' }, d.latest.map(i => h('li', null, h('a', { class: 'result-row', href: '#/a/inquiries?status=new' }, icon('user'), h('span', { class: 'grow' }, i.name, h('div', { class: 'small muted' }, fmtDay(i.created_at))), h('span', { class: 'chip ' + (i.type === 'join' ? 'warn' : 'info') }, i.type === 'join' ? 'בקשת הצטרפות' : 'פרטי קורס')))))
        : h('p', { class: 'muted' }, 'אין פניות חדשות.')),
    h('section', { class: 'card gap' }, h('div', { class: 'row' }, h('h3', { class: 'grow' }, 'אימונים קרובים'), h('a', { href: '#/a/trainings' }, 'הצג הכול')),
      d.upcoming.length ? h('ul', { class: 'list' }, d.upcoming.map(t => h('li', null, h('a', { class: 'result-row', href: '#/a/trainings/' + t.id }, icon('calendar'), h('span', { class: 'grow' }, t.title, h('div', { class: 'small muted' }, fmtDateTime(t.starts_at) + ' · ' + t.location)), h('span', { class: 'muted small' }, `${t.registered}/${t.capacity}`)))))
        : h('p', { class: 'muted' }, 'אין אימונים קרובים.')),
    h('div', { class: 'alert note gap' }, icon('wallet'), h('span', null, h('strong', null, 'תשלום במקום. '), 'התשלומים מתבצעים במועדון ביום האימון.')));
}
export function more() {
  const item = (ic, l, href) => h('a', { class: 'item link', href: '#' + href }, h('div', { class: 'row' }, icon(ic), h('strong', { class: 'grow' }, l), icon('left')));
  return h('div', { class: 'wrap' }, head('עוד'), h('div', { class: 'list' },
    item('chart', 'דוחות נוכחות', '/a/reports'), item('target', 'מאגר תרגילים', '/a/exercises'), item('doc', 'חדשות', '/a/news'), item('settings', 'הגדרות ויומן', '/a/settings'), item('user', 'הפרופיל שלי', '/profile')));
}
