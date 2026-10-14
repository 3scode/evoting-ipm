'use client';

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl">📡</div>
      <h1 className="mt-3 text-2xl font-bold">Koneksi terputus</h1>
      <p className="text-slate-600 mt-1">Periksa WiFi lab. Halaman akan mencoba ulang otomatis saat online.</p>
      <button onClick={() => window.location.reload()} className="mt-4 rounded-md bg-sky-600 text-white px-4 py-2">Muat Ulang</button>
    </main>
  );
}
