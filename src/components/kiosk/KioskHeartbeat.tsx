'use client';

import { useEffect } from 'react';
import { kioskPing } from '@/app/actions/kiosk';

/**
 * Heartbeat bilik — menjaga `kiosks.last_ping` tetap segar selama
 * device login, sehingga badge Online di /admin/kiosks realtime.
 * Dipasang sekali di `src/app/kiosk/layout.tsx`.
 */
export function KioskHeartbeat({ intervalMs = 30_000 }: { intervalMs?: number }) {
  useEffect(() => {
    let cancelled = false;
    const beat = () => {
      kioskPing().catch(() => {});
    };
    beat();
    const t = setInterval(() => {
      if (!cancelled && document.visibilityState === 'visible') beat();
    }, intervalMs);
    const onVis = () => {
      if (document.visibilityState === 'visible' && !cancelled) beat();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onVis);
    return () => {
      cancelled = true;
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onVis);
    };
  }, [intervalMs]);
  return null;
}
