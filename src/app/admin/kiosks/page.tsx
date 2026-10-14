'use client';

import { Plus, Power, PowerOff, Printer, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ToastStack, useToasts } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { createKiosk, toggleKiosk, deleteKiosk, resetKioskPassword, resetAllKioskPasswords } from '@/app/actions/admin';
import { REALTIME_CHANNELS, isKioskLive } from '@/lib/realtime-channels';

type K = { id: string; kiosk_name: string; username: string; is_active: boolean; last_ping: string | null };
type PrintCard = { kiosk_name: string; username: string; password: string };

function timeAgo(lastPing: string | null, now: number) {
  if (!lastPing) return 'belum pernah login';
  const s = Math.max(0, Math.floor((now - new Date(lastPing).getTime()) / 1000));
  if (s < 5) return 'baru saja';
  if (s < 60) return `${s} dtk lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  return `${Math.floor(m / 60)} jam lalu`;
}

function KioskPrintCard({ c }: { c: PrintCard }) {
  return (
    <div className="print-card bg-white p-6 text-center text-slate-900">
      <img src="/images/logo-smk.png" alt="Logo SMK Muhammadiyah Kandanghaur" className="mx-auto h-16 w-auto" />
      <p className="mt-2 text-sm font-semibold">SMK Muhammadiyah Kandanghaur</p>
      <h2 className="mt-1 text-xl font-bold">Pemilihan Ketua IPM 2026</h2>
      <hr className="my-4 border-slate-300" />
      <p className="text-sm text-slate-600">Kartu Kredensial Bilik</p>
      <p className="mt-1 text-lg font-bold">{c.kiosk_name}</p>
      <div className="mt-4 space-y-3 text-left">
        <div className="rounded-lg border border-slate-300 p-3">
          <p className="text-xs text-slate-500">Username bilik</p>
          <p className="font-mono text-lg font-bold">{c.username}</p>
        </div>
        <div className="rounded-lg border border-slate-300 p-3">
          <p className="text-xs text-slate-500">Password bilik</p>
          <p className="font-mono text-2xl font-bold tracking-[0.2em]">{c.password}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Login di halaman bilik • Jaga kerahasiaan kartu ini • Hubungi panitia jika hilang • Dicetak {new Date().toLocaleString('id-ID')}
      </p>
    </div>
  );
}

/** Lembar gunting: tiap kartu lengkap (logo + sekolah + kredensial), muat 1 halaman A4. */
function KioskPrintSheet({ cards }: { cards: PrintCard[] }) {
  return (
    <div className="print-sheet bg-white text-slate-900">
      <div className="print-grid">
        {cards.map((c) => (
          <div key={c.username} className="print-cut rounded border border-dashed border-slate-500 p-3 text-center">
            <img src="/images/logo-smk.png" alt="Logo SMK Muhammadiyah Kandanghaur" className="mx-auto h-12 w-auto" />
            <p className="mt-1 text-[11px] font-semibold">SMK Muhammadiyah Kandanghaur</p>
            <p className="text-sm font-bold leading-tight">Pemilihan Ketua IPM 2026</p>
            <hr className="my-1.5 border-slate-300" />
            <p className="text-[10px] text-slate-500">Kartu Kredensial Bilik</p>
            <p className="text-sm font-bold">{c.kiosk_name}</p>
            <div className="mx-auto mt-1.5 max-w-[60mm] space-y-1.5 text-left">
              <div className="rounded border border-slate-300 px-2 py-1">
                <p className="text-[10px] text-slate-500">Username bilik</p>
                <p className="font-mono text-xs font-bold">{c.username}</p>
              </div>
              <div className="rounded border border-slate-300 px-2 py-1">
                <p className="text-[10px] text-slate-500">Password bilik</p>
                <p className="font-mono text-lg font-bold tracking-[0.2em]">{c.password}</p>
              </div>
            </div>
            <p className="mt-1.5 text-[9px] text-slate-500">Rahasia • Hubungi panitia jika hilang • {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KiosksPage() {
  const [rows, setRows] = useState<K[]>([]);
  const [name, setName] = useState('');
  const [live, setLive] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [pendingDelete, setPendingDelete] = useState<K | null>(null);
  const [pendingPrint, setPendingPrint] = useState<K | null>(null);
  const [pendingPrintAll, setPendingPrintAll] = useState(false);
  const [printList, setPrintList] = useState<PrintCard[]>([]);
  const [busy, setBusy] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data } = await sb.from('kiosks').select('*').order('kiosk_name');
    setRows((data as K[]) ?? []);
  }, []);

  useEffect(() => {
    load();
    const sb = supabaseBrowser();
    const ch = sb
      .channel(REALTIME_CHANNELS.kiosks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kiosks' }, () => load())
      .subscribe((s) => setLive(s === 'SUBSCRIBED'));
    // Polling fallback + tick untuk hitung ulang Live/Offline (berbasis waktu).
    const poll = setInterval(load, 15_000);
    const tick = setInterval(() => setNow(Date.now()), 5_000);
    return () => {
      sb.removeChannel(ch);
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  // Buka dialog print browser setiap kredensial siap dicetak.
  useEffect(() => {
    if (printList.length > 0) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [printList]);

  async function add() {
    const res = await createKiosk({ kiosk_name: name });
    if (!res.success) { push('error', res.error.message); return; }
    setName('');
    push('success', `Bilik "${res.data.kiosk_name}" dibuat.`);
    setPrintList([{ kiosk_name: res.data.kiosk_name, username: res.data.username, password: res.data.password_plain_once }]);
    load();
  }

  async function toggle(k: K) {
    const res = await toggleKiosk({ id: k.id, is_active: !k.is_active });
    if (!res.success) { push('error', res.error.message); return; }
    push('success', k.is_active ? `"${k.kiosk_name}" dinonaktifkan.` : `"${k.kiosk_name}" diaktifkan.`);
    load();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    const res = await deleteKiosk({ id: pendingDelete.id });
    setBusy(false);
    if (!res.success) { push('error', res.error.message); return; }
    push('success', `"${pendingDelete.kiosk_name}" dihapus.`);
    setPendingDelete(null);
    load();
  }

  async function confirmPrint() {
    if (!pendingPrint) return;
    setBusy(true);
    const res = await resetKioskPassword({ id: pendingPrint.id });
    setBusy(false);
    if (!res.success) { push('error', res.error.message); return; }
    setPendingPrint(null);
    setPrintList([{ kiosk_name: res.data.kiosk_name, username: res.data.username, password: res.data.password_plain_once }]);
    load();
  }

  async function confirmPrintAll() {
    setBusy(true);
    const res = await resetAllKioskPasswords();
    setBusy(false);
    if (!res.success) { push('error', res.error.message); return; }
    setPendingPrintAll(false);
    setPrintList(res.data.cards);
    push('success', `${res.data.cards.length} kartu siap dicetak.`);
    load();
  }

  const onlineCount = rows.filter((k) => isKioskLive(k.last_ping, now)).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">Kiosk Management</h1>
        <div className="flex items-center gap-2">
          <Badge tone={live ? 'emerald' : 'amber'} pulse={live}>{live ? 'LIVE' : 'CONNECTING'}</Badge>
          <span className="text-xs text-slate-400 font-mono" aria-live="polite">
            {onlineCount}/{rows.length} online
          </span>
          {rows.length > 0 && (
            <Button size="sm" variant="secondary" onClick={() => setPendingPrintAll(true)} aria-label="Print semua kartu bilik" title="Print semua kartu" className="inline-flex items-center gap-1.5">
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print Semua
            </Button>
          )}
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bilik Lab 4" aria-label="Nama bilik baru" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-sky-500" />
        <Button onClick={add} aria-label="Tambah Bilik" title="Tambah Bilik" className="inline-flex items-center justify-center px-3">
          <Plus className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
      {printList.length > 0 && (
        <p className="mt-2 text-sm text-slate-300">
          {printList.length === 1 ? (
            <>Kartu <strong>{printList[0].kiosk_name}</strong> siap — dialog print dibuka otomatis.</>
          ) : (
            <><strong>{printList.length} kartu</strong> siap — dialog print dibuka otomatis, semua muat 1 lembar.</>
          )}
          <button onClick={() => window.print()} className="ml-2 underline text-sky-400 hover:text-sky-300">Print ulang</button>
        </p>
      )}
      {rows.length === 0 ? <p className="mt-6 text-slate-400">Belum ada bilik. Tambah bilik pertama.</p> : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((k) => {
            const isLive = isKioskLive(k.last_ping, now);
            return (
              <div key={k.id} className="rounded-xl bg-slate-800 p-4">
                <div className="flex justify-between items-center"><strong>{k.kiosk_name}</strong><Badge tone={isLive ? 'emerald' : 'gray'} pulse={isLive}>{isLive ? 'Live' : 'Offline'}</Badge></div>
                <p className="font-mono text-sm text-slate-300 mt-1">{k.username}</p>
                <p className="text-xs text-slate-400 mt-1" title={k.last_ping ?? ''}>Terakhir aktif: {timeAgo(k.last_ping, now)}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" aria-label={k.is_active ? `Nonaktifkan ${k.kiosk_name}` : `Aktifkan ${k.kiosk_name}`} title={k.is_active ? 'Nonaktifkan' : 'Aktifkan'} onClick={() => toggle(k)} className="inline-flex items-center justify-center px-2.5">
                    {k.is_active ? <PowerOff className="h-4 w-4" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
                  </Button>
                  <Button size="sm" variant="secondary" aria-label={`Print kartu ${k.kiosk_name}`} title="Print kartu kredensial" onClick={() => setPendingPrint(k)} className="inline-flex items-center justify-center px-2.5">
                    <Printer className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button size="sm" variant="danger" aria-label={`Hapus ${k.kiosk_name}`} title="Hapus" onClick={() => setPendingDelete(k)} className="inline-flex items-center justify-center px-2.5">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={!!pendingDelete}
        title={`Hapus "${pendingDelete?.kiosk_name ?? ''}"?`}
        message="Bilik yang sudah dipakai vote tidak bisa dihapus. Tindakan ini permanen."
        confirmLabel="Ya, Hapus"
        danger
        busy={busy}
        onCancel={() => { if (!busy) setPendingDelete(null); }}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={!!pendingPrint}
        title={`Print kartu "${pendingPrint?.kiosk_name ?? ''}"?`}
        message="Password bilik di-reset ke baru (8 huruf kapital) lalu kartu dicetak. Password lama tidak berlaku lagi."
        confirmLabel="Reset & Print"
        busy={busy}
        onCancel={() => { if (!busy) setPendingPrint(null); }}
        onConfirm={confirmPrint}
      />
      <ConfirmDialog
        open={pendingPrintAll}
        title={`Print semua (${rows.length} bilik)?`}
        message="Password SEMUA bilik di-reset ke baru (8 huruf kapital) lalu semua kartu dicetak dalam 1 lembar. Password lama tidak berlaku lagi."
        confirmLabel="Reset & Print Semua"
        danger
        busy={busy}
        onCancel={() => { if (!busy) setPendingPrintAll(false); }}
        onConfirm={confirmPrintAll}
      />
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Lembar print: hanya tampil saat print */}
      <div id="print-area" className="hidden">
        {printList.length === 1 ? (
          <KioskPrintCard c={printList[0]} />
        ) : (
          <KioskPrintSheet cards={printList} />
        )}
      </div>
    </main>
  );
}
