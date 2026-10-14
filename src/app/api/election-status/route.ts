import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';

export async function GET() {
  const db = supabaseService();
  const { data, error } = await db.from('election_settings').select('status').eq('id', 1).single();
  if (error) return NextResponse.json({ success: false, data: null, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data: { status: data.status }, error: null });
}
