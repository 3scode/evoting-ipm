import { supabaseServer } from './supabase/server';

export async function requireAdminUser() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return data.user;
}
