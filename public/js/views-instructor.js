import { h, api, field, formAlert, busy, toast, fmtDateTime, fmtDay, TRAINING_STATUS, TARGET, avatar, confirmDialog, dialog } from './util.js';
import { layoutView, layoutEditor, layoutStats, statsText } from './stage-builder.js';
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
    const [{ training: t, participants }, { items: stages }] = await Promise.all([api('GET', '/api/instructor/trainings/' + params.id), api('GET', `/api/instructor/trainings/${params.id}/stages`)]);
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
      h('div', { class: 'row' }, h('h2', { class: 'grow' }, `משתתפים (${participants.length})`), (() => {
        const drafts = participants.filter(p => p.results_count && !p.published).length;
        if (!drafts) return null;
        const b = h('button', { class: 'btn sm', type: 'button' }, `פרסום כל הטיוטות (${drafts})`);
        b.onclick = async () => {
          if (!await confirmDialog('פרסום כל הטיוטות', `התוצאות והמשוב של ${drafts} משתתפים יפורסמו להם, והם יקבלו הודעה. להמשיך?`, { ok: 'פרסום' })) return;
          busy(b, async () => { try { const r = await api('POST', `/api/instructor/trainings/${t.id}/publish-drafts`, {}); toast(`פורסמו ${r.published} גיליונות`); await load(); } catch (e) { toast(e.message, true); } });
        };
        return b;
      })()),
      participants.length ? h('ul', { class: 'list' }, participants.map(row)) : h('p', { class: 'muted' }, 'אין עדיין נרשמים מאושרים.'),
      stagesSection(t, stages, load));
  };
  await load();
  return wrap;
}

// ---------- exercise builder (optional): plan of stages for a training ----------
function stagesSection(t, stages, reload) {
  const locked = t.status === 'cancelled';
  const call = (b, method, url, body) => busy(b, async () => { try { await api(method, url, body); await reload(); } catch (e) { toast(e.message, true); } });
  const copyTo = async st => {
    const { items } = await api('GET', '/api/instructor/trainings-lite');
    const sel = h('select', { 'aria-label': 'אימון יעד' }, items.map(x => h('option', { value: x.id, selected: x.id === t.id }, `${x.title} · ${fmtDay(x.starts_at)}`)));
    const ok = await dialog((d, close) => d.append(h('h3', null, 'העתקת התרגיל לאימון'), h('p', { class: 'muted' }, `"${st.name}"`), sel,
      h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => close(false) }, 'חזרה'), h('button', { class: 'btn', type: 'button', onclick: () => close(true) }, 'העתקה'))));
    if (!ok) return;
    try { await api('POST', `/api/instructor/stages/${st.id}/copy`, { training_id: Number(sel.value) }); toast('התרגיל הועתק'); await reload(); } catch (e) { toast(e.message, true); }
  };
  const card = (st, i) => {
    const act = (label, fn, cls = 'btn soft sm', dis = false) => { const b = h('button', { type: 'button', class: cls, disabled: dis }, label); b.onclick = () => fn(b); return b; };
    return h('li', { class: 'item stage-card' },
      h('div', { class: 'stage-head' }, h('h3', null, `${i + 1}. ${st.name}`), st.exercise_name ? h('span', { class: 'chip' }, 'במאגר: ' + st.exercise_name) : null),
      layoutView(st.layout), h('p', { class: 'small muted' }, statsText(layoutStats(st.layout.items))),
      st.description ? h('p', { class: 'pre' }, st.description) : null,
      locked ? null : h('div', { class: 'stage-actions' },
        act('למעלה', b => call(b, 'POST', `/api/instructor/stages/${st.id}/move`, { dir: 'up' }), 'btn soft sm', i === 0),
        act('למטה', b => call(b, 'POST', `/api/instructor/stages/${st.id}/move`, { dir: 'down' }), 'btn soft sm', i === stages.length - 1),
        h('a', { class: 'btn ghost sm', href: `#/i/training/${t.id}/stage/${st.id}` }, 'עריכה'),
        act('שכפול', b => call(b, 'POST', `/api/instructor/stages/${st.id}/copy`, {})),
        act('העתקה לאימון אחר', () => copyTo(st)),
        act('מחיקה', async b => { if (await confirmDialog('מחיקת תרגיל', `למחוק את "${st.name}" מהתכנית?`, { ok: 'מחיקה', danger: true })) call(b, 'DELETE', `/api/instructor/stages/${st.id}`); }, 'btn danger sm')));
  };
  return h('section', { class: 'gap2' },
    h('div', { class: 'row' }, h('h2', { class: 'grow' }, 'תכנון התרגילים'), locked ? null : h('a', { class: 'btn sm', href: `#/i/training/${t.id}/stage/new` }, icon('plus'), 'הוספת תרגיל')),
    h('p', { class: 'small muted' }, 'אופציונלי. תרגילים שתגדירו כאן יוצגו למשתתפים בדף האימון, ותוכלו לבחור אותם בעת הזנת תוצאות.'),
    stages.length ? h('ul', { class: 'list' }, stages.map(card)) : h('p', { class: 'muted' }, 'עדיין לא נבנתה תכנית לאימון הזה.'));
}

export async function stageEdit({ params }) {
  const isNew = params.sid === 'new';
  const [lib, stages] = await Promise.all([api('GET', '/api/exercises'), api('GET', `/api/instructor/trainings/${params.id}/stages`)]);
  const st = isNew ? null : stages.items.find(x => String(x.id) === String(params.sid));
  if (!isNew && !st) throw new Error('התרגיל לא נמצא');
  const alert = formAlert();
  const name = h('input', { type: 'text', value: st ? st.name : '', maxlength: 80, required: true, autocomplete: 'off' });
  const desc = h('textarea', { maxlength: 1500, placeholder: 'עמדת פתיחה, נשק, סדר הירי, מסלול, הערות בטיחות…' }, st ? st.description : '');
  const link = h('select', null, h('option', { value: '' }, 'ללא קישור'), lib.items.filter(e => e.active).map(e => h('option', { value: e.id, selected: st && e.id === st.exercise_id }, e.name)));
  const editor = layoutEditor(st ? st.layout : { items: [] });
  const submit = h('button', { class: 'btn', type: 'submit' }, 'שמירה');
  const form = h('form', { class: 'form', novalidate: true },
    field('שם התרגיל', name), field('הוראות ותיאור', desc),
    field('קישור לתרגיל מהמאגר (לא חובה)', link, { hint: 'כשהתרגיל מקושר, התוצאות שלו נכנסות לגרף ההתקדמות של המשתתפים.' }),
    h('div', null, h('h3', null, 'סכמת התרגיל'), editor.el),
    alert, h('div', { class: 'row' }, submit, h('a', { class: 'btn ghost', href: '#/i/training/' + params.id }, 'ביטול')));
  form.onsubmit = e => {
    e.preventDefault();
    busy(submit, async () => {
      alert.show('');
      try {
        const body = { name: name.value, description: desc.value, exercise_id: link.value || null, layout: editor.getLayout() };
        if (isNew) await api('POST', `/api/instructor/trainings/${params.id}/stages`, body); else await api('PUT', `/api/instructor/stages/${st.id}`, body);
        toast('התרגיל נשמר'); go('/i/training/' + params.id);
      } catch (err) { alert.show(err.message); }
    });
  };
  return h('div', { class: 'wrap' }, h('p', { class: 'gap' }, h('a', { href: '#/i/training/' + params.id }, '→ חזרה לאימון')),
    h('div', { class: 'page-head' }, h('h1', null, isNew ? 'תרגיל חדש' : 'עריכת תרגיל')), form);
}

const blank = () => ({ id: null, exercise_id: '', manual_name: '', target_type: 'paper', a: 0, c: 0, d: 0, misses: 0, time_sec: '' });

export async function memberSheet({ params }) {
  const [data, ex, plan] = await Promise.all([
    api('GET', `/api/instructor/trainings/${params.id}/members/${params.uid}`), api('GET', '/api/exercises'), api('GET', `/api/instructor/trainings/${params.id}/stages`)]);
  let records = data.records.map(r => ({ id: r.id, exercise_id: r.exercise_id || '', manual_name: r.manual ? r.name : '', target_type: r.target_type, a: r.a, c: r.c, d: r.d, misses: r.misses, time_sec: r.time_sec }));
  let published = data.published;
  // exercise + target type of the previous participant are remembered for this training (no scores, no names), so a series of members needs no re-picking
  const setupKey = 'df-setup-' + params.id;
  const readSetup = () => { try { return JSON.parse(sessionStorage.getItem(setupKey) || '[]'); } catch { return []; } };
  const rememberSetup = () => { try { sessionStorage.setItem(setupKey, JSON.stringify(records.map(r => ({ exercise_id: r.exercise_id, manual_name: r.manual_name, target_type: r.target_type })))); } catch { /* private mode: skip */ } };
  if (!records.length && !published) records = readSetup().map(x => ({ ...blank(), ...x }));
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
      const sel = h('select', null, h('option', { value: '' }, 'תרגיל ידני (לא מהמאגר)'), plan.items.length ? h('optgroup', { label: 'מתכנית האימון' }, plan.items.map(p => h('option', { value: 'stage:' + p.id }, p.name))) : null, ex.items.filter(e => e.active || e.id === rec.exercise_id).map(e => h('option', { value: e.id, selected: String(e.id) === String(rec.exercise_id) }, e.name)));
      const manual = h('input', { type: 'text', value: rec.manual_name, maxlength: 80, placeholder: 'שם התרגיל' });
      manual.oninput = () => { rec.manual_name = manual.value; };
      const fManual = field('שם תרגיל ידני', manual);
      fManual.hidden = !!rec.exercise_id;
      sel.onchange = () => {
        if (sel.value.startsWith('stage:')) { // a stage from the plan: use its library exercise if linked, else its name as a manual exercise
          const p = plan.items.find(x => 'stage:' + x.id === sel.value);
          rec.exercise_id = p && p.exercise_id ? p.exercise_id : ''; rec.manual_name = p && !p.exercise_id ? p.name : ''; draw(); return;
        }
        rec.exercise_id = sel.value; fManual.hidden = !!sel.value;
      };
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
  const buildPayload = () => records.map(r => ({
    id: r.id, exercise_id: r.exercise_id ? Number(r.exercise_id) : null, manual_name: r.exercise_id ? null : r.manual_name, target_type: r.target_type,
    a: r.a === '' ? 0 : Number(r.a), c: r.c === '' ? 0 : Number(r.c), d: r.d === '' ? 0 : Number(r.d), misses: r.misses === '' ? 0 : Number(r.misses),
    time_sec: r.time_sec === '' ? NaN : Number(String(r.time_sec).replace(',', '.')),
  }));
  const invalid = payload => {
    const noEx = payload.findIndex(p => !p.exercise_id && (p.manual_name || '').trim().length < 2);
    if (noEx >= 0) return `רשומה ${noEx + 1}: יש לבחור תרגיל מהמאגר או לכתוב שם תרגיל`;
    const badIdx = payload.findIndex(p => !Number.isFinite(p.time_sec) || p.time_sec <= 0);
    if (badIdx >= 0) return `רשומה ${badIdx + 1}: יש להזין זמן תקין (מספר חיובי)`;
    const badInt = payload.findIndex(p => [p.a, p.c, p.d, p.misses].some(v => !Number.isInteger(v) || v < 0));
    if (badInt >= 0) return `רשומה ${badInt + 1}: הספירות וההחטאות חייבות להיות מספרים שלמים, 0 ומעלה`;
    return '';
  };
  const mapRecords = rs => rs.map(x => ({ id: x.id, exercise_id: x.exercise_id || '', manual_name: x.manual ? x.name : '', target_type: x.target_type, a: x.a, c: x.c, d: x.d, misses: x.misses, time_sec: x.time_sec }));
  let busyAuto = false, again = false, timer = null;
  const doSave = async publish => {
    alert.show('');
    clearTimeout(timer);
    const payload = buildPayload(), msg = invalid(payload);
    if (msg) { alert.show(msg); return false; }
    try {
      const r = await api('PUT', `/api/instructor/trainings/${params.id}/members/${params.uid}`, { records: payload, feedback: fb.value, publish });
      published = r.published; records = mapRecords(r.records); rememberSetup();
      draw(); toast(publish || published ? 'נשמר ופורסם לחבר' : 'נשמר כטיוטה');
      return true;
    } catch (e) { alert.show(e.message); return false; }
  };
  const save = (publish, btn) => busy(btn, () => doSave(publish));

  // autosave of the draft: only while unpublished, only when every record is valid, never touches focus
  const autoState = h('span', { class: 'small muted', role: 'status', 'aria-live': 'polite' });
  const autosave = async () => {
    if (published) return;
    if (busyAuto) { again = true; return; }
    const payload = buildPayload();
    if (!payload.length && !fb.value.trim()) return;
    if (invalid(payload)) { autoState.textContent = 'הטיוטה תישמר אוטומטית אחרי שיוזן זמן תקין'; return; }
    busyAuto = true;
    try {
      const r = await api('PUT', `/api/instructor/trainings/${params.id}/members/${params.uid}`, { records: payload, feedback: fb.value, publish: false });
      if (r.records.length === records.length) r.records.forEach((x, i) => { records[i].id = x.id; }); // keep ids so the next save updates, not duplicates
      rememberSetup();
      autoState.textContent = 'הטיוטה נשמרה אוטומטית';
    } catch (e) { autoState.textContent = 'השמירה האוטומטית נכשלה: ' + e.message; }
    busyAuto = false;
    if (again) { again = false; schedule(); }
  };
  const schedule = () => { if (published) return; autoState.textContent = 'ממתין לשמירה…'; clearTimeout(timer); timer = setTimeout(autosave, 1500); };
  // leaving the page: stop the timer if the sheet is no longer on screen
  const watch = setInterval(() => { if (!root.isConnected) { clearInterval(watch); clearTimeout(timer); } }, 2000);

  const nextBtn = h('button', { class: 'btn', type: 'button' }, 'שמירה והמשך למשתתף הבא');
  nextBtn.onclick = () => busy(nextBtn, async () => {
    if (!await doSave(false)) return;
    try {
      const { participants } = await api('GET', '/api/instructor/trainings/' + params.id);
      const list = participants.filter(p => p.attendance !== 'absent');
      const i = list.findIndex(p => String(p.id) === String(params.uid));
      const nxt = list[i + 1];
      go(nxt ? `/i/training/${params.id}/member/${nxt.id}` : '/i/training/' + params.id);
    } catch (e) { toast(e.message, true); }
  });
  const add = h('button', { class: 'btn ghost', type: 'button', onclick: () => { records.push(blank()); draw(); } }, icon('plus'), 'הוספת רשומת תוצאה');
  const draft = h('button', { class: 'btn ghost', type: 'button' }, 'שמירה כטיוטה');
  const pub = h('button', { class: 'btn', type: 'button' }, published ? 'שמירת תיקון' : 'פרסום לחבר');
  draft.onclick = () => save(false, draft); pub.onclick = () => save(true, pub);
  if (published) { draft.hidden = true; nextBtn.hidden = true; }
  const root = h('div', { class: 'wrap' },
    h('p', { class: 'gap' }, h('a', { href: '#/i/training/' + params.id }, '→ חזרה לרשימת המשתתפים')),
    h('div', { class: 'page-head' }, h('h1', null, data.member.name), h('div', { class: 'meta muted' }, data.training.title + ' · ' + fmtDay(data.training.starts_at)),
      h('span', { class: 'chip ' + (published ? 'ok' : '') }, published ? 'פורסם לחבר' : 'טיוטה')),
    published ? h('div', { class: 'alert info' }, 'התוצאות פורסמו. תיקון יעדכן את אותן רשומות, וזהות העורך ומועד השינוי יישמרו.') : null,
    alert, list, h('div', { class: 'gap' }, add), h('div', { class: 'gap' }, field('משוב אישי', fb)),
    h('div', { class: 'row gap' }, nextBtn, draft, pub), h('p', { class: 'gap' }, autoState));
  root.addEventListener('input', schedule); root.addEventListener('change', schedule); root.addEventListener('click', e => { if (e.target.closest('.stepper button')) schedule(); });
  return root;
}
