-- 002 tables
create table if not exists voters (
  id uuid primary key default gen_random_uuid(),
  voter_id_number varchar(18) not null unique check (voter_id_number ~ '^[0-9]{8,18}$'),
  name varchar(120) not null,
  voter_type voters_type not null,
  department varchar(80) not null,
  has_voted boolean not null default false,
  voted_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  candidate_number smallint not null unique check (candidate_number between 1 and 20),
  name varchar(120) not null,
  vision_mission text not null check (char_length(vision_mission) <= 2000),
  photo_url text,
  vote_count integer not null default 0 check (vote_count >= 0),
  is_active boolean not null default true
);
create table if not exists kiosks (
  id uuid primary key default gen_random_uuid(),
  kiosk_name varchar(60) not null,
  username varchar(40) not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  last_ping timestamptz
);
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid not null unique references voters(id) on delete restrict,
  candidate_id uuid not null references candidates(id) on delete restrict,
  kiosk_id uuid references kiosks(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists election_settings (
  id smallint primary key check (id = 1),
  status election_status not null default 'pause',
  stopped_at timestamptz,
  results_hash text
);
insert into election_settings(id, status) values (1, 'pause') on conflict (id) do nothing;
create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  actor text not null,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
-- DOWN: drop table audit_logs, election_settings, votes, kiosks, candidates, voters;
