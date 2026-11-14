'use strict';
// Consistent backup of the database + private photos into data/backups/<timestamp>/.
// Usage: npm run backup   (run it from cron; copy the folder off the server). Test a restore before launch:
//   stop the server, replace data/df.sqlite with backups/<ts>/df.sqlite and data/private/photos with backups/<ts>/photos.
const fs = require('fs');
const path = require('path');
const { db, DATA_DIR, PHOTO_DIR } = require('../db');
(async () => {
  const dir = path.join(DATA_DIR, 'backups', new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  await db.backup(path.join(dir, 'df.sqlite')); // safe while the server is running
  fs.cpSync(PHOTO_DIR, path.join(dir, 'photos'), { recursive: true });
  const Database = require('better-sqlite3');
  const check = new Database(path.join(dir, 'df.sqlite'), { readonly: true });
  const users = check.prepare('SELECT COUNT(*) n FROM users').get().n;
  check.close();
  console.log(`Backup OK: ${dir} (${users} users verified)`);
})().catch(e => { console.error('Backup failed', e); process.exit(1); });
