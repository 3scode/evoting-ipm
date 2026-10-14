export async function withRetry<T>(fn: () => Promise<T>, n = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i === n - 1) break;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i + Math.random() * 100));
    }
  }
  throw last;
}

type CircuitState = { fails: number[]; openUntil: number };
const circuits = new Map<string, CircuitState>();

export function circuitAllow(key: string): boolean {
  const s = circuits.get(key);
  if (!s) return true;
  return Date.now() > s.openUntil;
}

export function circuitRecord(key: string, ok: boolean) {
  const now = Date.now();
  const s = circuits.get(key) ?? { fails: [], openUntil: 0 };
  if (ok) {
    s.fails = [];
    s.openUntil = 0;
  } else {
    s.fails = [...s.fails.filter((t) => now - t < 10_000), now];
    if (s.fails.length >= 5) s.openUntil = now + 30_000;
  }
  circuits.set(key, s);
}
