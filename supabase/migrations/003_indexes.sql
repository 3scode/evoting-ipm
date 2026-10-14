-- 003 indexes
create index if not exists idx_voters_has_voted_type on voters(has_voted, voter_type);
create index if not exists idx_votes_candidate_created on votes(candidate_id, created_at desc);
create index if not exists idx_votes_created on votes(created_at desc);
create extension if not exists pg_trgm;
create index if not exists idx_voters_name_trgm on voters using gin (name gin_trgm_ops);
-- DOWN: drop index idx_voters_name_trgm, idx_votes_created, idx_votes_candidate_created, idx_voters_has_voted_type;
