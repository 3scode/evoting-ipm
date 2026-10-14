'use server';

import { z } from 'zod';
import { cookies, headers } from 'next/headers';
import { supabaseService } from '@/lib/supabase/server';
import { verifyPassword } from '@/lib/auth-kiosk';
import { rateLimit } from '@/lib/rate-limit';
import { ok, fail } from '@/lib/api-response';

const loginSchema = z.object({
  username: z.string().min(3).max(40).toLowerCase(),
  password: z.string().min(8).max(100),
});

export async function loginKiosk(input: { username: string; password: string }) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Username/password tidak valid');
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for') ?? 'local';
  if (!rateLimit(`kiosk-login:${ip}`, 5, 5 * 60_000)) {
    return fail('RATE_LIMITED', 'Terlalu banyak percobaan. Tunggu 5 menit.');
  }
  const db = supabaseService();
  const { data: kiosk } = await db.from('kiosks').select('*').eq('username', parsed.data.username).single();
  if (!kiosk) return fail('INVALID_CREDENTIALS', 'Username atau password salah');
  const valid = await verifyPassword(parsed.data.password, kiosk.password_hash);
  if (!valid) return fail('INVALID_CREDENTIALS', 'Username atau password salah');

  const jar = await cookies();
  jar.set('kiosk-session', kiosk.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 3600,
    path: '/',
  });
  await db.from('kiosks').update({ last_ping: new Date().toISOString(), is_active: true }).eq('id', kiosk.id);
  await db.from('audit_logs').insert({ actor: kiosk.username, action: 'kiosk_login', meta: { kiosk_id: kiosk.id } });
  return ok({ kioskName: kiosk.kiosk_name, kioskId: kiosk.id });
}

export async function kioskPing() {
  const jar = await cookies();
  const kioskId = jar.get('kiosk-session')?.value;
  if (!kioskId) return fail('UNAUTHORIZED', 'Sesi bilik tidak valid');
  const db = supabaseService();
  await db.from('kiosks').update({ last_ping: new Date().toISOString() }).eq('id', kioskId);
  return ok({ server_time: new Date().toISOString() });
}

export async function logoutKiosk() {
  const jar = await cookies();
  jar.delete('kiosk-session');
  jar.delete('voter-verified');
  return ok({ loggedOut: true });
}
