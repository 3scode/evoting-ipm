-- 006 storage: buat via dashboard/API (didokumentasikan)
-- insert into storage.buckets (id, name, public) values ('candidates','candidates', false)
-- on conflict (id) do nothing;
-- Kebijakan signed URL 1 jam ditangani via service_role di Server Action.
-- DOWN: delete from storage.buckets where id='candidates';
select 1;
