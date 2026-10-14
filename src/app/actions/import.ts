'use server';

import { z } from 'zod';
import { supabaseService, supabaseServer } from '@/lib/supabase/server';
import { ok, fail } from '@/lib/api-response';

const rowSchema = z.object({
  voter_id_number: z.string().regex(/^[0-9]{8,18}$/),
  name: z.string().min(3).max(120),
  department: z.string().min(1).max(80),
  voter_type: z.enum(['siswa', 'guru']),
});

export async function importVoters(input: { rows: unknown[] }) {
  const sb = await supabaseServer();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) return fail('UNAUTHORIZED', 'Login admin dulu');
  if (input.rows.length > 5000) return fail('VALIDATION_ERROR', 'Maksimal 5000 baris per import');
  const db = supabaseService();
  let inserted = 0;
  let skipped = 0;
  const errors: Array<{ line: number; reason: string }> = [];
  for (let i = 0; i < input.rows.length; i += 200) {
    const batch = input.rows.slice(i, i + 200);
    const valid: z.infer<typeof rowSchema>[] = [];
    batch.forEach((r, j) => {
      const p = rowSchema.safeParse(r);
      if (!p.success) {
        errors.push({ line: i + j + 2, reason: 'Format baris tidak valid' });
      } else valid.push(p.data);
    });
    if (valid.length === 0) continue;
    if (errors.length > input.rows.length * 0.5) {
      return fail('VALIDATION_ERROR', 'Terlalu banyak baris error, import dibatalkan', { errors: errors.slice(0, 20) });
    }
    const { data, error } = await db.from('voters').upsert(valid, { onConflict: 'voter_id_number', ignoreDuplicates: true }).select('id');
    if (error) {
      errors.push({ line: i + 2, reason: error.message });
      continue;
    }
    inserted += data.length;
    skipped += valid.length - data.length;
  }
  await db.from('audit_logs').insert({ actor: user.user.email ?? user.user.id, action: 'import_voters', meta: { inserted, skipped } });
  return ok({ inserted, skipped, errors });
}
