'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { supabaseService } from '@/lib/supabase/server';
import { ok, fail } from '@/lib/api-response';

const voteSchema = z.object({
  candidate_id: z.string().uuid(),
});

export async function castVote(input: { candidate_id: string }) {
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Pilih kandidat dulu sebelum kirim.');
  const jar = await cookies();
  const kioskId = jar.get('kiosk-session')?.value;
  const voterId = jar.get('voter-verified')?.value;
  if (!kioskId) return fail('UNAUTHORIZED', 'Sesi bilik tidak valid. Ulangi dari awal.');
  if (!voterId) return fail('FORBIDDEN', 'Sesi verifikasi kedaluwarsa (5 menit). Ulangi dari input NISN.');
  const db = supabaseService();
  const { data, error } = await db.rpc('cast_vote', {
    p_voter_id: voterId,
    p_candidate_id: parsed.data.candidate_id,
    p_kiosk_id: kioskId,
  });
  if (error) return fail('INTERNAL_ERROR', error.message);
  const d = data as { success: boolean; code: string };
  if (!d.success) {
    if (d.code === 'ALREADY_VOTED') return fail('ALREADY_VOTED', 'NISN ini sudah memilih.');
    if (d.code === 'ELECTION_CLOSED') return fail('ELECTION_CLOSED', 'Pemilihan sedang jeda/ditutup.');
    return fail('NOT_FOUND', d.code);
  }
  jar.delete('voter-verified');
  return ok(data);
}
