'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';

export function GiantInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  return (
    <div className="w-full max-w-xl mx-auto">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 18))}
        inputMode="numeric"
        placeholder="Contoh: 0061234567"
        disabled={disabled}
        aria-label="NISN atau NIP"
        className="kiosk-input w-full rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="NumPad">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => onChange((value + k).slice(0, 18))}
            className={cn('touch-kiosk rounded-md bg-white border border-slate-200 text-2xl font-bold py-3 active:scale-95')}
          >
            {k}
          </button>
        ))}
        <Button type="button" variant="ghost" size="lg" onClick={() => onChange(value.slice(0, -1))} className="col-span-2">
          Hapus
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => onChange('')}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export function useCountdown(seconds = 3, onDone?: () => void) {
  const [left, setLeft] = useState(seconds);
  useState(() => {
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          onDone?.();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  });
  return left;
}
