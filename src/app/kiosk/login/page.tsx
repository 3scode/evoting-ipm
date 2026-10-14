'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react';
import { loginKiosk } from '@/app/actions/kiosk';
import { Button } from '@/components/Button';

export default function KioskLoginPage() {
  const r = useRouter();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const res = await loginKiosk({ username: u, password: p });
    setLoading(false);
    if (!res.success) {
      setErr(res.error.message);
      return;
    }
    r.push('/kiosk/vote');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <Image
          src="/images/logo-ipm.png"
          alt="Logo IPM"
          width={165}
          height={320}
          priority
          className="mx-auto h-16 w-auto"
        />
        <h1 className="mt-3 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Pemilihan Ketua IPM 2026
        </h1>
        <p className="text-slate-600 text-sm">SMK Muhammadiyah Kandanghaur</p>
      </div>
      <form onSubmit={submit} className="mt-6 w-full max-w-sm rounded-2xl bg-white p-8 shadow-md border border-slate-200">
        <label className="text-sm font-medium" htmlFor="u">
          Username bilik
        </label>
        <input id="u" value={u} onChange={(e) => setU(e.target.value)} placeholder="bilik-lab-1" autoComplete="username" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 font-mono" />
        <label className="mt-4 block text-sm font-medium" htmlFor="p">
          Password
        </label>
        <div className="mt-1 flex gap-2">
          <input id="p" type={show ? 'text' : 'password'} value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono" />
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 px-3 inline-flex items-center justify-center"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
            aria-pressed={show}
            title={show ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {show ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
        {err && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm p-2">
            {err}
          </p>
        )}
        <Button type="submit" size="lg" loading={loading} className="mt-6 w-full inline-flex items-center justify-center gap-2">
          <LogIn className="h-5 w-5" aria-hidden="true" />
          Masuk ke Bilik
        </Button>
        <p className="mt-3 text-xs text-slate-600">Hubungi admin command center jika lupa kredensial.</p>
      </form>
      <Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke Beranda
      </Link>
    </main>
  );
}
