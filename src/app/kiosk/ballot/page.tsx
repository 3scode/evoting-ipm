'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateCard, type Candidate } from '@/components/kiosk/CandidateCard';
import { Button } from '@/components/Button';
import { castVote } from '@/app/actions/vote';

const DEMO: Candidate[] = [
  { id: '1', candidate_number: 1, name: 'Ananda Pratama', vision_mission: 'IPM Berkemajuan: literasi, tahfidz, dan kewirausahaan pelajar.', photo_url: null },
  { id: '2', candidate_number: 2, name: 'Bemby Ghulam', vision_mission: 'Aktif, kreatif, dan kolaboratif untuk SMK yang unggul.', photo_url: null },
  { id: '3', candidate_number: 3, name: 'Citra Lestari', vision_mission: 'Sekolah bersih, organisasi transparan, kegiatan bermanfaat.', photo_url: null },
];

export default function BallotPage() {
  const r = useRouter();
  const [list, setList] = useState<Candidate[]>(DEMO);
  const [sel, setSel] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/candidates')
      .then((x) => (x.ok ? x.json() : null))
      .then((j) => {
        if (j?.success && Array.isArray(j.data) && j.data.length > 0) setList(j.data);
      })
      .catch(() => {});
  }, []);

  const chosen = list.find((c) => c.id === sel);

  const [err, setErr] = useState('');

  async function kirim() {
    if (!sel) return;
    setSending(true);
    setErr('');
    const res = await castVote({ candidate_id: sel });
    setSending(false);
    setConfirm(false);
    if (!res.success) {
      if (res.error.code === 'FORBIDDEN' || res.error.code === 'UNAUTHORIZED') {
        setErr(`${res.error.message} Mengalihkan…`);
        setTimeout(() => r.push('/kiosk/vote'), 1500);
        return;
      }
      setErr(res.error.message);
      return;
    }
    r.push('/kiosk/success');
  }

  if (list.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold">Belum ada kandidat</h1>
        <p className="text-slate-600 mt-2">Panitia belum input paslon.</p>
        <Button className="mt-4" variant="ghost" onClick={() => r.push('/kiosk/vote')}>
          Kembali
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <p>
          Halo, <strong>Pemilih</strong>
        </p>
        <Button variant="ghost" size="sm" onClick={() => r.push('/kiosk/vote')}>
          Ganti
        </Button>
      </header>
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-bold">Pilih Satu Kandidat</h1>
        <div role="radiogroup" aria-label="Kandidat" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CandidateCard key={c.id} c={c} selected={sel === c.id} onSelect={() => setSel(c.id)} />
          ))}
        </div>
        <div className="sticky bottom-0 mt-6 bg-slate-50 py-3">
          {err && (
            <p role="alert" className="mb-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-center">
              {err} Pilihanmu tidak hilang, coba lagi.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" onClick={() => r.push('/kiosk/vote')}>
              Batal
            </Button>
            <Button size="lg" disabled={!sel} onClick={() => setConfirm(true)} className="flex-1">
              {chosen ? `Pilih No.${chosen.candidate_number} ${chosen.name} →` : 'Pilih dulu'}
            </Button>
          </div>
        </div>
      </div>
      {confirm && chosen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold">Yakin memilih No.{chosen.candidate_number} {chosen.name}?</h2>
            <p className="text-slate-600 text-sm mt-1">Suara tidak dapat diubah setelah dikirim.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Cek Lagi
              </Button>
              <Button loading={sending} onClick={kirim}>
                Ya, Kirim Suara
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
