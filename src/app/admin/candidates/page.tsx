'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/Button';
import { ToastStack, useToasts } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { upsertCandidate, deleteCandidate } from '@/app/actions/candidates';

type C = { id: string; candidate_number: number; name: string; vision_mission: string };

export default function CandidatesPage() {
  const [rows, setRows] = useState<C[]>([]);
  const [no, setNo] = useState('1');
  const [name, setName] = useState('');
  const [visi, setVisi] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pendingDelete, setPendingDelete] = useState<C | null>(null);
  const [busy, setBusy] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  async function load() {
    const sb = supabaseBrowser();
    const { data } = await sb.from('candidates').select('id, candidate_number, name, vision_mission').order('candidate_number');
    setRows((data as C[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    const fd = new FormData();
    fd.set('candidate_number', no);
    fd.set('name', name);
    fd.set('vision_mission', visi);
    if (file) fd.set('photo', file);
    const res = await upsertCandidate(fd);
    if (!res.success) { push('error', res.error.message); return; }
    setNo('1'); setName(''); setVisi(''); setFile(null);
    push('success', 'Kandidat disimpan.');
    load();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    const res = await deleteCandidate({ id: pendingDelete.id });
    setBusy(false);
    if (!res.success) { push('error', res.error.message); return; }
    push('success', `"${pendingDelete.name}" dihapus.`);
    setPendingDelete(null);
    load();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4">
      <h1 className="text-2xl font-bold">Candidate Management</h1>
      <div className="mt-4 rounded-xl bg-slate-800 p-4 max-w-xl space-y-2">
        <div className="flex gap-2">
          <input value={no} onChange={(e) => setNo(e.target.value)} placeholder="No" aria-label="Nomor urut" className="w-20 rounded-md px-3 py-2 text-slate-900" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama paslon" aria-label="Nama" className="flex-1 rounded-md px-3 py-2 text-slate-900" />
        </div>
        <textarea value={visi} onChange={(e) => setVisi(e.target.value)} placeholder="Visi misi (min 10 karakter)" rows={3} className="w-full rounded-md px-3 py-2 text-slate-900" />
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="Foto kandidat" className="text-sm" />
        <Button onClick={save}>Tambah / Simpan Kandidat</Button>
      </div>
      {rows.length === 0 ? <p className="mt-6 text-slate-400">Belum ada paslon. Tambahkan minimal 2 kandidat.</p> : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <div key={c.id} className="rounded-xl bg-slate-800 p-4">
              <span className="rounded-full bg-amber-400 text-slate-900 text-xs font-bold px-2 py-1">No.{c.candidate_number}</span>
              <h3 className="mt-2 font-bold">{c.name}</h3>
              <p className="text-sm text-slate-400 line-clamp-3">{c.vision_mission}</p>
              <Button size="sm" variant="danger" aria-label={`Hapus ${c.name}`} title="Hapus" onClick={() => setPendingDelete(c)} className="mt-3 inline-flex items-center justify-center px-2.5">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!pendingDelete}
        title={`Hapus "${pendingDelete?.name ?? ''}"?`}
        message="Kandidat yang sudah punya suara tidak bisa dihapus. Tindakan ini permanen."
        confirmLabel="Ya, Hapus"
        danger
        busy={busy}
        onCancel={() => { if (!busy) setPendingDelete(null); }}
        onConfirm={confirmDelete}
      />
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
