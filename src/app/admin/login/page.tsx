'use client';

import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';

export default function AdminLoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState('admin@smkmuhkdh.sch.id');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const { supabaseBrowser } = await import('@/lib/supabase/client');
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) {
        setErr(`Gagal login: ${error.message} (cek koneksi + env SUPABASE_URL)`);
        return;
      }
      r.push('/admin/dashboard');
      r.refresh();
    } catch {
      setErr('Gagal login. Cek koneksi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid md:grid-cols-2 bg-slate-950 text-slate-50">
      <div className="hidden md:flex flex-col justify-center p-12">
        <h1 className="text-3xl font-bold">Command Center IPM</h1>
        <p className="text-slate-400 mt-2">Live Realtime • SMK Muhammadiyah Kandanghaur</p>
      </div>
      <div className="flex items-center justify-center p-6 bg-white text-slate-900">
        <div className="w-full max-w-sm">
          <form onSubmit={submit} className="w-full">
            <h2 className="text-2xl font-bold">Masuk Dashboard</h2>
            <label className="block mt-6 text-sm" htmlFor="e">Email</label>
            <input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" required />
            <label className="block mt-4 text-sm" htmlFor="pw">Password</label>
            <input id="pw" type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" required />
            {err && <p role="alert" className="mt-3 text-sm text-red-600">{err}</p>}
            <Button type="submit" loading={loading} className="mt-6 w-full inline-flex items-center justify-center gap-2" size="lg">
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
              Masuk Dashboard
            </Button>
          </form>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
