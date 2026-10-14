-- 008 realtime publication untuk live badge bilik + dashboard
-- postgres_changes hanya menguap jika tabel masuk publication supabase_realtime.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'kiosks'
  ) then
    alter publication supabase_realtime add table public.kiosks;
  end if;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'candidates'
  ) then
    alter publication supabase_realtime add table public.candidates;
  end if;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'election_settings'
  ) then
    alter publication supabase_realtime add table public.election_settings;
  end if;
exception when duplicate_object then
  null;
end $$;
-- DOWN: alter publication supabase_realtime drop table public.kiosks, public.candidates, public.votes, public.election_settings;
