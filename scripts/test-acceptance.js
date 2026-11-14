'use strict';
// API-level acceptance tests mirroring section "בדיקות קבלה" of the spec. Runs on a throw-away database.
const os = require('os'), fs = require('fs'), path = require('path');
process.env.DF_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'df-test-'));
const app = require('../server');
const { db, createUser } = require('../db');
const T = require('../training-logic');

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? pass++ : fail++; console.log(`${cond ? '  ✓' : '  ✗ FAIL'} ${msg}`); };
const section = s => console.log('\n' + s);

(async () => {
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  class Client {
    constructor() { this.cookie = ''; }
    async req(method, url, body, extra = {}) {
      const r = await fetch(base + url, {
        method, headers: { 'x-df': '1', ...(body !== undefined && !extra.raw ? { 'content-type': 'application/json' } : {}), cookie: this.cookie, ...(extra.headers || {}) },
        body: body === undefined ? undefined : (extra.raw ? body : JSON.stringify(body)),
      });
      const sc = r.headers.get('set-cookie'); if (sc) this.cookie = sc.split(';')[0];
      const ct = r.headers.get('content-type') || '';
      const data = ct.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer());
      return { status: r.status, data, headers: r.headers };
    }
    get(u) { return this.req('GET', u); }
    post(u, b = {}) { return this.req('POST', u, b); }
    put(u, b) { return this.req('PUT', u, b); }
    patch(u, b) { return this.req('PATCH', u, b); }
    async login(phone, password) { const r = await this.post('/api/auth/login', { phone, password }); if (r.status !== 200) throw new Error('login failed ' + phone + ' ' + r.status); return r; }
  }

  const adminId = createUser({ phone: '0501111111', name: 'מנהל על', password: 'Admin1234', role: 'admin', isSuper: true });
  const instId = createUser({ phone: '0502222222', name: 'מדריך א', password: 'Coach1234', role: 'instructor' });
  const inst2Id = createUser({ phone: '0502222223', name: 'מדריך ב', password: 'Coach1234', role: 'instructor' });
  const mk = (n) => createUser({ phone: '05033333' + n, name: 'חבר ' + n, password: 'Member1234', role: 'member' });
  const [m1, m2, m3] = ['01', '02', '03'].map(mk);
  const exId = Number(db.prepare(`INSERT INTO exercises(name) VALUES('תרגיל בדיקה')`).run().lastInsertRowid);

  const admin = new Client(); await admin.login('0501111111', 'Admin1234');
  const mkTraining = async (title, cap, days = 2) => {
    const d = new Date(Date.now() + days * 86400e3 + 3 * 3600e3);
    const local = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short' }).format(d).replace(' ', 'T');
    const r = await admin.post('/api/admin/trainings', { title, starts_local: local, location: 'מטווח', instructor_id: instId, capacity: cap });
    if (r.status !== 200) throw new Error(JSON.stringify(r.data));
    const id = r.data.training.id;
    await admin.post(`/api/admin/trainings/${id}/status`, { action: 'open' });
    return id;
  };

  section('1. בקשת הצטרפות → אישור מנהל → כניסה וגישה לאימונים');
  const pub = new Client();
  let r = await pub.post('/api/inquiries', { type: 'join', name: 'אורח חדש', phone: '054-7654321', previous_course: 'קורס בסיס 2025' });
  ok(r.status === 200, 'אורח שולח בקשת הצטרפות');
  r = await pub.post('/api/inquiries', { type: 'join', name: 'א', phone: '123' });
  ok(r.status === 400, 'טופס לא תקין נדחה עם הודעת שגיאה');
  r = await pub.get('/api/trainings'); ok(r.status === 401, 'אורח לא רואה אימונים');
  r = await admin.get('/api/admin/inquiries?status=new');
  const inq = r.data.items.find(i => i.phone === '0547654321');
  ok(!!inq, 'הפנייה מופיעה אצל המנהל עם טלפון בתבנית אחידה');
  r = await admin.post(`/api/admin/inquiries/${inq.id}/approve`);
  ok(r.status === 200 && r.data.temp_password, 'המנהל מאשר ומקבל סיסמה זמנית');
  const newMember = new Client();
  await newMember.login('0547654321', r.data.temp_password);
  r = await newMember.get('/api/trainings');
  ok(r.status === 403 && r.data.code === 'must_change_password', 'בכניסה ראשונה נדרשת החלפת סיסמה');
  r = await newMember.post('/api/auth/change-password', { current: 'x', next: 'Newpass123' });
  ok(r.status === 400, 'סיסמה נוכחית שגויה נדחית');
  const temp = r2 => r2;
  r = await admin.get('/api/admin/users?q=0547654321');
  const tmp = (await admin.post(`/api/admin/users/${r.data.items[0].id}/reset-password`)).data.temp_password;
  const nm = new Client(); await nm.login('0547654321', tmp);
  r = await nm.post('/api/auth/change-password', { current: tmp, next: 'Newpass123' });
  ok(r.status === 200, 'החלפת סיסמה מצליחה');
  const t1 = await mkTraining('אימון קבלה 1', 1);
  r = await nm.get('/api/trainings');
  ok(r.status === 200 && r.data.items.some(t => t.id === t1), 'החבר רואה את מועדי האימונים הפתוחים');

  section('2. שני חברים על המקום האחרון — רק אחד מצליח');
  const c1 = new Client(), c2 = new Client(); await c1.login('050333330' + 1, 'Member1234'); await c2.login('050333330' + 2, 'Member1234');
  const [ra, rb] = await Promise.all([c1.post(`/api/trainings/${t1}/register`), c2.post(`/api/trainings/${t1}/register`)]);
  const wins = [ra, rb].filter(x => x.status === 200).length;
  ok(wins === 1, `בדיוק הרשמה אחת אושרה (${ra.status}/${rb.status})`);
  const loser = ra.status === 200 ? c2 : c1, winner = ra.status === 200 ? c1 : c2;
  r = await winner.post(`/api/trainings/${t1}/register`);
  ok(r.status === 409, 'הרשמה כפולה לאותו חבר נדחית');
  ok((db.prepare(`SELECT COUNT(*) n FROM registrations WHERE training_id=? AND status='confirmed'`).get(t1).n) === 1, 'במסד יש רישום מאושר אחד בלבד');
  r = await loser.post(`/api/trainings/${t1}/waitlist/join`);
  ok(r.status === 200 && r.data.training.mine.waitlist_position === 1, 'המפסיד מצטרף לרשימת המתנה (מקום 1)');
  r = await loser.post(`/api/trainings/${t1}/waitlist/join`);
  ok(r.status === 409, 'אי אפשר להצטרף לרשימת המתנה פעמיים');

  section('6. רשימת המתנה: רק הראשון בתור, פקיעה, אישור כפול');
  const c3 = new Client(); await c3.login('0503333303', 'Member1234');
  await c3.post(`/api/trainings/${t1}/waitlist/join`);
  r = await winner.post(`/api/trainings/${t1}/cancel`);
  ok(r.status === 200, 'ביטול הרשמה מצליח');
  const regs = id => Object.fromEntries(db.prepare(`SELECT user_id, status FROM registrations WHERE training_id=? AND status IN ('confirmed','waitlist','offered')`).all(id).map(x => [x.user_id, x.status]));
  const loserId = loser === c1 ? m1 : m2;
  ok(regs(t1)[loserId] === 'offered', 'המקום שמור לראשון בתור');
  ok(regs(t1)[m3] === 'waitlist', 'השני נשאר ממתין');
  r = await c3.post(`/api/trainings/${t1}/offer/accept`);
  ok(r.status === 409, 'השני בתור לא יכול לאשר את ההצעה של הראשון');
  // force expiry of the first offer
  db.prepare(`UPDATE registrations SET offer_expires_at=? WHERE training_id=? AND status='offered'`).run(new Date(Date.now() - 1000).toISOString(), t1);
  r = await loser.post(`/api/trainings/${t1}/offer/accept`);
  ok(r.status === 409, 'הצעה שפגה לא ניתנת לאישור');
  ok(regs(t1)[m3] === 'offered', 'לאחר הפקיעה ההצעה עוברת לבא בתור');
  const [x1, x2] = await Promise.all([c3.post(`/api/trainings/${t1}/offer/accept`), c3.post(`/api/trainings/${t1}/offer/accept`)]);
  ok([x1, x2].filter(x => x.status === 200).length === 1, 'אישור כפול מצליח פעם אחת בלבד');
  ok(db.prepare(`SELECT COUNT(*) n FROM registrations WHERE training_id=? AND user_id=? AND status='confirmed'`).get(t1, m3).n === 1, 'נשמרת הרשמה מאושרת אחת');

  section('3. הזנת תוצאות ומשוב + בידוד בין חברים');
  const coach = new Client(); await coach.login('0502222222', 'Coach1234');
  r = await coach.put(`/api/instructor/trainings/${t1}/members/${m3}`, { publish: true, feedback: 'עבודה טובה', records: [
    { exercise_id: exId, target_type: 'paper', a: 8, c: 3, d: 1, misses: 2, time_sec: 12.5 },
    { manual_name: 'תרגיל ידני', target_type: 'steel', a: 0, c: 0, d: 0, misses: 1, time_sec: 7.2 }] });
  ok(r.status === 200 && r.data.published, 'מדריך משויך מפרסם תוצאה ומשוב');
  r = await c3.get('/api/me/results');
  ok(r.data.items.length === 1 && r.data.items[0].results.length === 2 && r.data.items[0].feedback === 'עבודה טובה', 'החבר רואה את הרשומה והמשוב');
  r = await c1.get('/api/me/results');
  ok(r.data.items.length === 0, 'חבר אחר לא רואה את הרשומה');
  r = await c1.get(`/api/instructor/trainings/${t1}/members/${m3}`);
  ok(r.status === 403, 'חבר מנסה גישה ישירה לנתוני חבר אחר — נדחה');
  const coach2 = new Client(); await coach2.login('0502222223', 'Coach1234');
  r = await coach2.get(`/api/instructor/trainings/${t1}/members/${m3}`);
  ok(r.status === 403, 'מדריך לא משויך נדחה');
  r = await coach.put(`/api/instructor/trainings/${t1}/members/${m3}`, { records: [{ exercise_id: exId, target_type: 'paper', a: 1, c: 0, d: 0, misses: 0, time_sec: -3 }] });
  ok(r.status === 400, 'זמן שלילי נדחה בבדיקת תקינות');
  r = await coach.put(`/api/instructor/trainings/${t1}/members/${m3}`, { records: [{ exercise_id: exId, target_type: 'paper', a: 1.5, c: 0, d: 0, misses: 0, time_sec: 3 }] });
  ok(r.status === 400, 'ספירה לא שלמה נדחית');
  const sheet = (await coach.get(`/api/instructor/trainings/${t1}/members/${m3}`)).data;
  const rec = sheet.records.find(x => !x.manual);
  r = await coach.put(`/api/instructor/trainings/${t1}/members/${m3}`, { feedback: 'עבודה טובה', records: sheet.records.map(x => ({ ...x, exercise_id: x.exercise_id, manual_name: x.manual ? x.name : null, time_sec: x.id === rec.id ? 11.9 : x.time_sec })) });
  const row = db.prepare('SELECT * FROM results WHERE id=?').get(rec.id);
  ok(r.status === 200 && row.edited_by === instId && row.edited_at, 'תיקון תוצאה מעדכן את אותה רשומה ושומר עורך ומועד');
  ok(db.prepare(`SELECT COUNT(*) n FROM audit WHERE action='result_edit'`).get().n === 1, 'עריכת תוצאה שפורסמה נרשמה ביומן');
  ok(db.prepare('SELECT COUNT(*) n FROM results WHERE training_id=? AND user_id=?').get(t1, m3).n === 2, 'לא נוצרה רשומה כפולה');

  section('4. ביטול אימון ושינוי מועד');
  const t2 = await mkTraining('אימון לביטול', 5, 4);
  await c1.post(`/api/trainings/${t2}/register`); await c2.post(`/api/trainings/${t2}/register`);
  const t3 = await mkTraining('אימון לשינוי מועד', 1, 5);
  await c1.post(`/api/trainings/${t3}/register`); await c2.post(`/api/trainings/${t3}/waitlist/join`);
  const before = db.prepare('SELECT COUNT(*) n FROM notifications').get().n;
  const cur = (await admin.get('/api/admin/trainings')).data.items.find(t => t.id === t3);
  const newLocal = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short' }).format(new Date(Date.now() + 6 * 86400e3)).replace(' ', 'T');
  r = await admin.patch(`/api/admin/trainings/${t3}`, { starts_local: newLocal });
  ok(r.status === 200 && db.prepare('SELECT COUNT(*) n FROM notifications').get().n === before + 2, 'שינוי מועד שולח הודעה לנרשם ולממתין');
  const note = db.prepare(`SELECT body FROM notifications WHERE kind='training_changed' ORDER BY id DESC`).get();
  ok(note.body.includes('מועד חדש'), 'ההודעה כוללת את הפרטים המעודכנים');
  r = await admin.post(`/api/admin/trainings/${t2}/status`, { action: 'cancel' });
  ok(r.status === 200 && r.data.training.status === 'cancelled', 'מנהל מבטל אימון עם נרשמים');
  ok(db.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind='training_cancelled' AND training_id=?`).get(t2).n === 2, 'כל הנרשמים קיבלו הודעה');
  r = await c1.post(`/api/trainings/${t2}/register`);
  ok(r.status === 409, 'הרשמה לאימון שבוטל חסומה');
  r = await c1.get('/api/me/registrations');
  ok(r.data.items.some(t => t.id === t2 && t.status === 'cancelled'), 'הביטול מוצג באזור האישי');
  const t4 = await mkTraining('אימון מלא עם המתנה', 1, 6);
  await c1.post(`/api/trainings/${t4}/register`); await c2.post(`/api/trainings/${t4}/waitlist/join`);
  await admin.post(`/api/admin/trainings/${t4}/status`, { action: 'cancel' });
  ok(db.prepare(`SELECT COUNT(*) n FROM registrations WHERE training_id=? AND status IN ('confirmed','waitlist','offered')`).get(t4).n === 0, 'ביטול אימון מבטל גם המתנה והצעות פעילות');
  // closing registration stops new offers
  const t5 = await mkTraining('סגירת הרשמה', 1, 7);
  await c1.post(`/api/trainings/${t5}/register`); await c2.post(`/api/trainings/${t5}/waitlist/join`);
  await admin.post(`/api/admin/trainings/${t5}/status`, { action: 'close' });
  await c1.post(`/api/trainings/${t5}/cancel`);
  ok(regs(t5)[m2] === 'waitlist', 'סגירת הרשמה מפסיקה הצעות חדשות');

  section('5. אבטחה');
  const bf = new Client();
  for (let i = 0; i < 5; i++) await bf.post('/api/auth/login', { phone: '0503333302', password: 'wrong' + i });
  r = await bf.post('/api/auth/login', { phone: '0503333302', password: 'Member1234' });
  ok(r.status === 429, 'אחרי 5 ניסיונות כושלים הכניסה חסומה גם עם סיסמה נכונה');
  db.prepare('DELETE FROM login_fail').run();
  r = await admin.patch(`/api/admin/users/${adminId}`, { roles: ['member'] });
  ok(r.status === 403, 'מנהל־על מוגן מהורדת הרשאות');
  r = await admin.patch(`/api/admin/users/${adminId}`, { status: 'disabled' });
  ok(r.status === 403, 'מנהל־על מוגן מהשבתה');
  r = await c1.get('/api/admin/users'); ok(r.status === 403, 'חבר לא ניגש לממשק ניהול');
  r = await pub.get('/api/admin/users'); ok(r.status === 401, 'אורח לא ניגש לממשק ניהול');
  r = await pub.req('POST', '/api/auth/login', { phone: '0501111111', password: 'Admin1234' }, { headers: { 'x-df': '' } });
  ok(r.status === 403, 'בקשת POST ללא כותרת CSRF נדחית');
  // private files
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  r = await c1.req('PUT', '/api/me/photo', png, { raw: true, headers: { 'content-type': 'image/png' } });
  ok(r.status === 200, 'העלאת תמונת פרופיל');
  r = await c1.req('PUT', '/api/me/photo', Buffer.from('<?php echo 1;'), { raw: true, headers: { 'content-type': 'image/png' } });
  ok(r.status === 400, 'קובץ מתחזה לתמונה נדחה');
  r = await c1.get(`/api/photos/${m1}`); ok(r.status === 200, 'החבר רואה את התמונה שלו');
  r = await c2.get(`/api/photos/${m1}`); ok(r.status === 403, 'חבר אחר לא רואה תמונה פרטית');
  r = await pub.get(`/api/photos/${m1}`); ok(r.status === 401, 'אורח לא רואה תמונה פרטית');
  const f = await fetch(base + '/private/photos/x.png'); ok(f.status === 404, 'התיקייה הפרטית לא מוגשת סטטית');
  const f2 = await fetch(base + '/df.sqlite'); ok(f2.status === 404, 'קובץ מסד הנתונים לא נגיש');
  // disabling ends sessions, keeps history
  const victim = new Client(); await victim.login('0503333303', 'Member1234');
  await admin.patch(`/api/admin/users/${m3}`, { status: 'disabled' });
  r = await victim.get('/api/trainings'); ok(r.status === 401, 'השבתת חשבון מסיימת הפעלה פעילה');
  ok(db.prepare('SELECT COUNT(*) n FROM results WHERE user_id=?').get(m3).n === 2, 'היסטוריית הפעילות נשמרת');
  await admin.patch(`/api/admin/users/${m3}`, { status: 'active' });
  r = await new Client().post('/api/auth/login', { phone: '0503333303', password: 'Member1234' }); ok(r.status === 200, 'חשבון שהופעל מחדש יכול להיכנס');
  ok(db.prepare("SELECT COUNT(*) n FROM users WHERE phone IN ('admin','0000000000')").get().n === 0, 'אין חשבונות ברירת מחדל');

  section('7. נוכחות ו־Excel');
  const tAtt = t1;
  r = await coach.post(`/api/instructor/trainings/${tAtt}/attendance`, { user_id: m3, status: 'present' });
  ok(r.status === 200, 'מדריך מסמן "הגיע"');
  r = await coach.post(`/api/instructor/trainings/${tAtt}/attendance`, { user_id: m1, status: 'present' });
  ok(r.status === 404, 'אי אפשר לסמן נוכחות למי שאינו רשום');
  r = await admin.get(`/api/admin/trainings/${tAtt}/report`);
  const names = r.data.rows.map(x => x.name);
  ok(r.data.rows.length === 3, 'הדוח כולל גם מי שביטל ומי שהפסיד בהמתנה');
  ok(r.data.rows.find(x => x.name === 'חבר 03').attendance === 'הגיע', 'מצב נוכחות "הגיע" בדוח');
  ok(r.data.rows.some(x => x.attendance === 'טרם סומן'), 'ברירת מחדל "טרם סומן"');
  ok(r.data.rows.some(x => x.registration === 'ביטל הרשמה'), 'מי שביטל מופיע בדוח');
  const xl = await admin.get(`/api/admin/trainings/${tAtt}/report.xlsx`);
  ok(xl.status === 200 && xl.data[0] === 0x50 && xl.data[1] === 0x4B, 'קובץ Excel תקין (zip)');
  const ExcelJS = require('exceljs'); const wb = new ExcelJS.Workbook(); await wb.xlsx.load(xl.data);
  const ws = wb.worksheets[0]; const xrows = []; ws.eachRow((row, n) => { if (n >= 6) xrows.push([row.getCell(1).value, row.getCell(3).value, row.getCell(4).value]); });
  ok(JSON.stringify(xrows) === JSON.stringify(r.data.rows.map(x => [x.name, x.registration, x.attendance])), 'קובץ ה־Excel זהה לדוח האימון');
  r = await c1.get(`/api/admin/trainings/${tAtt}/report.xlsx`); ok(r.status === 403, 'חבר לא מוריד דוחות');

  section('8. גרף התקדמות');
  await c3.login('0503333303', 'Member1234');
  const t6 = await mkTraining('אימון עוד', 1, 8);
  db.prepare(`UPDATE trainings SET starts_at=? WHERE id=?`).run(new Date(Date.now() + 8 * 86400e3).toISOString(), t6);
  await c3.post(`/api/trainings/${t6}/register`);
  await coach.put(`/api/instructor/trainings/${t6}/members/${m3}`, { publish: true, feedback: 'שיפור', records: [{ exercise_id: exId, target_type: 'paper', a: 9, c: 2, d: 0, misses: 0, time_sec: 10.1 }] });
  r = await c3.get(`/api/me/progress?exercise_id=${exId}`);
  ok(r.data.points.length === 2, 'שתי תוצאות לאותו תרגיל מוצגות');
  ok(r.data.points[0].starts_at < r.data.points[1].starts_at, 'ממוינות לפי תאריך האימון');
  ok(r.data.feedback.length === 2, 'המשובים המשויכים מוצגים לצד הגרף');
  ok(r.data.points.every(p => p.id !== undefined) && !JSON.stringify(r.data).includes('תרגיל ידני'), 'תוצאה ידנית לא נכנסת להשוואה');
  r = await c3.get(`/api/me/progress?exercise_id=99999`); ok(r.status === 404, 'תרגיל לא קיים מחזיר שגיאה');

  section('9. שילוב תפקידים (מדריך שהוא גם חבר)');
  r = await admin.patch(`/api/admin/users/${inst2Id}`, { roles: ['member', 'instructor'] });
  ok(r.status === 200 && r.data.user.roles.join() === 'member,instructor', 'מנהל מגדיר למדריך גם תפקיד חבר');
  const both = new Client(); await both.login('0502222223', 'Coach1234');
  r = await both.get('/api/auth/me'); ok(r.data.user.roles.length === 2, 'המשתמש נכנס עם שני תפקידים');
  const t7 = await mkTraining('אימון למדריך-חבר', 3, 9);
  r = await both.post(`/api/trainings/${t7}/register`); ok(r.status === 200, 'מדריך־חבר נרשם לאימון');
  r = await both.get('/api/instructor/trainings'); ok(r.status === 200, 'ועדיין ניגש לממשק המדריך');
  r = await both.get('/api/admin/users'); ok(r.status === 403, 'ללא הרשאת מנהל — אין גישה לניהול');
  r = await admin.patch(`/api/admin/users/${instId}`, { roles: ['member'] });
  ok(r.status === 409, 'לא ניתן להסיר תפקיד מדריך ממי ששויך לאימונים פעילים');
  r = await admin.patch(`/api/admin/users/${adminId}`, { roles: ['member', 'admin'] });
  ok(r.status === 403, 'מנהל־על לא משנה תפקידים גם בשילוב');
  r = await admin.patch(`/api/admin/users/${m1}`, { roles: [] }); ok(r.status === 400, 'רשימת תפקידים ריקה נדחית');
  r = await c1.get('/api/me/stats'); ok(r.status === 200 && 'attended' in r.data, 'סטטיסטיקות אישיות');
  r = await admin.get('/api/admin/dashboard'); ok(r.status === 200 && r.data.active_members >= 3, 'דשבורד מנהל');

  section('10. יומן (.ics), תזכורות ופרסום כל הטיוטות');
  const t8 = await mkTraining('אימון לתזכורת', 3, 1);
  db.prepare('UPDATE trainings SET starts_at=? WHERE id=?').run(new Date(Date.now() + 20 * 3600e3).toISOString(), t8);
  r = await c1.post(`/api/trainings/${t8}/register`); ok(r.status === 200, 'חבר נרשם לאימון קרוב');
  r = await c1.get(`/api/trainings/${t8}/calendar.ics`);
  const ics = r.status === 200 ? r.data.toString('utf8') : '';
  ok(r.status === 200 && (r.headers.get('content-type') || '').includes('text/calendar'), 'קובץ יומן מוחזר לנרשם');
  ok(ics.includes('BEGIN:VEVENT') && ics.includes('DTSTART:') && ics.includes('SUMMARY:אימון לתזכורת') && (ics.match(/BEGIN:VALARM/g) || []).length === 2 && ics.includes('\r\n'), 'הקובץ כולל אירוע ושתי תזכורות');
  ok(ics.split('\r\n').every(l => Buffer.byteLength(l) <= 75), 'שורות הקובץ אינן עוברות 75 בתים');
  const c2b = new Client(); await c2b.login('0503333302', 'Member1234');
  r = await c2b.get(`/api/trainings/${t8}/calendar.ics`); ok(r.status === 404, 'מי שלא רשום לא מקבל קובץ יומן');
  r = await pub.get(`/api/trainings/${t8}/calendar.ics`); ok(r.status === 401, 'אורח לא מקבל קובץ יומן');
  const sent1 = T.remind();
  const n1 = db.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id=? AND kind='reminder' AND training_id=?`).get(m1, t8).n;
  ok(sent1 >= 1 && n1 === 1, 'נשלחת תזכורת פנימית לנרשם לאימון שמתחיל בתוך 24 שעות');
  ok(T.remind() === 0 && db.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id=? AND kind='reminder' AND training_id=?`).get(m1, t8).n === 1, 'התזכורת לא נשלחת פעמיים');
  const noRem = db.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id=? AND kind='reminder' AND training_id=?`).get(m2, t8).n;
  ok(noRem === 0, 'מי שלא רשום לא מקבל תזכורת');

  const t9 = await mkTraining('אימון פרסום', 3, 1);
  await c1.post(`/api/trainings/${t9}/register`); await c3.post(`/api/trainings/${t9}/register`);
  const rec10 = { exercise_id: exId, target_type: 'paper', a: 5, c: 1, d: 0, misses: 0, time_sec: 9.5 };
  await coach.put(`/api/instructor/trainings/${t9}/members/${m1}`, { publish: false, feedback: 'כל הכבוד', records: [rec10] });
  await coach.put(`/api/instructor/trainings/${t9}/members/${m3}`, { publish: false, records: [rec10] });
  ok(db.prepare('SELECT COUNT(*) n FROM results WHERE training_id=? AND published=1').get(t9).n === 0, 'הגיליונות נשמרו כטיוטה');
  r = await c1.post(`/api/instructor/trainings/${t9}/publish-drafts`); ok(r.status === 403, 'חבר לא מפרסם טיוטות');
  r = await both.post(`/api/instructor/trainings/${t9}/publish-drafts`); ok(r.status !== 200, 'מדריך אחר לא מפרסם טיוטות של אימון שאינו שלו');
  r = await coach.post(`/api/instructor/trainings/${t9}/publish-drafts`);
  ok(r.status === 200 && r.data.published === 2, 'המדריך מפרסם את כל הטיוטות בלחיצה אחת');
  ok(db.prepare('SELECT COUNT(*) n FROM results WHERE training_id=? AND published=1').get(t9).n === 2 && db.prepare('SELECT COUNT(*) n FROM feedback WHERE training_id=? AND published=1').get(t9).n === 1, 'התוצאות והמשוב סומנו כמפורסמים');
  ok(db.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind='results_published' AND training_id=?`).get(t9).n === 2, 'כל משתתף קיבל הודעה על פרסום');
  r = await coach.post(`/api/instructor/trainings/${t9}/publish-drafts`); ok(r.status === 200 && r.data.published === 0, 'פרסום חוזר לא משנה דבר');

  section('11. בונה תרגילים (אופציונלי)');
  const t10 = await mkTraining('אימון עם תכנית', 4, 3);
  await c1.post(`/api/trainings/${t10}/register`);
  const layout = { items: [{ t: 'paper', x: 100, y: 80, r: 0 }, { t: 'paper', x: 160, y: 80, r: 30 }, { t: 'popper', x: 220, y: 60, r: 0 }, { t: 'noshoot', x: 130, y: 80, r: 0 }, { t: 'start', x: 200, y: 260, r: 0 }] };
  r = await c1.post(`/api/instructor/trainings/${t10}/stages`, { name: 'שלב א', layout }); ok(r.status === 403, 'חבר לא בונה תרגילים');
  r = await coach.post(`/api/instructor/trainings/${t10}/stages`, { name: 'שלב א', description: 'עמידה, נרתיק', exercise_id: exId, layout });
  ok(r.status === 200 && r.data.stage.layout.items.length === 5 && r.data.stage.exercise_name === 'תרגיל בדיקה', 'מדריך יוצר תרגיל עם סכמה וקישור למאגר');
  const sid1 = r.data.stage.id;
  r = await coach.post(`/api/instructor/trainings/${t10}/stages`, { name: 'שלב ב', layout: { items: [] } }); const sid2 = r.data.stage.id;
  ok(r.status === 200, 'תרגיל בלי פריטים מותר');
  r = await coach.post(`/api/instructor/trainings/${t10}/stages`, { name: 'א', layout }); ok(r.status === 400, 'שם קצר מדי נדחה');
  r = await coach.post(`/api/instructor/trainings/${t10}/stages`, { name: 'לא תקין', layout: { items: [{ t: 'bomb', x: 1, y: 1 }] } }); ok(r.status === 400, 'סוג פריט לא מוכר נדחה');
  r = await coach.post(`/api/instructor/trainings/${t10}/stages`, { name: 'מחוץ לשטח', layout: { items: [{ t: 'paper', x: 999, y: 1 }] } }); ok(r.status === 400, 'מיקום מחוץ לשטח נדחה');
  r = await coach.post(`/api/instructor/trainings/${t10}/stages`, { name: 'הרבה', layout: { items: Array.from({ length: 61 }, () => ({ t: 'paper', x: 1, y: 1 })) } }); ok(r.status === 400, 'יותר מ־60 פריטים נדחה');
  r = await coach.post(`/api/instructor/trainings/${t10}/stages`, { name: 'תרגיל לא קיים', exercise_id: 987654, layout }); ok(r.status === 400, 'קישור לתרגיל שאינו במאגר נדחה');
  r = await both.put(`/api/instructor/stages/${sid1}`, { name: 'חטיפה', layout }); ok(r.status === 403, 'מדריך אחר לא עורך את התרגילים');
  r = await coach.put(`/api/instructor/stages/${sid1}`, { name: 'שלב א מעודכן', description: 'חדש', layout: { items: [{ t: 'wall', x: 50.55, y: 20, r: -90 }] } });
  ok(r.status === 200 && r.data.stage.name === 'שלב א מעודכן' && r.data.stage.layout.items[0].r === 270 && r.data.stage.layout.items[0].x === 50.6, 'עריכה מנרמלת סיבוב ומעגלת מיקום');
  r = await coach.post(`/api/instructor/stages/${sid2}/move`, { dir: 'up' });
  ok(r.status === 200 && r.data.items[0].id === sid2 && r.data.items[1].id === sid1, 'שינוי סדר התרגילים');
  r = await coach.post(`/api/instructor/stages/${sid1}/copy`, {}); ok(r.status === 200 && r.data.stage.name.endsWith('(עותק)'), 'שכפול תרגיל');
  r = await c1.get(`/api/trainings/${t10}/stages`); ok(r.status === 200 && r.data.items.length === 3, 'נרשם רואה את תכנית האימון');
  r = await c2b.get(`/api/trainings/${t10}/stages`); ok(r.status === 200, 'אימון פתוח: גם חבר שלא נרשם רואה את התכנית');
  r = await pub.get(`/api/trainings/${t10}/stages`); ok(r.status === 401, 'אורח לא רואה תכנית');
  r = await coach.req('DELETE', `/api/instructor/stages/${sid2}`); ok(r.status === 200, 'מחיקת תרגיל');
  r = await coach.get(`/api/instructor/trainings/${t10}/stages`); ok(r.data.items.length === 2, 'התרגיל נמחק מהתכנית');
  await admin.post(`/api/admin/trainings/${t10}/status`, { action: 'cancel' });
  r = await coach.post(`/api/instructor/trainings/${t10}/stages`, { name: 'באימון מבוטל', layout }); ok(r.status === 409, 'באימון מבוטל אי אפשר להוסיף תרגילים');

  section('12. מקום האימונים ברירת מחדל וניווט');
  r = await admin.get('/api/admin/settings');
  ok(r.data.settings.location_name === 'מטווח נץ המדבר' && r.data.settings.location_map_url.startsWith('https://www.google.com/maps/'), 'ברירת מחדל: מטווח נץ המדבר וקישור המפה');
  const t11 = await mkTraining('אימון במקום ברירת המחדל', 5, 4);
  db.prepare('UPDATE trainings SET location=? WHERE id=?').run('מטווח נץ המדבר', t11);
  await c1.post(`/api/trainings/${t11}/register`);
  r = await c1.get(`/api/trainings/${t11}`);
  ok(r.data.training.nav.maps.startsWith('https://www.google.com/maps/place/') && r.data.training.nav.waze.includes('waze.com/ul?q='), 'אימון במטווח המועדון מקבל קישורי ניווט שמורים');
  r = await admin.put('/api/admin/settings', { location_address: 'רחוב הדוגמה 1, שדרות' });
  ok(r.status === 200, 'מנהל מעדכן כתובת לניווט');
  r = await c1.get(`/api/trainings/${t11}`);
  ok(decodeURIComponent(r.data.training.nav.waze).includes('רחוב הדוגמה 1') && r.data.training.nav.address === 'רחוב הדוגמה 1, שדרות', 'עם כתובת Waze מנווט לפי הכתובת');
  const ics2 = (await c1.get(`/api/trainings/${t11}/calendar.ics`)).data.toString('utf8').replace(/\r\n /g, '');
  ok(ics2.includes('LOCATION:מטווח נץ המדבר\\, רחוב הדוגמה 1\\, שדרות'), 'קובץ היומן כולל את הכתובת');
  db.prepare('UPDATE trainings SET location=? WHERE id=?').run('אולם אחר, תל אביב', t11);
  r = await c1.get(`/api/trainings/${t11}`);
  ok(r.data.training.nav.maps.includes('maps/search') && decodeURIComponent(r.data.training.nav.maps).includes('אולם אחר') && r.data.training.nav.address === '', 'מקום אחר מחפש לפי הטקסט שלו');
  r = await admin.put('/api/admin/settings', { location_map_url: 'javascript:alert(1)' }); ok(r.status === 400, 'קישור מפה לא בטוח נדחה');
  r = await admin.put('/api/admin/settings', { location_name: 'א' }); ok(r.status === 400, 'שם מקום קצר מדי נדחה');
  await admin.put('/api/admin/settings', { location_address: 'מתחם MALL 7, דרך מנחם בגין, שדרות' });

  console.log(`\n${pass} passed, ${fail} failed`);
  server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
