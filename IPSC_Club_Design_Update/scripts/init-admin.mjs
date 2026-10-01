import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Miniflare } from 'miniflare';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { normalizePhone } from '../server/phone.mjs';

const origin = process.env.APP_ORIGIN || 'https://ipsc.magavnegev.co.il';
const dataDir = path.resolve(process.env.DATA_DIR || './data');
const d1Dir = path.join(dataDir, 'd1');
const r2Dir = path.join(dataDir, 'r2');

// Parse args or env vars
const args = process.argv.slice(2);
let phone = process.env.ADMIN_PHONE || '0501234567';
let password = process.env.ADMIN_PASSWORD || 'Falcon2026';
let name = process.env.ADMIN_NAME || 'מנהל ראשי';
let email = process.env.ADMIN_EMAIL || 'admin@magavnegev.co.il';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--phone' && args[i + 1]) phone = args[++i];
  else if (args[i] === '--password' && args[i + 1]) password = args[++i];
  else if (args[i] === '--name' && args[i + 1]) name = args[++i];
  else if (args[i] === '--email' && args[i + 1]) email = args[++i];
}

const normPhone = normalizePhone(phone);
if (!normPhone) {
  console.error(`❌ Error: Invalid Israeli phone number: ${phone}`);
  process.exit(1);
}

if (password.length < 6 || !/\p{L}/u.test(password) || !/\d/.test(password)) {
  console.error(`❌ Error: Password must be at least 6 chars and contain letters and numbers.`);
  process.exit(1);
}

console.log(`🔧 Initializing SuperAdmin account for Desert Falcon...`);
console.log(`- Phone: ${normPhone} (${phone})`);
console.log(`- Name: ${name}`);
console.log(`- Email: ${email}`);

const mf = new Miniflare({
  workers: [
    {
      name: 'desert-falcon',
      modules: true,
      script: 'export default { fetch() { return new Response("ok"); } }',
      d1Databases: { DB: 'desert-falcon-db' },
    },
  ],
  d1Persist: d1Dir,
  r2Persist: r2Dir,
});

try {
  const db = await mf.getD1Database('DB');
  
  // Ensure revisions
  await db.prepare("INSERT OR IGNORE INTO revisions VALUES('club', '0')").run();

  // Check if admin already exists
  const accounts = await db.prepare("SELECT * FROM accounts").all();
  let existingAdmin = accounts.results?.find(r => {
    try {
      const u = JSON.parse(r.data);
      return normalizePhone(u.phone) === normPhone || u.email === email.toLowerCase();
    } catch {
      return false;
    }
  });

  const userId = existingAdmin ? existingAdmin.id : randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const version = randomUUID();

  const userObj = {
    id: userId,
    email: email.toLowerCase(),
    fullName: name,
    phone: normPhone,
    role: 'admin',
    roles: ['admin', 'instructor', 'shooter'],
    membershipStatus: 'active',
    ipscCourseVerified: true,
    joinedDate: new Date().toISOString().slice(0, 10),
    twoFactorEnabled: false,
    mustChangePassword: false,
  };

  // Upsert account
  await db.prepare(
    "INSERT INTO accounts (id, email, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET email=excluded.email, data=excluded.data"
  ).bind(userId, email.toLowerCase(), JSON.stringify(userObj)).run();

  // Upsert credentials
  const credsObj = {
    id: userId,
    passwordHash,
    version,
    failed: 0,
    lockedUntil: 0,
  };
  await db.prepare(
    "INSERT INTO records (kind, id, data) VALUES ('credentials', ?, ?) ON CONFLICT(kind, id) DO UPDATE SET data=excluded.data"
  ).bind(userId, JSON.stringify(credsObj)).run();

  // Set platform owner
  const ownerObj = {
    id: 'owner',
    platformId: 'truenas-admin',
    userId: userId,
  };
  await db.prepare(
    "INSERT INTO records (kind, id, data) VALUES ('platform', 'owner', ?) ON CONFLICT(kind, id) DO UPDATE SET data=excluded.data"
  ).bind(JSON.stringify(ownerObj)).run();

  console.log(`\n🎉 SuperAdmin account ready!`);
  console.log(`📱 Login phone: ${phone}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`🌐 Login URL: ${origin}`);
} catch (e) {
  console.error('Failed to init admin:', e);
} finally {
  await mf.dispose();
}
