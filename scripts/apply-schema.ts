/**
 * Apply /app/db/schema.sql to Supabase Postgres.
 * Idempotency: schema.sql is intended for first-time deployment.
 *   Re-running will fail on duplicates. Use --reset to drop public schema first.
 *
 * Usage:
 *   yarn db:apply-schema            # apply only
 *   yarn db:apply-schema --reset    # DROP+RECREATE public schema, then apply
 *
 * Connects via direct Postgres on the Supabase pooler (port 5432).
 */
import { config as loadEnv } from 'dotenv';
import fs from 'fs';
import path from 'path';
loadEnv({ path: path.join(process.cwd(), '.env.local') });
import { Client } from 'pg';

async function main() {
  const reset = process.argv.includes('--reset');
  const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const host = process.env.SUPABASE_DB_HOST!;
  const password = process.env.SUPABASE_DB_PASSWORD!;
  const projectRef = (host.match(/db\.(.+?)\.supabase\.co/) || [])[1] || '';
  // Try multiple connection strategies (Supabase has 3 endpoints):
  //   1. direct        : db.<ref>.supabase.co:5432  (IPv6-only sometimes; may fail in containers)
  //   2. session pooler: aws-0-<region>.pooler.supabase.com:5432  (IPv4, persistent)
  //   3. txn pooler    : aws-0-<region>.pooler.supabase.com:6543  (IPv4, transaction-mode)
  const regions = ['ap-south-1', 'us-east-1', 'us-east-2', 'eu-central-1', 'ap-southeast-1'];
  const candidates: any[] = [
    { description: 'direct (5432)', host, port: 5432, user: 'postgres', database: 'postgres' },
  ];
  // Newer Supabase projects use aws-1-<region>; older use aws-0-<region>. Try both.
  for (const prefix of ['aws-1', 'aws-0']) {
    for (const r of regions) {
      candidates.push({
        description: `pooler ${prefix}-${r} (5432 session)`,
        host: `${prefix}-${r}.pooler.supabase.com`,
        port: 5432,
        user: `postgres.${projectRef}`,
        database: 'postgres',
      });
      candidates.push({
        description: `pooler ${prefix}-${r} (6543 txn)`,
        host: `${prefix}-${r}.pooler.supabase.com`,
        port: 6543,
        user: `postgres.${projectRef}`,
        database: 'postgres',
      });
    }
  }

  let lastErr: any;
  for (const c of candidates) {
    const client = new Client({
      host: c.host,
      port: c.port,
      user: c.user,
      password,
      database: c.database,
      ssl: { rejectUnauthorized: false },
      statement_timeout: 120_000,
      connectionTimeoutMillis: 15_000,
    });
    try {
      console.log(`[schema] connecting via ${c.description} -> ${c.host}:${c.port} (user=${c.user})`);
      await client.connect();
      console.log('[schema] connected');

      if (reset) {
        console.log('[schema] --reset: dropping & recreating public schema');
        await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;');
      }

      console.log('[schema] applying schema.sql ...');
      await client.query(sql);
      console.log('[schema] DONE');
      await client.end();
      return;
    } catch (e: any) {
      lastErr = e;
      console.warn(`[schema] failed via ${c.description}: ${e?.message ?? e}`);
      try { await client.end(); } catch {}
    }
  }
  throw lastErr ?? new Error('all connection candidates failed');
}

main().catch((e) => {
  console.error('[schema] FATAL', e?.message ?? e);
  process.exit(1);
});
