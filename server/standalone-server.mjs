import 'dotenv/config';
import { Miniflare } from 'miniflare';
import { readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const origin = process.env.APP_ORIGIN || 'https://ipsc.magavnegev.co.il';
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const dataDir = path.resolve(process.env.DATA_DIR || './data');
const d1Dir = path.join(dataDir, 'd1');
const r2Dir = path.join(dataDir, 'r2');

mkdirSync(d1Dir, { recursive: true });
mkdirSync(r2Dir, { recursive: true });

console.log(`Starting Desert Falcon server...`);
console.log(`- Configured Domain / Origin: ${origin}`);
console.log(`- Persistent Data Directory: ${dataDir}`);
console.log(`- Listening Interface: ${host}:${port}`);

const mf = new Miniflare({
  port,
  host,
  workers: [
    {
      name: 'desert-falcon',
      modules: true,
      scriptPath: 'dist/server/index.js',
      compatibilityDate: '2026-08-01',
      compatibilityFlags: ['nodejs_compat', 'enable_nodejs_http_server_modules'],
      bindings: {
        APP_ORIGIN: origin,
        NODE_ENV: 'production',
        PRIVATE_OWNER_SETUP: process.env.PRIVATE_OWNER_SETUP || '1',
      },
      d1Databases: { DB: 'desert-falcon-db' },
      r2Buckets: { BUCKET: 'desert-falcon-photos' },
      assets: {
        directory: 'dist/client',
        binding: 'ASSETS',
        routerConfig: { has_user_worker: true },
        assetConfig: { not_found_handling: 'single-page-application' },
      },
    },
  ],
  d1Persist: d1Dir,
  r2Persist: r2Dir,
});

await mf.ready;

// Apply D1 migrations on start
try {
  const db = await mf.getD1Database('DB');
  const drizzleDir = path.resolve('drizzle');
  if (existsSync(drizzleDir)) {
    const migrationFiles = readdirSync(drizzleDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of migrationFiles) {
      const sqlContent = readFileSync(path.join(drizzleDir, file), 'utf8');
      const statements = sqlContent.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);
      for (const statement of statements) {
        try {
          await db.prepare(statement).run();
        } catch (e) {
          if (!e.message?.includes('already exists')) {
            // Ignore benign existing table/index errors
          }
        }
      }
    }
  }
} catch (err) {
  console.warn('Notice during migration run:', err?.message || err);
}

console.log(`✅ Desert Falcon is running and ready!`);
console.log(`🌐 Accessible via reverse proxy / Cloudflare Tunnel at: ${origin}`);

// Keep process alive and handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down Desert Falcon server...');
  await mf.dispose();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
