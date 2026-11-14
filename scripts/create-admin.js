'use strict';
// Usage: node scripts/create-admin.js <phone> "<name>" <password>
// Creates the protected super-admin. There are NO default accounts.
const bcrypt = require('bcryptjs');
const { db } = require('../src/db');
const [phoneRaw, name, password] = process.argv.slice(2);
const d = String(phoneRaw || '').replace(/\D/g, '').replace(/^972/, '0');
if (!/^05\d{8}$/.test(d) || !name || !password || password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password)) {
  console.error('Usage: node scripts/create-admin.js 0501234567 "Name" Password123 (8+ chars, letters and digits)');
  process.exit(1);
}
if (db.prepare('SELECT 1 FROM users WHERE phone=?').get(d)) { console.error('User already exists'); process.exit(1); }
db.prepare("INSERT INTO users(phone,name,password_hash,role,is_super) VALUES (?,?,?,'admin',1)").run(d, name, bcrypt.hashSync(password, 10));
console.log('Super-admin created:', d);
