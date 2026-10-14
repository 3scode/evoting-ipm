'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { supabaseService, supabaseServer } from '@/lib/supabase/server';
import { hashPassword, slugify, randomKioskPassword } from '@/lib/auth-kiosk';
import { ok, fail } from '@/lib/api-response';

async function requireAdmin() {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (data.user) return { user: data.user, debug: '' };
  const jar = await cookies();
  const names = jar.getAll().map((c) => c.name);
  const debug = `debug: ${names.length} cookies [${names.join(',') || 'kosong'}], getUserErr=${error?.message ?? 'none'}`;
  return { user: null as never, debug };
}

export async function createKiosk(input: { kiosk_name: string }) {
  const parsed = z.object({ kiosk_name: z.string().min(3).max(60) }).safeParse(input);
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Nama bilik minimal 3 karakter');
  const adm = await requireAdmin();
  if (!adm.user) return fail('UNAUTHORIZED', 'Login admin dulu. ' + adm.debug);
  const admin = adm.user;
  const username = slugify(parsed.data.kiosk_name) || `bilik-${Date.now()}`;
  const plain = randomKioskPassword();
  const db = supabaseService();
  const { data, error } = await db
    .from('kiosks')
    .insert({ kiosk_name: parsed.data.kiosk_name, username, password_hash: await hashPassword(plain) })
    .select('id, username, kiosk_name')
    .single();
  if (error) return fail('INTERNAL_ERROR', error.message);
  await db.from('audit_logs').insert({ actor: admin.email ?? admin.id, action: 'create_kiosk', meta: { username } });
  return ok({ ...data, password_plain_once: plain });
}

export async function resetKioskPassword(input: { id: string }) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Input tidak valid');
  const admX = await requireAdmin(); if (!admX.user) return fail('UNAUTHORIZED', 'Login admin dulu. ' + admX.debug);
  const admin = admX.user;
  const plain = randomKioskPassword();
  const db = supabaseService();
  const { data, error } = await db
    .from('kiosks')
    .update({ password_hash: await hashPassword(plain) })
    .eq('id', parsed.data.id)
    .select('id, username, kiosk_name')
    .single();
  if (error) return fail('INTERNAL_ERROR', error.message);
  await db.from('audit_logs').insert({ actor: admin.email ?? admin.id, action: 'reset_kiosk_password', meta: { username: data.username } });
  return ok({ ...data, password_plain_once: plain });
}

export async function resetAllKioskPasswords() {
  const admX = await requireAdmin(); if (!admX.user) return fail('UNAUTHORIZED', 'Login admin dulu. ' + admX.debug);
  const admin = admX.user;
  const db = supabaseService();
  const { data: list, error: listError } = await db.from('kiosks').select('id, username, kiosk_name').order('kiosk_name');
  if (listError) return fail('INTERNAL_ERROR', listError.message);
  if (!list || list.length === 0) return fail('NOT_FOUND', 'Belum ada bilik.');
  const out: Array<{ kiosk_name: string; username: string; password: string }> = [];
  for (const k of list) {
    const plain = randomKioskPassword();
    const { error } = await db.from('kiosks').update({ password_hash: await hashPassword(plain) }).eq('id', k.id);
    if (error) return fail('INTERNAL_ERROR', error.message);
    out.push({ kiosk_name: k.kiosk_name, username: k.username, password: plain });
  }
  await db.from('audit_logs').insert({ actor: admin.email ?? admin.id, action: 'reset_all_kiosk_passwords', meta: { count: out.length } });
  return ok({ cards: out });
}

export async function toggleKiosk(input: { id: string; is_active: boolean }) {
  const parsed = z.object({ id: z.string().uuid(), is_active: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Input tidak valid');
  const admX = await requireAdmin(); if (!admX.user) return fail('UNAUTHORIZED', 'Login admin dulu. ' + admX.debug);
  const db = supabaseService();
  const { error } = await db.from('kiosks').update({ is_active: parsed.data.is_active }).eq('id', parsed.data.id);
  if (error) return fail('INTERNAL_ERROR', error.message);
  return ok({ updated: true });
}

export async function deleteKiosk(input: { id: string }) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Input tidak valid');
  const admX = await requireAdmin(); if (!admX.user) return fail('UNAUTHORIZED', 'Login admin dulu. ' + admX.debug);
  const db = supabaseService();
  const { count } = await db.from('votes').select('id', { count: 'exact', head: true }).eq('kiosk_id', parsed.data.id);
  if ((count ?? 0) > 0) return fail('FORBIDDEN', 'Bilik sudah dipakai vote, tidak boleh dihapus. Nonaktifkan saja.');
  const { error } = await db.from('kiosks').delete().eq('id', parsed.data.id);
  if (error) return fail('INTERNAL_ERROR', error.message);
  return ok({ deleted: true });
}

export async function setElectionStatus(input: { status: 'start' | 'pause' | 'stop' }) {
  const parsed = z.object({ status: z.enum(['start', 'pause', 'stop']) }).safeParse(input);
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Status tidak valid');
  const adm = await requireAdmin();
  if (!adm.user) return fail('UNAUTHORIZED', 'Login admin dulu. ' + adm.debug);
  const admin = adm.user;
  const db = supabaseService();
  const patch: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === 'stop') {
    patch.stopped_at = new Date().toISOString();
    const { data: rows } = await db.from('candidates').select('candidate_number, vote_count').order('candidate_number');
    const { resultsSnapshotHash } = await import('@/lib/hash');
    patch.results_hash = resultsSnapshotHash(rows ?? []);
  } else if (parsed.data.status === 'start') {
    // Buka lagi setelah stop: batalkan finalisasi biar hash lama tidak nyangkut.
    patch.stopped_at = null;
    patch.results_hash = null;
  }
  const { error } = await db.from('election_settings').update(patch).eq('id', 1);
  if (error) return fail('INTERNAL_ERROR', error.message);
  await db.from('audit_logs').insert({ actor: admin.email ?? admin.id, action: `election_${parsed.data.status}`, meta: patch });
  await db.channel('election-broadcast').send({ type: 'broadcast', event: 'status', payload: patch });
  return ok({ status: parsed.data.status });
}
