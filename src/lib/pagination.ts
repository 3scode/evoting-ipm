export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const limit = Math.min(100, Math.max(10, Number(searchParams.get('limit') ?? 50) || 50));
  return { page, limit, offset: (page - 1) * limit };
}
