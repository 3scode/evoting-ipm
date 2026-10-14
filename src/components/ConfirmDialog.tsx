'use client';

import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  danger = false,
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
      aria-hidden={false}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby="confirm-dialog-desc"
        className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 text-slate-50 shadow-xl border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('mx-auto flex h-12 w-12 items-center justify-center rounded-full', danger ? 'bg-red-500/15 text-red-400' : 'bg-sky-500/15 text-sky-400')}>
          <TriangleAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-center text-lg font-bold">{title}</h2>
        <p id="confirm-dialog-desc" className="mt-1 text-center text-sm text-slate-400">
          {message}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
