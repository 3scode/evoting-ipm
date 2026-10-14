import { cn } from '@/lib/utils';

export function Badge({ tone = 'gray', pulse, children }: { tone?: 'emerald' | 'amber' | 'gray' | 'sky' | 'red' | 'green'; pulse?: boolean; children: React.ReactNode }) {
  const map: Record<string, string> = {
    emerald: 'bg-sky-100 text-sky-800',
    green: 'bg-sky-100 text-sky-800',
    amber: 'bg-amber-100 text-amber-900',
    gray: 'bg-slate-200 text-slate-700',
    sky: 'bg-sky-100 text-sky-800',
    red: 'bg-red-100 text-red-800',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium', map[tone])}>
      {pulse && <span className="h-2 w-2 rounded-full bg-current animate-pulse" aria-hidden />}
      {children}
    </span>
  );
}
