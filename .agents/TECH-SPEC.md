# TECH-SPEC.md — E-Voting IPM SMK Muhammadiyah Kandanghaur

> Versi: 1.0 | 2026-10-14
> Acuan: `.agents/PRD.md` (15 US, 20 FR) + `.agents/DESIGN.md` (12 screens Web Modern&Clean)
> Stack final: Next.js 16.4 + Supabase Postgres 17 + Vercel (Bun 1.4.3 runtime)
> Versi dicek 2026-10-14: Next.js 16.4.0 (LTS 16.3.8), Supabase default PG 17 (PG15 legacy, PG14 EOL 2026-07-01), Bun 1.4.3

## BAGIAN 1: Tech Stack & Arsitektur

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Bun | 1.4.3 (wajib `bun`, bukan npm/node) |
| Frontend+Backend | Next.js App Router + Server Actions + Server Components | 16.4.0 |
| Language | TypeScript | 5.9.x strict |
| Styling | Tailwind CSS + shadcn/ui + Lucide | Tailwind 4.x, shadcn latest |
| Fonts | next/font (Inter body, Plus Jakarta Sans display, JetBrains Mono) | built-in |
| Charts | Recharts | 2.15.x |
| CSV/Excel/PDF | PapaParse + SheetJS (xlsx) + jsPDF | latest |
| Database | Supabase Postgres | 17.x (managed) |
| ORM/Client | @supabase/supabase-js + @supabase/ssr (server client) | v2.x |
| Auth | Supabase Auth (admin) + custom kiosk session (httpOnly cookie, bcrypt) | - |
| Storage | Supabase Storage bucket `candidates` | - |
| Realtime | Supabase Realtime (postgres_changes + broadcast + presence) | - |
| Validation | zod | 3.23.x |
| Sanitizer | DOMPurify + isomorphic-dompurify | latest |
| Hosting | Vercel (edge, ISR, Analytics) | - |
| Monitoring | Vercel Analytics + Sentry + Supabase Logs | - |
| Test | Bun test + Vitest + Playwright | - |

### Arsitektur Sistem

```
                    ┌──────────────┐
                    │   Browser    │
                    │ Kiosk Light  │
                    │ Admin Dark   │
                    └──────┬───────┘
                           │ HTTPS
                    ┌──────▼───────┐
                    │ Next.js 16.4 │
                    │ App Router   │
                    │ RSC + Server │◄── next/font, next/image
                    │ Actions      │
                    └──┬───────┬───┘
                       │       │ Storage signed URL (1h)
              ┌────────▼──┐ ┌──▼──────────┐
              │ Supabase  │ │ Supabase    │
              │ Postgres  │ │ Storage     │
              │ 17 + RLS  │ │ candidates/ │
              │ RPC cast_ │ └─────────────┘
              │ vote()    │
              └─────┬─────┘
                    │ Realtime WS (votes/candidates/kiosks/election)
                    └─► Dashboard Bar/Donut/Feed live (<1s)
```

Kiosk isolation: middleware `kiosk-session` guard, tidak ada fetch langsung dengan service_role dari client. Semua write via Server Action → service client di server.

### Struktur Folder (Next.js 16 best practice)

```
e-voting-ipm/
├── src/
│   ├── app/
│   │   ├── (kiosk)/kiosk/{login,vote,ballot,success,locked}/page.tsx
│   │   ├── (admin)/admin/{login,dashboard,kiosks,voters,candidates,reports}/page.tsx
│   │   ├── api/{health,reports/berita-acara,export/[type]}/route.ts
│   │   ├── actions/{kiosk.ts,voter.ts,vote.ts,admin.ts,import.ts,reports.ts}
│   │   ├── layout.tsx + globals.css
│   │   └── middleware.ts
│   ├── components/{ui(shadcn),kiosk/{GiantInput,CandidateCard,NumPad},admin/{StatCard,Charts,DataTable,ElectionControl}}/
│   ├── lib/{supabase/{client,server,service},auth-kiosk,rate-limit,audit,csv,hash,realtime-channels}.ts
│   ├── db/migrations/*.sql (Supabase CLI)
│   └── types/database.ts (generated)
├── supabase/{config.toml,migrations/,seed.sql}
├── tests/{unit,integration,e2e}/
├── .env.example
└── package.json (packageManager bun)
```

### Code Snippets

```ts
// src/lib/supabase/server.ts — server client (anon, RLS enforced)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll: (c) => jar.setAll(c) },
  });
}
// service client HANYA di Server Action / Route Handler, never di client
import { createClient } from '@supabase/supabase-js';
export const supabaseService = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
```

```jsonc
// package.json (bun)
{ "packageManager": "bun@1.4.3", "scripts": { "dev": "bun --bun next dev", "build": "bun --bun next build", "test": "bun test", "test:e2e": "bunx playwright test" } }
```

### Justifikasi
- Next.js 16.4: SSR+RSC untuk SEO/admin cepat, Server Actions gantikan API boilerplate, Image/Font optimasi foto paslon, deploy native Vercel.
- Supabase PG17: Postgres relasional + RLS + RPC atomik + Realtime tanpa server WS sendiri (terbukti 240 koneksi, <200ms). Cocok skala sekolah.
- Bun 1.4.3: install/test 7x lebih cepat, sesuai standar skill runtime.
- Vercel: edge + preview per PR + Analytics LCP, cocok deadline H-1.

## BAGIAN 2: Database Design

### Ringkasan

| Item | Detail |
|------|--------|
| Database | Supabase Postgres 17.x managed, AES-256 at rest, TLS 1.2+ |
| ORM/Driver | supabase-js v2 + supabase/ssr, SQL mentah untuk RPC, Supabase CLI migrate |
| Pendekatan | Relational, UUID PK `gen_random_uuid()`, timestamptz |
| Tools Migrasi | `supabase db diff/push`, file `supabase/migrations/YYYYMMDD_*.sql`, down script tiap file |

### Entity Overview

| Entity | Field | Type | Constraints | Cardinality |
|--------|-------|------|-------------|-------------|
| voters | id | UUID | PK NOT NULL DEFAULT gen_random_uuid() | |
| | voter_id_number | VARCHAR(18) | NOT NULL UNIQUE CHECK (voter_id_number ~ '^[0-9]{8,18}$') | |
| | name | VARCHAR(120) | NOT NULL | |
| | voter_type | voters_type ENUM ('siswa','guru') | NOT NULL | |
| | department | VARCHAR(80) | NOT NULL (Kelas / Jabatan) | |
| | has_voted | BOOLEAN | NOT NULL DEFAULT false | |
| | voted_at | TIMESTAMPTZ | NULL, SET saat vote | |
| | deleted_at | TIMESTAMPTZ | NULL (soft delete) | |
| | created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 1:N → votes (1 voter max 1 vote enforced) |
| candidates | id | UUID | PK NOT NULL DEFAULT gen_random_uuid() | |
| | candidate_number | SMALLINT | NOT NULL UNIQUE CHECK (1..20) | |
| | name | VARCHAR(120) | NOT NULL | |
| | vision_mission | TEXT | NOT NULL CHECK (char_length<=2000) | sanitized |
| | photo_url | TEXT | NULL (Storage path) | |
| | vote_count | INTEGER | NOT NULL DEFAULT 0 CHECK (>=0) | denormalized counter |
| | is_active | BOOLEAN | NOT NULL DEFAULT true | 1:N → votes |
| votes | id | UUID | PK NOT NULL DEFAULT gen_random_uuid() | |
| | voter_id | UUID | FK→voters.id NOT NULL UNIQUE ON DELETE RESTRICT | M:1 voters, M:1 candidates |
| | candidate_id | UUID | FK→candidates.id NOT NULL ON DELETE RESTRICT | |
| | kiosk_id | UUID | FK→kiosks.id NULL ON DELETE SET NULL | M:1 kiosks |
| | created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| kiosks | id | UUID | PK NOT NULL | |
| | kiosk_name | VARCHAR(60) | NOT NULL | |
| | username | VARCHAR(40) | NOT NULL UNIQUE CHECK (lower, slug) | 1:N → votes |
| | password_hash | TEXT | NOT NULL (bcrypt) | |
| | is_active | BOOLEAN | NOT NULL DEFAULT true | |
| | last_ping | TIMESTAMPTZ | NULL | Live jika now-last_ping<60s |
| election_settings | id | SMALLINT | PK CHECK (=1) single-row | singleton |
| | status | election_status ENUM ('start','pause','stop') | NOT NULL DEFAULT 'pause' | guard semua vote |
| | stopped_at | TIMESTAMPTZ | NULL | freeze trigger |
| | results_hash | TEXT | NULL SHA256 snapshot | verifikasi BA |
| audit_logs | id | BIGINT GENERATED ALWAYS AS IDENTITY | PK | |
| | actor | TEXT | NOT NULL (admin email / kiosk username) | |
| | action | TEXT | NOT NULL (cast_vote, start, stop, import...) | |
| | meta | JSONB | NULL | |
| | created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

### Cardinality Summary

| Relation | Type | Description |
|----------|------|-------------|
| voters → votes | 1:1 (enforced UNIQUE voter_id) | Satu pemilih maksimal satu suara |
| candidates → votes | 1:N | Satu paslon terima banyak suara |
| kiosks → votes | 1:N | Satu bilik layani banyak pemilih |
| election_settings → all | 1:N guard | Status stop/pause blokir semua vote |

### Index Strategy
- `voters.voter_id_number` UNIQUE BTREE — lookup NISN <50ms (FR-02).
- `voters(has_voted, voter_type)` BTREE — filter dashboard/DPT.
- `votes(voter_id)` UNIQUE + `votes(candidate_id, created_at)` — agregasi + feed.
- `votes(created_at DESC)` — live feed 5 terakhir.
- `kiosks(username)` UNIQUE, `candidates(candidate_number)` UNIQUE.
- `voters(name)` TRGM (`pg_trgm`) untuk search nama fuzzy.

### Data Flow
DPT import → voters (has_voted=false) → kiosk lookup by voter_id_number → guard verified TTL 5 mnt → ballot SELECT candidates → `cast_vote()` lock voter row FOR UPDATE → INSERT votes + UPDATE candidates.vote_count + UPDATE voters.has_voted → Realtime postgres_changes → dashboard agregasi → Stop freeze snapshot + results_hash → PDF/Excel.

### Data Migration Strategy
- Fresh system (tanpa legacy): migrasi = `supabase db push` berurutan 001_enums → 002_tables → 003_indexes → 004_rls → 005_rpc → 006_storage.
- Versioning via Supabase CLI + Git, tiap PR wajib `db diff`.
- Rollback: tiap migration punya `-- DOWN` (drop function/policy revert), backup `pg_dump` sebelum Stop H. Zero-downtime: expand-contract (tambah kolom nullable dulu, backfill, baru NOT NULL).

### Seed Data

| Data | Purpose | Quantity |
|------|---------|----------|
| Admin user (Supabase Auth) | Login `/admin/login` dev | 1 (admin@smk.sch.id) |
| election_settings status=pause | Guard default | 1 |
| 3 kiosks dummy (bilik-lab-1..3, pass `Bilik#123`) | Test heartbeat | 3 |
| 3 candidates dummy + foto placeholder | Test ballot/chart | 3 |
| 50 voters dummy (NISN 00600001..) | Test import/lookup | 50 |

### Code Snippets

```sql
-- 005_rpc_cast_vote.sql
create or replace function public.cast_vote(p_voter_id uuid, p_candidate_id uuid, p_kiosk_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_status election_status; v_voted bool;
begin
  select status into v_status from election_settings where id=1;
  if v_status <> 'start' then return jsonb_build_object('success',false,'code','ELECTION_CLOSED'); end if;
  select has_voted into v_voted from voters where id=p_voter_id for update;
  if not found then return jsonb_build_object('success',false,'code','VOTER_NOT_FOUND'); end if;
  if v_voted then return jsonb_build_object('success',false,'code','ALREADY_VOTED'); end if;
  insert into votes(voter_id,candidate_id,kiosk_id) values (p_voter_id,p_candidate_id,p_kiosk_id);
  update candidates set vote_count = vote_count + 1 where id=p_candidate_id;
  update voters set has_voted=true, voted_at=now() where id=p_voter_id;
  insert into audit_logs(actor,action,meta) values (p_voter_id::text,'cast_vote',jsonb_build_object('candidate',p_candidate_id,'kiosk',p_kiosk_id));
  return jsonb_build_object('success',true,'code','OK');
exception when unique_violation then return jsonb_build_object('success',false,'code','ALREADY_VOTED');
end $$;
-- RLS: revoke all on votes; hanya function yang insert
alter table votes enable row level security;
create policy "read candidates active" on candidates for select using (is_active=true);
```

## BAGIAN 3: Interface Design (Server Actions + Route Handlers)

Semua screen DESIGN tercover. Client tidak panggil Supabase write langsung; via Server Action (mutation) + Route GET (read publik kiosk disaring).

| Method | Path / Action | Description | Auth | Request | Response |
|--------|---------------|-------------|------|---------|----------|
| POST | `loginKiosk({username,password})` SA | Login bilik → sesi kiosk | No (rate 5/5 mnt) | `{username, password}` | `{success, kioskName}` / 401 INVALID_CREDENTIALS |
| POST | `lookupVoter({voter_id_number})` SA | Cek NISN/NIP | Kiosk session (10/mnt) | `{voter_id_number}` | `{id,name,department,voter_type,has_voted}` / NOT_FOUND / ALREADY_VOTED |
| GET | `/kiosk/ballot` RSC | Surat suara (tanpa vote_count) | Kiosk+verified TTL5 | — | `[{id, candidate_number,name,vision_mission,photo_signed_url}]` |
| POST | `castVote({voter_id,candidate_id})` SA | RPC atomik | Kiosk+verified+election=start | ids + idempotency `voter_id` | `{success, vote_id, created_at}` / ALREADY_VOTED / ELECTION_CLOSED |
| POST | `kioskPing()` SA | Heartbeat 20s | Kiosk | — | `{ok, server_time}` |
| GET | `/api/health` | Health + DB ping | No | — | `{success, db_ms}` |
| POST | Supabase Auth `signIn` | Login admin | No (5x throttle) | `{email,password}` | session JWT |
| GET | RSC `/admin/dashboard` + Realtime sub | Stats + chart + feed | Admin | — | agregat + subscribe `votes/candidates/kiosks` |
| POST | `setElectionStatus({status})` SA | Start/Pause/Stop + broadcast | Admin + confirm | `{status}` | `{success, status}` + audit |
| POST | `createKiosk({kiosk_name})` SA | Auto-generate user/pass | Admin | `{kiosk_name}` | `{username, password_plain_once}` |
| PATCH/DELETE | `toggleKiosk, deleteKiosk` SA | Aktif/hapus bilik | Admin | `{id}` | `{success}` |
| POST | `importVoters({rows})` SA batch 200 | Upsert DPT | Admin | `[{voter_id_number,name,department,voter_type}]` | `{inserted, skipped, errors[]}` |
| GET | RSC `/admin/voters?q&filter&page` | Search+filter paginated | Admin | `?q=&filter=&page=` | `{rows, meta}` |
| POST | `upsertCandidate(formData)` SA | CRUD + upload Storage 2MB | Admin | FormData | `{id, photo_url}` |
| GET | `/api/reports/berita-acara` | PDF A4 + hash | Admin, freeze Stop | — | `application/pdf` |
| GET | `/api/export/[voters|results]` | CSV/XLSX streaming | Admin (log unduh) | `?filter=` | file download |

### Response Format Standar (SA return + API JSON)

```json
{ "success": true, "data": { "vote_id": "uuid", "created_at": "2026-10-14T09:12:03Z" }, "error": null, "meta": null }
{ "success": false, "data": null, "error": { "code": "ALREADY_VOTED", "message": "NISN ini sudah memilih pada 09:02." }, "meta": null }
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 422 | zod fail, NISN non-numerik, CSV kolom salah |
| NOT_FOUND | 404 | VOTER_NOT_FOUND, kandidat/bilik hilang |
| UNAUTHORIZED | 401 | sesi kiosk/admin invalid (INVALID_CREDENTIALS) |
| FORBIDDEN | 403 | akses ballot tanpa verified, generate PDF sebelum Stop |
| ELECTION_CLOSED | 409 | Pause/Stop, ALREADY_VOTED khusus 409 |
| RATE_LIMITED | 429 | lookup/login throttled |
| INTERNAL_ERROR | 500 | RPC gagal, Storage/Realtime down |

### Pagination
Page-based untuk DPT: req `?q=0061&filter=sudah&page=1&limit=50`, res `meta:{page,limit,total,totalPages}`. Feed live: cursor `?before=created_at&limit=5`.

### Code Snippets

```ts
// src/app/actions/vote.ts
'use server';
import { z } from 'zod';
import { supabaseService } from '@/lib/supabase/server';
export async function castVote(input: { voter_id: string; candidate_id: string; kiosk_id: string }) {
  const s = z.object({ voter_id: z.string().uuid(), candidate_id: z.string().uuid(), kiosk_id: z.string().uuid() }).parse(input);
  const db = supabaseService();
  const { data, error } = await db.rpc('cast_vote', { p_voter_id: s.voter_id, p_candidate_id: s.candidate_id, p_kiosk_id: s.kiosk_id });
  if (error) return { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: error.message } };
  if (!data.success) return { success: false, data: null, error: { code: data.code, message: data.code } };
  return { success: true, data, error: null };
}
```

```ts
// src/app/middleware.ts — guard kiosk/admin
import { NextResponse } from 'next/server';
export function middleware(req: Request) {
  // pseudo: cek cookie kiosk-session untuk /kiosk/(vote|ballot|success), cek supabase jwt untuk /admin/*
  return NextResponse.next();
}
export const config = { matcher: ['/kiosk/:path*', '/admin/:path*'] };
```

## BAGIAN 4: Alur Logika & Business Rules

**Alur Vote kiosk (US-02→06, FR-02→06):**
1. `/kiosk/vote` input → zod numeric 8-18 → `lookupVoter` SA (rate-limit) → jika has_voted tampil ALREADY_VOTED stop.
2. Modal identitas → Ya set verified cookie (voter_id, exp 5 mnt) → redirect `/kiosk/ballot`.
3. Ballot RSC fetch candidates (tanpa vote_count, signed URL foto) → pilih 1 → ConfirmDialog → `castVote` → RPC lock FOR UPDATE + checks → sukses → `/kiosk/success` 3s → clear verified + prefetch vote.
4. Election broadcast `pause/stop` kapan saja → kiosk listener redirect `/kiosk/locked`.

**Alur Admin command (US-09→14, FR-07→16):**
1. Login Supabase Auth → guard role admin → `/admin/dashboard` subscribe 3 channel + throttle 500ms agregasi.
2. H-1 import: parse client → validasi header → batch 200 SA → skip duplikat → tampil errors downloadable.
3. H: Start → broadcast election → kiosk poll/push resume; monitor heartbeat Live<60s; Pause/Stop dengan double-confirm Stop.
4. Stop → snapshot freeze + `results_hash=sha256(json_agg)` → reports PDF/Excel enabled.

### Business Rules (dari PRD)
- Satu NISN/NIP satu suara (UNIQUE votes.voter_id + cek has_voted + FOR UPDATE).
- Vote hanya saat status=start; pause/stop tolak ELECTION_CLOSED.
- Kiosk tidak tampilkan vote_count; dashboard tidak tampilkan mapping nama→pilihan live (hanya agregat + feed anonim).
- Stop butuh confirm ganda + audit; Stop irreversible tanpa super-admin; setelah freeze vote_count read-only.
- Dilarang queue offline lalu kirim belakangan tanpa revalidasi has_voted (FR-18).
- Foto max 2MB jpg/png/webp, visi sanitize tanpa script, No urut unik.

### Error Handling & Retry

- Global: `withAction(fn)` wrapper try-catch → format standar + Sentry capture + audit log fail. Client: toast + inline field error + Retry button (tidak hilangkan state ballot).
- Retry: max 3, exponential backoff 500ms→1s→2s + jitter 100ms, timeout 5s/attempt untuk lookup/ping; castVote TIDAK auto-retry buta (idempotent by voter_id, retry hanya via tombol user 1x).
- Circuit breaker Realtime: 5 fail/10s → open 30s → half-open 1 probe → fallback polling 5s (dashboard) / banner lock (kiosk). Sembuh → resubscribe otomatis.
- Idempotency: header `X-Idempotency-Key=voter_id` untuk castVote; duplicate → kembalikan hasil pertama (ALREADY_VOTED dengan vote_id lama).
- Fallback: Supabase down → kiosk banner + blokir vote (fail-closed); Storage down → initial avatar; Realtime down → polling; PDF lib fail → retry + log.

| Fitur | Primary | Fallback | Degradation |
|-------|---------|----------|-------------|
| Live chart | Realtime WS | Polling 5s cache | Lag 5s, tetap akurat |
| Vote submit | RPC direct | Tombol retry manual | Antre 1-2s, tanpa ganda |
| Foto | Storage signed URL | Initial huruf | Estetika turun, fungsi jalan |
| PDF | jsPDF server | Print CSS browser | Tanpa hash otomatis |

```ts
// retry helper
export async function withRetry<T>(fn: () => Promise<T>, n = 3) {
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch (e) {
      if (i === n - 1) throw e;
      await new Promise(r => setTimeout(r, 500 * 2 ** i + Math.random() * 100));
    }
  } throw new Error('unreachable');
}
```

## BAGIAN 5: Keamanan, Performa, CI/CD & Deployment

### Keamanan
- RLS: `votes` NO direct insert (revoke), hanya `cast_vote() SECURITY DEFINER`; `voters` anon tidak read PII penuh (kiosk via SA yang mask); `candidates` public read active only; Storage bucket private.
- Session: kiosk httpOnly Secure SameSite=Lax 12 jam device-bound + IP hash; admin Supabase JWT 12 jam; CSRF bawaan Server Actions; bcrypt cost 12.
- Headers: CSP `default-src 'self'; img-src 'self' *.supabase.co`, HSTS, nosniff, frame-ancestors none (kecuali proyektor), XSS sanitize visi/foto.
- Rate: lookup 10/mnt/kiosk, login 5/5 mnt/device (Upstash/ in-memory LRU V1), audit semua fail.

### Performa (target PRD)
- LCP vote <1.5s tablet: RSC + `next/image` lazy + foto 800px webp + prefetch ballot/success + Tailwind purge.
- RPC P95 <800ms: FOR UPDATE minimal + index + connection pooling Supavisor; dashboard throttle 500ms + `useTransition`.
- Import 2000 <30s: parse client + batch 200 + `COPY`-like upsert; export streaming; PDF worker server (tidak blokir UI).

### CI/CD Pipeline (trunk-based: `main` + short-lived `feat/*`)

| Stage | Trigger | Actions |
|-------|---------|---------|
| Build | push any | `bun install --frozen-lockfile` → `bunx tsc --noEmit` → `bunx eslint` → `bun test` (unit) |
| Test | PR → main | integration (supabase local) + Playwright e2e kiosk vote + LHCI LCP check |
| Staging | merge main | auto-deploy Vercel preview + `supabase db push --linked staging` + smoke `/api/health` |
| Production | manual Approve + tag `pemilu-2026` | `supabase db push --linked prod` (backup dulu) + Vercel promote + smoke + freeze check |

Rollback: code revert commit + redeploy tag sebelumnya (<3 mnt Vercel); DB down-migration + restore `pg_dump` pre-Stop; verifikasi health + count votes tidak berkurang.

### Deployment
- Vercel project `e-voting-ipm`, env prod/staging terpisah, domain `pilketos.smk.sch.id` CNAME, ISR candidates 60s, cron heartbeat cleanup.
- Supabase linked prod + staging, Storage bucket `candidates` private, Realtime aktifkan untuk 4 tabel.

### Development Setup (Bun wajib)

```bash
bun --version # >=1.4.3
bun install
cp .env.example .env.local # isi SUPABASE URL/keys
bunx supabase start # DB lokal PG17
bunx supabase db push
bun run seed # admin+kiosks+candidates+50 voters
bun dev # http://localhost:3000
bun test; bunx playwright test
```

## BAGIAN 6: Monitoring & Observability

- Logging JSON `{ts,level,req_id,trace_id,actor,action,latency_ms,code}`: `next-logger` → Vercel Logs + Supabase `audit_logs` untuk bisnis. Levels debug/info/warn/error/fatal. Retensi hot 30 hari, audit 1 tahun.
- Metrics: request rate, error rate <1%, latency P50<200ms P95<500ms (API) / P95 vote<800ms, Supavisor pool <80%, Realtime subs count. Tool: Vercel Analytics + Supabase Dashboard + Sentry Performance.
- Tracing: OpenTelemetry via `@vercel/otel`, propagasi `X-Request-ID` + `traceparent` dari Server Action → RPC (via `meta`), sampling 10% sukses / 100% error.
- Alerting: error>5%/5 mnt → Slack #panitia + Email (Critical); `/api/health` non-200 → PagerDuty/WA admin; P95>2s/10 mnt Warning Slack; pool>80% Warning.
- Error tracking: Sentry (DSN server+client, source maps upload on build, alert new issue + spike).
- Dashboard: Vercel (traffic/latency) + Grafana/Supabase panel custom (turnout, per-kandidat, bilik live, import errors).

## BAGIAN 7: Environment Variables

### Database
- `NEXT_PUBLIC_SUPABASE_URL` — project URL — `https://xyz.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public — `eyJ...`
- `SUPABASE_SERVICE_ROLE_KEY` — server only, jangan expose — `eyJ... (secret)`
- `DATABASE_URL` — direct PG untuk migrate/seed — `postgresql://postgres:pass@db.xyz:5432/postgres`
- `SUPAVISOR_POOL_SIZE` — pool — `20`

### Auth
- `KIOSK_SESSION_SECRET` — sign kiosk cookie — `32+ random hex`
- `ADMIN_SESSION_TTL` — `12h`
- `BCRYPT_ROUNDS` — `12`

### App Config
- `NODE_ENV` — `production`
- `NEXT_PUBLIC_APP_URL` — `https://pilketos.smk.sch.id`
- `ELECTION_DEFAULT_STATUS` — `pause`
- `Kiosk_HEARTBEAT_SEC` — `20`
- `VOTER_VERIFY_TTL_SEC` — `300`

### Storage/API
- `STORAGE_BUCKET` — `candidates`
- `SIGNED_URL_TTL` — `3600`
- `MAX_UPLOAD_MB` — `2`

### Monitoring
- `SENTRY_DSN` — `https://xxx@sentry.io/xxx`
- `OTEL_EXPORTER_OTLP_ENDPOINT` — `http://otel:4318`
- `SLACK_WEBHOOK_PANITIA` — notif error — `https://hooks.slack...`

## BAGIAN 8: Testing Strategy

- Unit (Bun test + Vitest, target 80% line / 70% branch): `cast_vote` logic (double-vote, closed, unique violation), slug generator, CSV validator, hash snapshot, guard TTL. Contoh: vote dua kali dengan voter sama → kedua ALREADY_VOTED; status pause → ELECTION_CLOSED.
- Integration (Supabase local PG17 + `bun test:integration`): RPC end-to-end (insert votes + counter + has_voted), RLS (anon tidak bisa insert votes langsung), import batch 200 dengan duplikat, signed URL expiry.
- E2E (Playwright, Chromium tablet viewport 1024 + mobile 390): flow kritis DESIGN — login bilik → input NISN dummy → identitas Ya → pilih No.2 → confirm → sukses → auto-reset; admin login → Start → vote → dashboard naik → Pause lock → Stop → PDF download. Coverage: 2 flow utama + 404/offline.
- Folder: `tests/unit/{vote,csv,auth}.test.ts`, `tests/integration/{rpc,rls,import}.test.ts`, `tests/e2e/{kiosk.spec,admin.spec}.ts`.
- Config: test DB `supabase start` isolated + truncate tiap suite, mock Realtime dengan fake channel, mock Storage dengan file 10KB, CI `bun install && bun test && bunx playwright test --project=chromium`, coverage threshold gate di CI (fail jika <80%).

## BAGIAN 9: Data Migration & Seeding (Fresh, tanpa legacy)

Sistem baru, tidak ada legacy. Migrasi = schema init + DPT H-3.

| Table | Source | Target | Strategy | Downtime |
|-------|--------|--------|----------|----------|
| voters | CSV TU (NISN,Nama,Kelas/Tipe) | `voters` PG17 | Parse client → validasi → upsert batch 200 SA, skip duplikat | No (H-3) |
| candidates | Form + foto | `candidates` + Storage | Upload Storage → insert row | No |
| kiosks | Form nama | `kiosks` | Generate user/pass bcrypt | No |
| election_settings | Default | singleton pause | Seed SQL | No |

Process: backup kosong → push migrations → seed dev (50 voters) → import staging 200 → verifikasi count + lookup <500ms → H-3 import prod + freeze DPT (kunci import H-1 kecuali koreksi TU) → gladi 20 vote dummy lalu `TRUNCATE votes` + reset `has_voted=false, vote_count=0` sebelum H.

Rollback: restore `pg_dump` pre-import / pre-Stop; revert migration down; redeploy tag.

Seed commands (Bun):

```bash
bun run seed:admin      # buat admin@smk.sch.id via Supabase Auth API
bun run seed:references # election_settings + 3 kiosks + 3 candidates
bun run seed:demo       # 50 voters dummy NISN 00600001..
bun run seed:reset-votes # TRUNCATE votes + reset counters (gladi → H)
```

---

## Cross-ref
PRD 20 FR + DESIGN 12 screens tercover: FR-05 RPC §2/§4, FR-10 Realtime §3/§6, FR-12 import §3/§9, FR-17 RLS §2/§5, NFR <1.5s/<800ms §5/§6/§8.
