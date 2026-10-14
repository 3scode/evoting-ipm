'use server';

import { z } from 'zod';
import { cookies, headers } from 'next/headers';
import { supabaseService } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { ok, fail } from '@/lib/api-response';

const lookupSchema = z.object({
  voter_id_number: z.string().trim().regex(/^[0-9]{8,18}$/, 'NISN/NIP harus 8-18 digit angka'),
});

export async function lookupVoter(input: { voter_id_number: string }) {
  const parsed = lookupSchema.safeParse(input);
  if (!parsed.success) return fail('VALIDATION_ERROR', 'NISN/NIP harus 8-18 digit angka');
  const jar = await cookies();
  const kioskId = jar.get('kiosk-session')?.value;
  if (!kioskId) return fail('UNAUTHORIZED', 'Sesi bilik tidak valid. Login ulang.');
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for') ?? kioskId;
  if (!rateLimit(`lookup:${ip}`, 10, 60_000)) {
    return fail('RATE_LIMITED', 'Terlalu sering cek. Tunggu sebentar.');
  }
  const db = supabaseService();
  const { data } = await db
    .from('voters')
    .select('id, voter_id_number, name, department, voter_type, has_voted, voted_at')
    .eq('voter_id_number', parsed.data.voter_id_number)
    .is('deleted_at', null)
    .single();
  if (!data) return fail('VOTER_NOT_FOUND', 'Data tidak ditemukan. Hubungi panitia DPT.');
  if (data.has_voted) return fail('ALREADY_VOTED', `NISN ini sudah memilih${data.voted_at ? ` pada ${data.voted_at}` : ''}.`);
  return ok({ id: data.id, name: data.name, department: data.department, voter_type: data.voter_type, voter_id_number: data.voter_id_number });
}

export async function confirmVoter(input: { voter_id: string }) {
  const parsed = z.object({ voter_id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return fail('VALIDATION_ERROR', 'voter_id tidak valid');
  const jar = await cookies();
  if (!jar.get('kiosk-session')?.value) return fail('UNAUTHORIZED', 'Sesi bilik tidak valid');
  const db = supabaseService();
  const { data } = await db.from('voters').select('id, has_voted').eq('id', parsed.data.voter_id).single();
  if (!data) return fail('VOTER_NOT_FOUND', 'Pemilih tidak ditemukan');
  if (data.has_voted) return fail('ALREADY_VOTED', 'NISN ini sudah memilih.');
  jar.set('voter-verified', parsed.data.voter_id, { httpOnly: true, sameSite: 'lax', maxAge: 300, path: '/' });
  return ok({ verified: true });
}
