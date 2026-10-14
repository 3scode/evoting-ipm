import { createHash } from 'crypto';

export function sha256Hex(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

export function resultsSnapshotHash(rows: unknown) {
  return sha256Hex(JSON.stringify(rows));
}
