export const REALTIME_CHANNELS = {
  votes: 'votes-changes',
  candidates: 'candidates-changes',
  kiosks: 'kiosks-changes',
  election: 'election-broadcast',
} as const;

export function isKioskLive(lastPing: string | null, now = Date.now()) {
  if (!lastPing) return false;
  return now - new Date(lastPing).getTime() < 60_000;
}
