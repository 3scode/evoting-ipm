import postgres from 'postgres';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require', connect_timeout: 15 });

const files = (await readdir('supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  const q = await readFile(join('supabase/migrations', f), 'utf8');
  console.log(`→ ${f} (${q.length} chars)`);
  try {
    await sql.unsafe(q);
    console.log(`  OK ${f}`);
  } catch (e) {
    console.error(`  FAIL ${f}:`, e instanceof Error ? e.message : e);
    process.exitCode = 1;
    break;
  }
}
await sql.end();
console.log('MIGRATE_DONE');
