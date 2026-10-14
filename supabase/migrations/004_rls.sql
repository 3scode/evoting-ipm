-- 004 RLS
alter table voters enable row level security;
alter table candidates enable row level security;
alter table votes enable row level security;
alter table kiosks enable row level security;
drop policy if exists "read candidates active" on candidates;
create policy "read candidates active" on candidates for select using (is_active = true);
-- votes: no public policies -> only SECURITY DEFINER function can write
-- DOWN: drop policy "read candidates active" on candidates;
