import { cn } from '@/lib/utils';

export type Candidate = {
  id: string;
  candidate_number: number;
  name: string;
  vision_mission: string;
  photo_url: string | null;
};

export function CandidateCard({
  c,
  selected,
  onSelect,
}: {
  c: Candidate;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      onClick={onSelect}
      className={cn(
        'text-left rounded-2xl bg-white border shadow-sm overflow-hidden transition hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-sky-500',
        selected ? 'border-sky-600 ring-4 ring-sky-200' : 'border-slate-200'
      )}
    >
      <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center text-5xl font-bold text-slate-400">
        {c.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.photo_url} alt={`Foto paslon No.${c.candidate_number} ${c.name}`} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          c.name.charAt(0)
        )}
      </div>
      <div className="p-4">
        <span className="inline-block rounded-full bg-amber-400 text-slate-900 text-sm font-bold px-3 py-1">No.{c.candidate_number}</span>
        <h3 className="mt-2 text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {c.name}
        </h3>
        <p className="mt-1 text-sm text-slate-600 line-clamp-3">{c.vision_mission.slice(0, 300)}</p>
        {selected && <p className="mt-2 text-sky-700 font-bold">✓ Dipilih</p>}
      </div>
    </button>
  );
}
