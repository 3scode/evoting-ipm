import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';

export async function GET() {
  try {
    const db = supabaseService();
    const { data: settings } = await db.from('election_settings').select('*').eq('id', 1).single();
    if (!settings || settings.status !== 'stop') {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'FORBIDDEN', message: 'Berita acara hanya bisa dicetak setelah Stop' } },
        { status: 403 }
      );
    }
    const { data: candidates } = await db.from('candidates').select('candidate_number, name, vote_count').order('candidate_number');
    const total = (candidates ?? []).reduce((a, c) => a + (c.vote_count ?? 0), 0);
    const lines = [
      'BERITA ACARA PEMILIHAN KETUA IPM',
      'SMK Muhammadiyah Kandanghaur',
      `Waktu cetak: ${new Date().toLocaleString('id-ID')}`,
      `Hash: ${settings.results_hash ?? '-'}`,
      '',
      ...(candidates ?? []).map((c) => `No.${c.candidate_number} ${c.name} — ${c.vote_count} suara`),
      `Total: ${total} suara`,
    ];
    return new NextResponse(lines.join('\n'), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': 'attachment; filename="Berita-Acara-IPM.txt"' },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'gagal' } },
      { status: 500 }
    );
  }
}
