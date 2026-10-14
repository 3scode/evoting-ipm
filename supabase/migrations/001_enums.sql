-- 001 enums
do $$ begin
  create type voters_type as enum ('siswa','guru');
exception when duplicate_object then null; end $$;
do $$ begin
  create type election_status as enum ('start','pause','stop');
exception when duplicate_object then null; end $$;
-- DOWN: drop type election_status; drop type voters_type;
