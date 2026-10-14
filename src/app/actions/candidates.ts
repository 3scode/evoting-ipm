'use server';

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { supabaseService, supabaseServer } from '@/lib/supabase/server';
import { ok, fail } from '@/lib/api-response';

const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 2);

export async function upsertCandidate(formData: FormData) {
  const sb = await supabaseServer();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) return fail('UNAUTHORIZED', 'Login admin dulu');
  const parsed = z
    .object({
      id: z.string().uuid().optional(),
      candidate_number: z.coerce.number().int().min(1).max(20),
      name: z.string().min(3).max(120),
      vision_mission: z.string().min(10).max(2000),
    })
    .safeParse({
      id: formData.get('id') || undefined,
      candidate_number: formData.get('candidate_number'),
      name: formData.get('name'),
      vision_mission: formData.get('vision_mission'),
    });
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Form kandidat tidak valid');
  const cleanVision = DOMPurify.sanitize(parsed.data.vision_mission, { ALLOWED_TAGS: ['p', 'br', 'ul', 'ol', 'li', 'b', 'i'] });
  const db = supabaseService();
  let photoPath: string | undefined;
  const file = formData.get('photo') as File | null;
  if (file && file.size > 0) {
    if (file.size > MAX_MB * 1024 * 1024) return fail('VALIDATION_ERROR', `Foto maksimal ${MAX_MB}MB`);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return fail('VALIDATION_ERROR', 'Foto harus jpg/png/webp');
    photoPath = `candidates/${parsed.data.candidate_number}-${Date.now()}.jpg`;
    const { error } = await db.storage.from(process.env.STORAGE_BUCKET ?? 'candidates').upload(photoPath, file, { upsert: true, contentType: file.type });
    if (error) return fail('INTERNAL_ERROR', error.message);
  }
  const payload: Record<string, unknown> = {
    candidate_number: parsed.data.candidate_number,
    name: parsed.data.name,
    vision_mission: cleanVision,
  };
  if (photoPath) payload.photo_url = photoPath;
  const query = parsed.data.id
    ? db.from('candidates').update(payload).eq('id', parsed.data.id).select('id').single()
    : db.from('candidates').insert(payload).select('id').single();
  const { data, error } = await query;
  if (error) {
    if (error.code === '23505') return fail('VALIDATION_ERROR', 'Nomor urut sudah dipakai');
    return fail('INTERNAL_ERROR', error.message);
  }
  return ok(data);
}

export async function deleteCandidate(input: { id: string; confirmName?: string }) {
  const parsed = z.object({ id: z.string().uuid(), confirmName: z.string().optional() }).safeParse(input);
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Input tidak valid');
  const sb = await supabaseServer();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) return fail('UNAUTHORIZED', 'Login admin dulu');
  const db = supabaseService();
  const { count } = await db.from('votes').select('id', { count: 'exact', head: true }).eq('candidate_id', parsed.data.id);
  if ((count ?? 0) > 0 && !parsed.data.confirmName) {
    return fail('FORBIDDEN', `Paslon sudah punya ${count} suara. Kirim confirmName untuk menghapus.`);
  }
  const { error } = await db.from('candidates').delete().eq('id', parsed.data.id);
  if (error) return fail('INTERNAL_ERROR', error.message);
  return ok({ deleted: true });
}
