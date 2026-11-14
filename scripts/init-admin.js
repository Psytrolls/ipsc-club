'use strict';
// Usage: npm run init-admin -- 0501234567 "Full Name" "Password1"
// Creates the protected super-admin. There are NO default accounts in this system.
const { db, createUser, audit } = require('../db');
const L = require('../lib');
const [, , rawPhone, name, password] = process.argv;
const phone = L.normalizePhone(rawPhone || '');
if (!phone || !name || !L.passwordOk(password || '')) {
  console.error(`Usage: npm run init-admin -- <05XXXXXXXX> "<name>" "<password>"\n${L.PASSWORD_POLICY.message}`);
  process.exit(1);
}
if (db.prepare('SELECT 1 FROM users WHERE is_super=1').get()) { console.error('A super-admin already exists.'); process.exit(1); }
const id = createUser({ phone, name, password, role: 'admin', isSuper: true });
audit(id, 'super_admin_created', `user:${id}`, null);
console.log('Super-admin created:', phone);
