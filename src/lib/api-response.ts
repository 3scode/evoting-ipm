export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'VOTER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'ELECTION_CLOSED'
  | 'ALREADY_VOTED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export function ok<T>(data: T, meta?: unknown) {
  return { success: true as const, data, error: null, meta: meta ?? null };
}

export function fail(code: ApiErrorCode, message: string, details?: unknown) {
  return { success: false as const, data: null, error: { code, message, details: details ?? null }, meta: null };
}

export function paginate(page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages };
}
