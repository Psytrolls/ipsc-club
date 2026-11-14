'use strict';
// DEMO DATA ONLY — never run against a real club database. Passwords are public in this file.
const { db, createUser, nowIso } = require('../db');
const L = require('../lib');
if (db.prepare('SELECT COUNT(*) n FROM users').get().n) { console.error('Database is not empty; refusing to seed.'); process.exit(1); }

const admin = createUser({ phone: '0500000001', name: 'מנהל־על לדוגמה', password: 'Admin1234', role: 'admin', isSuper: true });
const inst = createUser({ phone: '0500000002', name: 'דני המדריך', password: 'Coach1234', roles: ['instructor', 'member'] });
const m1 = createUser({ phone: '0500000003', name: 'יוסי כהן', password: 'Member1234', role: 'member' });
const m2 = createUser({ phone: '0500000004', name: 'רונית לוי', password: 'Member1234', role: 'member' });
createUser({ phone: '0500000005', name: 'אבי מזרחי', password: 'Member1234', role: 'member' });

const ex = ['שדה פתוח 6 מטרות', 'דריל בסיסי', 'רחפן 12 יריות', 'החלפת מחסנית', 'סטנדרט מספרים'].map(n =>
  Number(db.prepare('INSERT INTO exercises(name,description) VALUES(?,?)').run(n, null).lastInsertRowid));

const day = 86400e3, at = (d, h) => { const x = new Date(Date.now() + d * day); x.setUTCHours(h, 0, 0, 0); return x.toISOString(); };
const mk = (title, starts, cap, status) => Number(db.prepare(`INSERT INTO trainings(title,starts_at,location,instructor_id,capacity,status,created_at,updated_at)
  VALUES(?,?,?,?,?,?,?,?)`).run(title, starts, 'מטווח המועדון', inst, cap, status, nowIso(), nowIso()).lastInsertRowid);
const past1 = mk('אימון בסיסי', at(-21, 16), 12, 'done');
const past2 = mk('אימון דיוק ומהירות', at(-7, 16), 12, 'done');
mk('אימון שבועי', at(3, 16), 3, 'open');
mk('אימון מתקדמים', at(10, 16), 10, 'open');
mk('אימון טיוטה', at(17, 16), 10, 'draft');

for (const [tid, base] of [[past1, 1.4], [past2, 0]]) {
  for (const uid of [m1, m2]) {
    db.prepare(`INSERT INTO registrations(training_id,user_id,status,created_at,updated_at) VALUES(?,?, 'confirmed', ?, ?)`).run(tid, uid, nowIso(), nowIso());
    db.prepare(`INSERT INTO attendance(training_id,user_id,status,marked_by,marked_at) VALUES(?,?, 'present', ?, ?)`).run(tid, uid, inst, nowIso());
    const t = 14 - base * 3 + (uid === m2 ? 1 : 0);
    db.prepare(`INSERT INTO results(training_id,user_id,exercise_id,target_type,a,c,d,misses,time_sec,published,created_by,created_at)
      VALUES(?,?,?, 'paper', 8, 3, 1, ?, ?, 1, ?, ?)`).run(tid, uid, ex[0], base ? 3 : 1, t, inst, nowIso());
    db.prepare(`INSERT INTO feedback(training_id,user_id,text,published,author_id,updated_at) VALUES(?,?,?,1,?,?)`)
      .run(tid, uid, base ? 'התחלה טובה. כדאי לעבוד על יציאה מהירה מהקו.' : 'שיפור יפה בזמן ובדיוק. המשך כך.', inst, nowIso());
  }
}
db.prepare(`INSERT INTO news(title,body,created_at) VALUES(?,?,?)`).run('ברוכים הבאים לאתר החדש', 'כאן יפורסמו עדכונים, מועדי אימונים ותחרויות.', nowIso());
console.log('Demo data created.\n  admin       0500000001 / Admin1234\n  instructor  0500000002 / Coach1234\n  members     0500000003..5 / Member1234');
