import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (type !== 'voters' && type !== 'results') {
    return NextResponse.json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tipe export tidak dikenal' } }, { status: 404 });
  }
  const db = supabaseService();
  if (type === 'results') {
    const { data } = await db.from('candidates').select('candidate_number, name, vote_count').order('candidate_number');
    const total = (data ?? []).reduce((a, c) => a + (c.vote_count ?? 0), 0);
    const csv = ['no,nama,suara,persen', ...(data ?? []).map((c) => `${c.candidate_number},"${c.name}",${c.vote_count},${total ? ((c.vote_count / total) * 100).toFixed(1) : '0.0'}`)].join('\n');
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="hasil.csv"' } });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  let query = db.from('voters').select('voter_id_number, name, department, voter_type, has_voted').order('name').limit(10000);
  if (q) query = query.ilike('name', `%${q}%`);
  const { data } = await query;
  const csv = ['nisn,nama,kelas,tipe,sudah_memilih', ...(data ?? []).map((v) => `${v.voter_id_number},"${v.name}","${v.department}",${v.voter_type},${v.has_voted}`)].join('\n');
  await db.from('audit_logs').insert({ actor: 'admin', action: 'export_voters', meta: { q } });
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="dpt.csv"' } });
}
