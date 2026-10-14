import { fail } from './api-response';

export async function withAction<T>(actor: string, action: string, fn: () => Promise<T>) {
  try {
    const data = await fn();
    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error';
    try {
      const { supabaseService } = await import('./supabase/server');
      await supabaseService().from('audit_logs').insert({ actor, action: `${action}:failed`, meta: { message } });
    } catch {
      /* audit best-effort */
    }
    return fail('INTERNAL_ERROR', message);
  }
}
