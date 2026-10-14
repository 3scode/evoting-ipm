import { NextResponse } from 'next/server';

export async function GET() {
  const started = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let dbMs: number | null = null;
  let dbOk = false;
  try {
    if (url) {
      const res = await fetch(`${url}/auth/v1/health`, {
        signal: AbortSignal.timeout(3000),
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
      });
      dbOk = res.ok;
    }
  } catch {
    dbOk = false;
  }
  dbMs = Date.now() - started;
  return NextResponse.json({ success: true, data: { ok: true, db_reachable: dbOk, db_ms: dbMs }, error: null });
}
