'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

export default function LockedPage() {
  const r = useRouter();
  const [status, setStatus] = useState<'pause' | 'stop'>('pause');

  useEffect(() => {
    const t = setInterval(() => {
      fetch('/api/election-status')
        .then((x) => (x.ok ? x.json() : null))
        .then((j) => {
          if (j?.data?.status === 'start') r.push('/kiosk/vote');
          else if (j?.data?.status) setStatus(j.data.status);
        })
        .catch(() => {});
    }, 10_000);
    return () => clearInterval(t);
  }, [r]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl">🔒</div>
      <h1 className="mt-4 text-2xl font-bold">{status === 'pause' ? 'Bilik Istirahat' : 'Pemilihan Selesai'}</h1>
      <p className="text-slate-600 mt-2 max-w-sm">
        {status === 'pause' ? 'Jeda — tunggu instruksi panitia.' : 'Pemilihan ditutup — terima kasih atas partisipasinya.'}
      </p>
      <div className="mt-3">
        <Badge tone={status === 'pause' ? 'amber' : 'gray'}>{status}</Badge>
      </div>
      <Button variant="ghost" className="mt-6" onClick={() => window.location.reload()}>
        Muat Ulang Status
      </Button>
    </main>
  );
}
