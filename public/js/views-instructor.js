import { h, api, field, formAlert, busy, toast, fmtDateTime, fmtDay, TRAINING_STATUS, TARGET, avatar } from './util.js';
import { state, go } from './state.js';
import { icon } from './icons.js';
import { seatsBar } from './views-member.js';

export async function myTrainings() {
  const { items } = await api('GET', '/api/instructor/trainings');
  const now = Date.now();
  const upcoming = items.filter(t => new Date(t.starts_at).getTime() >= now - 6 * 3600e3 && !['cancelled', 'done'].includes(t.status)).reverse();
  const rest = items.filter(t => !upcoming.includes(t));
  const card = t => h('a', { class: 'item link', href: '#/i/training/' + t.id },
    h('div', { class: 'row' }, h('h3', { class: 'grow' }, t.title), h('span', { class: 'chip' + (t.status === 'cancelled' ? ' bad' : '') }, TRAINING_STATUS[t.status])),
    h('div', { class: 'meta' }, h('span', null, fmtDateTime(t.starts_at)), h('span', null, t.location), h('span', null, `${t.registered} רשומים מתוך ${t.capacity}`)));
  return h('div', { class: 'wrap' }, h('div', { class: 'hello' }, h('h1', null, 'אזור המדריך'), h('p', null, 'שלום, ' + state.user.name.split(' ')[0])),
    h('h2', null, 'אימונים קרובים'), upcoming.length ? h('div', { class: 'list' }, upcoming.map(card)) : h('p', { class: 'muted' }, 'אין אימונים קרובים.'),
    rest.length ? [h('h2', { class: 'gap2' }, 'קודמים'), h('div', { class: 'list' }, rest.map(card))] : null);
}

export async function trainingParticipants({ params }) {
  const wrap = h('div', { class: 'wrap' });
  const load = async () => {
    const { training: t, participants } = await api('GET', '/api/instructor/trainings/' + params.id);
    const canMark = !['cancelled', 'draft'].includes(t.status);
    const row = p => {
      const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'נוכחות של ' + p.name });
      const mk = (val, label, cls) => {
        const b = h('button', { type: 'button', class: cls, 'aria-pressed': String(p.attendance === val), disabled: !canMark }, label);
        b.onclick = () => busy(b, async () => {
          const next = p.attendance === val ? null : val; // tap again to clear back to "not marked yet"
          try { await api('POST', `/api/instructor/trainings/${t.id}/attendance`, { user_id: p.id, status: next }); p.attendance = next; refresh(); }
          catch (e) { toast(e.message, true); }
        });
        return b;
      };
      const refresh = () => seg.replaceChildren(mk('present', 'הגיע', 'yes'), mk('absent', 'לא הגיע', 'no'));
      refresh();
      return h('li', { class: 'item' },
        h('div', { class: 'row' }, avatar({ id: p.id, name: p.name, has_photo: !!p.has_photo }), h('div', { class: 'grow' }, h('strong', null, p.name),
          h('div', { class: 'small muted' }, p.attendance ? '' : 'טרם סומן', p.results_count ? ` ${p.results_count} רשומות תוצאה` + (p.published ? ' · פורסם' : ' · טיוטה') : '')),),
        h('div', { class: 'row' }, seg, h('a', { class: 'btn ghost sm', href: `#/i/training/${t.id}/member/${p.id}` }, 'תוצאות ומשוב')));
    };
    wrap.replaceChildren(h('p', { class: 'gap' }, h('a', { href: '#/i' }, '→ האימונים שלי')),
      h('div', { class: 'page-head' }, h('h1', null, t.title), h('div', { class: 'meta muted' }, fmtDateTime(t.starts_at) + ' · ' + t.location + ' · ' + TRAINING_STATUS[t.status])),
      t.status === 'cancelled' ? h('div', { class: 'alert err' }, 'האימון בוטל.') : null,
      h('h2', null, `משתתפים (${participants.length})`),
      participants.length ? h('ul', { class: 'list' }, participants.map(row)) : h('p', { class: 'muted' }, 'אין עדיין נרשמים מאושרים.'));
  };
  await load();
  return wrap;
}

const blank = () => ({ id: null, exercise_id: '', manual_name: '', target_type: 'paper', a: 0, c: 0, d: 0, misses: 0, time_sec: '' });

export async function memberSheet({ params }) {
  const [data, ex] = await Promise.all([
    api('GET', `/api/instructor/trainings/${params.id}/members/${params.uid}`), api('GET', '/api/exercises')]);
  let records = data.records.map(r => ({ id: r.id, exercise_id: r.exercise_id || '', manual_name: r.manual ? r.name : '', target_type: r.target_type, a: r.a, c: r.c, d: r.d, misses: r.misses, time_sec: r.time_sec }));
  let published = data.published;
  const alert = formAlert();
  const fb = h('textarea', { maxlength: 2000, name: 'feedback' }, data.feedback || '');
  const list = h('div', { class: 'list' });
  // +/- stepper for integer counts (big touch targets for use at the range)
  const stepper = (rec, key, label) => {
    const i = h('input', { type: 'text', inputmode: 'numeric', value: rec[key], dir: 'ltr', autocomplete: 'off', 'aria-label': label });
    i.oninput = () => { rec[key] = i.value; };
    const step = d => { const n = Math.max(0, (parseInt(i.value, 10) || 0) + d); i.value = n; rec[key] = n; };
    return h('div', { class: 'stepper', role: 'group', 'aria-label': label }, h('span', null, label),
      h('div', { class: 'ctl2' }, h('button', { type: 'button', 'aria-label': label + ' פלוס', onclick: () => step(1) }, '+'), i, h('button', { type: 'button', 'aria-label': label + ' מינוס', onclick: () => step(-1) }, '−')));
  };
  const timeField = rec => {
    const i = h('input', { type: 'text', inputmode: 'decimal', value: rec.time_sec, dir: 'ltr', autocomplete: 'off', placeholder: '0.00', 'aria-label': 'זמן בשניות' });
    i.oninput = () => { rec.time_sec = i.value; };
    return h('div', { class: 'timebox' }, icon('timer'), h('strong', null, 'זמן בשניות'), h('div', { class: 'grow' }, i));
  };
  const draw = () => {
    list.replaceChildren(...records.map((rec, idx) => {
      const sel = h('select', null, h('option', { value: '' }, 'תרגיל ידני (לא מהמאגר)'), ex.items.filter(e => e.active || e.id === rec.exercise_id).map(e => h('option', { value: e.id, selected: String(e.id) === String(rec.exercise_id) }, e.name)));
      const manual = h('input', { type: 'text', value: rec.manual_name, maxlength: 80, placeholder: 'שם התרגיל' });
      manual.oninput = () => { rec.manual_name = manual.value; };
      const fManual = field('שם תרגיל ידני', manual);
      fManual.hidden = !!rec.exercise_id;
      sel.onchange = () => { rec.exercise_id = sel.value; fManual.hidden = !!sel.value; };
      const tgt = h('select', null, Object.entries(TARGET).map(([k, v]) => h('option', { value: k, selected: k === rec.target_type }, v)));
      tgt.onchange = () => { rec.target_type = tgt.value; };
      return h('div', { class: 'rec' }, h('div', { class: 'row' }, h('strong', { class: 'grow' }, `רשומה ${idx + 1}`),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { records.splice(idx, 1); draw(); } }, 'הסרה')),
      field('תרגיל', sel), fManual, field('סוג מטרה', tgt),
      h('div', { class: 'steppers' }, stepper(rec, 'a', 'Alpha (A)'), stepper(rec, 'c', 'Charlie (C)'), stepper(rec, 'd', 'Delta (D)'), stepper(rec, 'misses', 'החטאות (Miss)')), timeField(rec));
    }));
    if (!records.length) list.append(h('p', { class: 'muted' }, 'עדיין לא הוגדרו רשומות תוצאה. אפשר להוסיף, או לכתוב משוב בלבד.'));
  };
  draw();
  const save = (publish, btn) => busy(btn, async () => {
    alert.show('');
    const payload = records.map(r => ({
      id: r.id, exercise_id: r.exercise_id ? Number(r.exercise_id) : null, manual_name: r.exercise_id ? null : r.manual_name, target_type: r.target_type,
      a: r.a === '' ? 0 : Number(r.a), c: r.c === '' ? 0 : Number(r.c), d: r.d === '' ? 0 : Number(r.d), misses: r.misses === '' ? 0 : Number(r.misses),
      time_sec: r.time_sec === '' ? NaN : Number(String(r.time_sec).replace(',', '.')),
    }));
    const badIdx = payload.findIndex(p => !Number.isFinite(p.time_sec) || p.time_sec <= 0);
    if (badIdx >= 0) return alert.show(`רשומה ${badIdx + 1}: יש להזין זמן תקין (מספר חיובי)`);
    const badInt = payload.findIndex(p => [p.a, p.c, p.d, p.misses].some(v => !Number.isInteger(v) || v < 0));
    if (badInt >= 0) return alert.show(`רשומה ${badInt + 1}: הספירות וההחטאות חייבות להיות מספרים שלמים, 0 ומעלה`);
    try {
      const r = await api('PUT', `/api/instructor/trainings/${params.id}/members/${params.uid}`, { records: payload, feedback: fb.value, publish });
      published = r.published;
      records = r.records.map(x => ({ id: x.id, exercise_id: x.exercise_id || '', manual_name: x.manual ? x.name : '', target_type: x.target_type, a: x.a, c: x.c, d: x.d, misses: x.misses, time_sec: x.time_sec }));
      draw(); toast(publish || published ? 'נשמר ופורסם לחבר' : 'נשמר כטיוטה');
    } catch (e) { alert.show(e.message); }
  });
  const add = h('button', { class: 'btn ghost', type: 'button', onclick: () => { records.push(blank()); draw(); } }, icon('plus'), 'הוספת רשומת תוצאה');
  const draft = h('button', { class: 'btn ghost', type: 'button' }, 'שמירה כטיוטה');
  const pub = h('button', { class: 'btn', type: 'button' }, published ? 'שמירת תיקון' : 'פרסום לחבר');
  draft.onclick = () => save(false, draft); pub.onclick = () => save(true, pub);
  if (published) draft.hidden = true;
  return h('div', { class: 'wrap' },
    h('p', { class: 'gap' }, h('a', { href: '#/i/training/' + params.id }, '→ חזרה לרשימת המשתתפים')),
    h('div', { class: 'page-head' }, h('h1', null, data.member.name), h('div', { class: 'meta muted' }, data.training.title + ' · ' + fmtDay(data.training.starts_at)),
      h('span', { class: 'chip ' + (published ? 'ok' : '') }, published ? 'פורסם לחבר' : 'טיוטה')),
    published ? h('div', { class: 'alert info' }, 'התוצאות פורסמו. תיקון יעדכן את אותן רשומות, וזהות העורך ומועד השינוי יישמרו.') : null,
    alert, list, h('div', { class: 'gap' }, add), h('div', { class: 'gap' }, field('משוב אישי', fb)),
    h('div', { class: 'row gap' }, draft, pub));
}
