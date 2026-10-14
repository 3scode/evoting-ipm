'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { importVoters } from '@/app/actions/import';

type V = { voter_id_number: string; name: string; department: string; voter_type: string; has_voted: boolean };
type StatusFilter = 'semua' | 'sudah' | 'belum';
type TipeFilter = 'semua' | 'siswa' | 'guru';

const STATUS_OPTS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'semua', label: 'Semua' },
  { value: 'sudah', label: 'Sudah' },
  { value: 'belum', label: 'Belum' },
];
const TIPE_OPTS: Array<{ value: TipeFilter; label: string }> = [
  { value: 'semua', label: 'Semua' },
  { value: 'siswa', label: 'Siswa' },
  { value: 'guru', label: 'Guru' },
];
const LIMIT = 200;

export default function VotersPage() {
  const [rows, setRows] = useState<V[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('semua');
  const [tipe, setTipe] = useState<TipeFilter>('semua');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    let query = sb.from('voters').select('voter_id_number, name, department, voter_type, has_voted').order('name').limit(LIMIT);
    const term = q.trim();
    if (term) query = query.or(`name.ilike.%${term}%,voter_id_number.ilike.%${term}%`);
    if (status === 'sudah') query = query.eq('has_voted', true);
    if (status === 'belum') query = query.eq('has_voted', false);
    if (tipe === 'siswa' || tipe === 'guru') query = query.eq('voter_type', tipe);
    const { data } = await query;
    setRows((data as V[]) ?? []);
  }, [q, status, tipe]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function onFile(f: File) {
    setMsg('Parsing…');
    const text = await f.text();
    const lines = text.trim().split('\n');
    const head = (lines.shift() ?? '').split(',').map((s) => s.trim().toLowerCase());
    const idx = { nisn: head.indexOf('nisn'), nama: head.indexOf('nama'), kelas: head.indexOf('kelas') };
    if (idx.nisn < 0 || idx.nama < 0) { setMsg('Header harus: NISN,Nama,Kelas'); return; }
    const parsed = lines.map((l) => {
      const c = l.split(',');
      return { voter_id_number: (c[idx.nisn] ?? '').trim(), name: (c[idx.nama] ?? '').trim(), department: (c[idx.kelas] ?? '').trim() || '-', voter_type: 'siswa' as const };
    });
    const res = await importVoters({ rows: parsed });
    setMsg(res.success ? `Inserted ${res.data.inserted}, skipped ${res.data.skipped}, errors ${res.data.errors.length}` : res.error.message);
    load();
  }

  const dirty = status !== 'semua' || tipe !== 'semua' || q.trim() !== '';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4">
      <h1 className="text-2xl font-bold">Voter Management (DPT)</h1>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari NISN/nama…" aria-label="Cari DPT" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500" />
        <div className="flex items-center gap-1.5" role="group" aria-label="Filter status memilih">
          <span className="text-xs text-slate-400">Status:</span>
          {STATUS_OPTS.map((o) => (
            <Button key={o.value} size="sm" variant={status === o.value ? 'primary' : 'secondary'} aria-pressed={status === o.value} onClick={() => setStatus(o.value)}>{o.label}</Button>
          ))}
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Filter tipe pemilih">
          <span className="text-xs text-slate-400">Tipe:</span>
          {TIPE_OPTS.map((o) => (
            <Button key={o.value} size="sm" variant={tipe === o.value ? 'primary' : 'secondary'} aria-pressed={tipe === o.value} onClick={() => setTipe(o.value)}>{o.label}</Button>
          ))}
        </div>
        {dirty && (
          <Button size="sm" variant="ghost" onClick={() => { setQ(''); setStatus('semua'); setTipe('semua'); }} aria-label="Reset filter" title="Reset filter" className="text-slate-300 border border-slate-700">
            Reset
          </Button>
        )}
        <label className="ml-auto cursor-pointer rounded-md bg-sky-600 px-4 py-2 text-sm font-bold">Import CSV<input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></label>
        <a href="/api/export/voters" className="rounded-md bg-slate-700 px-4 py-2 text-sm">Export</a>
      </div>
      {msg && <p className="mt-2 text-sm text-amber-300">{msg}</p>}
      <p className="mt-2 text-xs text-slate-400" aria-live="polite">
        Menampilkan {rows.length} data{rows.length >= LIMIT ? ` (maks ${LIMIT} — persempit pencarian)` : ''}{dirty ? ' • filter aktif' : ''}
      </p>
      <div className="mt-2 overflow-x-auto rounded-xl bg-slate-800">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400"><th scope="col" className="p-3">Nama</th><th scope="col" className="p-3">NISN</th><th scope="col" className="p-3">Dept</th><th scope="col" className="p-3">Tipe</th><th scope="col" className="p-3">Status</th></tr></thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.voter_id_number} className="border-t border-slate-700">
                <td className="p-3">{v.name}</td><td className="p-3 font-mono">{v.voter_id_number}</td><td className="p-3">{v.department}</td>
                <td className="p-3"><Badge tone={v.voter_type === 'siswa' ? 'emerald' : 'sky'}>{v.voter_type}</Badge></td>
                <td className="p-3"><Badge tone={v.has_voted ? 'green' : 'gray'}>{v.has_voted ? 'Sudah' : 'Belum'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-slate-400">{dirty ? 'Tidak ada data yang cocok dengan filter.' : 'DPT kosong. Import CSV: NISN,Nama,Kelas.'}</p>}
      </div>
    </main>
  );
}
