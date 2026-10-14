-- 007 authenticated read policies (dashboard admin via browser session)
drop policy if exists "authenticated read voters" on voters;
create policy "authenticated read voters" on voters for select to authenticated using (true);
drop policy if exists "authenticated read kiosks" on kiosks;
create policy "authenticated read kiosks" on kiosks for select to authenticated using (true);
drop policy if exists "authenticated read votes" on votes;
create policy "authenticated read votes" on votes for select to authenticated using (true);
drop policy if exists "authenticated read election" on election_settings;
create policy "authenticated read election" on election_settings for select to authenticated using (true);
-- DOWN: drop policy "authenticated read voters" on voters; drop policy "authenticated read kiosks" on kiosks; drop policy "authenticated read votes" on votes; drop policy "authenticated read election" on election_settings;
