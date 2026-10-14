'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const r = useRouter();
  const [left, setLeft] = useState(3);

  useEffect(() => {
    if (left <= 0) {
      r.push('/kiosk/vote');
      return;
    }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, r]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div aria-live="assertive">
        <div className="mx-auto h-24 w-24 rounded-full bg-sky-100 flex items-center justify-center text-5xl text-sky-700">✓</div>
        <h1 className="mt-4 text-3xl font-bold">Terima kasih!</h1>
        <p className="text-slate-600 mt-1">Suara Anda tercatat • {new Date().toLocaleString('id-ID')}</p>
      </div>
      <div className="mt-6 w-full max-w-xs bg-slate-200 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-sky-600 transition-all" style={{ width: `${(left / 3) * 100}%` }} />
      </div>
      <p className="mt-2 text-sm text-slate-600">Menyiapkan bilik untuk pemilih berikutnya… {left}</p>
    </main>
  );
}
