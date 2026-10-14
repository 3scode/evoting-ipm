import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';

export async function GET() {
  const db = supabaseService();
  const { data } = await db.from('candidates').select('id, candidate_number, name, vision_mission, photo_url').eq('is_active', true).order('candidate_number');
  return NextResponse.json({ success: true, data: data ?? [], error: null });
}
