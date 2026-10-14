'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { lookupVoter, confirmVoter } from '@/app/actions/voter';
import { GiantInput } from '@/components/kiosk/GiantInput';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

export default function KioskVotePage() {
  const r = useRouter();
  const [val, setVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<{ id: string; name: string; department: string; voter_type: string } | null>(null);
  const [err, setErr] = useState('');

  async function cek() {
    setLoading(true);
    setErr('');
    setFound(null);
    const res = await lookupVoter({ voter_id_number: val });
    setLoading(false);
    if (!res.success) {
      setErr(res.error.message);
      return;
    }
    setFound(res.data);
  }

  async function lanjutkan(ya: boolean) {
    if (!ya || !found) {
      setFound(null);
      return;
    }
    const res = await confirmVoter({ voter_id: found.id });
    if (!res.success) {
      setErr(res.error.message);
      setFound(null);
      return;
    }
    r.push('/kiosk/ballot');
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <strong>Bilik Lab 1</strong>
        <Badge tone="emerald" pulse>
          Live
        </Badge>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-center" style={{ fontFamily: 'var(--font-display)' }}>
          Masukkan NISN / NIP
        </h1>
        <div className="mt-6 w-full">
          <GiantInput value={val} onChange={setVal} disabled={loading} />
        </div>
        <Button size="xl-kiosk" loading={loading} onClick={cek} className="mt-6 w-full max-w-xl">
          Cek Identitas →
        </Button>
        {err && (
          <p role="alert" className="mt-4 max-w-xl w-full rounded-md bg-red-50 border border-red-200 text-red-700 p-3 text-center">
            {err}
          </p>
        )}
        <p className="mt-4 text-sm text-slate-600">Privasi terjaga • Antrean cepat</p>
      </div>
      {found && (
        <div role="dialog" aria-modal="true" aria-label="Konfirmasi identitas" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <div className="mx-auto h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold">{found.name.charAt(0)}</div>
            <h2 className="mt-3 text-center text-xl font-bold">{found.name}</h2>
            <p className="text-center text-slate-600">{found.department}</p>
            <div className="mt-2 text-center">
              <Badge tone={found.voter_type === 'siswa' ? 'emerald' : 'sky'}>{found.voter_type}</Badge>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => lanjutkan(false)}>
                Bukan, Kembali
              </Button>
              <Button onClick={() => lanjutkan(true)}>Ya, Lanjutkan</Button>
            </div>
          </div>
        </div>
      )}
      <footer className="p-3 text-center text-xs text-slate-600 border-t">Pemilu IPM Jujur • SMK Muhammadiyah Kandanghaur</footer>
    </main>
  );
}
