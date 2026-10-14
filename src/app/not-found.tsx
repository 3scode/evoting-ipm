import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-2 text-slate-600">Halaman tidak ditemukan.</p>
      <div className="mt-4 flex gap-2">
        <Link href="/kiosk/vote" className="rounded-md bg-sky-600 text-white px-4 py-2">Kembali ke Bilik</Link>
        <Link href="/admin/dashboard" className="rounded-md border px-4 py-2">Ke Dashboard</Link>
      </div>
    </main>
  );
}
