'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/Button';

export default function ReportsPage() {
  const [rows, setRows] = useState<Array<{ candidate_number: number; name: string; vote_count: number }>>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const sb = supabaseBrowser();
    const { data } = await sb.from('candidates').select('candidate_number, name, vote_count').order('vote_count', { ascending: false });
    setRows((data as typeof rows) ?? []);
  }
  useEffect(() => { load(); }, []);

  const total = rows.reduce((a, c) => a + c.vote_count, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4">
      <h1 className="text-2xl font-bold">Laporan & Berita Acara</h1>
      {rows.length === 0 || total === 0 ? (
        <p className="mt-4 text-slate-400">Belum bisa cetak. Minimal 1 suara masuk untuk berita acara.</p>
      ) : (
        <div className="mt-4 rounded-xl bg-slate-800 p-4 max-w-2xl">
          <h2 className="font-bold">SMK Muhammadiyah Kandanghaur — Hasil Sementara</h2>
          {rows.map((c, i) => (
            <div key={c.candidate_number} className={`mt-2 flex justify-between ${i === 0 ? 'text-sky-300 font-bold' : ''}`}>
              <span>{i === 0 ? '🏆 ' : ''}No.{c.candidate_number} {c.name}</span>
              <span className="font-mono">{c.vote_count} ({total ? ((c.vote_count / total) * 100).toFixed(1) : '0.0'}%)</span>
            </div>
          ))}
          <p className="mt-2 font-mono">Total: {total} suara</p>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Button disabled={total === 0 || busy} onClick={async () => { setBusy(true); window.location.href = '/api/reports/berita-acara'; setBusy(false); }}>
          {busy ? 'Menyiapkan…' : 'Cetak Berita Acara'}
        </Button>
        <a href="/api/export/results" className="rounded-md bg-slate-700 px-4 py-2 text-sm">Export Hasil CSV</a>
        <a href="/api/export/voters" className="rounded-md border border-slate-600 px-4 py-2 text-sm">Export DPT CSV</a>
      </div>
    </main>
  );
}
