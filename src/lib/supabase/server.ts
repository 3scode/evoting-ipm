import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (all: Array<{ name: string; value: string; options?: object }>) => {
          all.forEach((c: { name: string; value: string; options?: object }) => {
            try {
              jar.set(c.name, c.value, c.options);
            } catch {
              /* RSC read-only */
            }
          });
        },
      },
    }
  );
}

export function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service env missing');
  return createClient(url, key, { auth: { persistSession: false } });
}
