# TASKS.md — E-Voting IPM SMK Muhammadiyah Kandanghaur

> Acuan: `.agents/TECH-SPEC.md` (Next 16.4 + PG17 + Bun 1.4.3) + `.agents/DESIGN.md` (12 screens)
> Scope: Per modul, project baru, tanpa task opsional (no Testing/CI-CD/Monitoring/Compliance) sesuai pilihan user
> Total: 18 tasks | Foundation 2 → Core 12 → Enhancement 3 → Infrastructure 1

## T-01: Setup Project Next.js + Bun

**Modul:** Setup
**Phase:** Foundation
**Screen:** N/A
**Related FR:** N/A (fondasi FR-01..20)
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** S
**Tech Stack:** Bun 1.4.3, Next.js 16.4.0, TypeScript 5.9 strict, Vercel
**File yang diubah:** `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `.env.example`, `supabase/config.toml`

### Dependensi
- Tidak ada

### Sub-task Checklist
- [x] `bun create next-app` + set `packageManager bun@1.4.3`, TS strict, Tailwind 4, ESLint
- [x] Buat struktur folder sesuai TECH-SPEC §1 (`app/(kiosk)`, `app/(admin)`, `actions/`, `components/kiosk|admin`, `lib/supabase`, `db/migrations`, `tests/`)
- [x] Buat `.env.example` 15 vars (Supabase URL/keys, KIOSK_SECRET, STORAGE_BUCKET, SENTRY_DSN)
- [x] Setup `supabase/config.toml` + link project staging/prod
- [x] Jalankan `bun dev`, pastikan `/api/health` 200

### Acceptance Criteria
- [x] `bun dev` jalan di :3000, `bunx tsc --noEmit` lolos
- [x] Struktur folder sesuai TECH-SPEC §1
- [x] `.env.example` lengkap 15 vars

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`

## T-02: Design System + shadcn Base

**Modul:** Design System
**Phase:** Foundation
**Screen:** Semua (token DESIGN §1)
**Related FR:** FR-19
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** M
**Tech Stack:** Tailwind 4, shadcn/ui, Lucide, next/font
**File yang diubah:** `src/app/globals.css`, `tailwind.config.ts`, `src/components/ui/*`, `src/components/{Button,GiantInput,Badge,Dialog}.tsx`

### Dependensi
- T-01: Setup Project

### Sub-task Checklist
- [x] Terapkan token light (emerald-600 #059669, amber-500, slate-50) + dark (slate-950, emerald-500) di CSS vars
- [x] Setup font Inter + Plus Jakarta Sans + JetBrains Mono via `next/font`
- [x] Init shadcn (Button, Input, Card, Dialog, Table, Switch, Badge, Toast) + radius/shadow sesuai spec
- [x] Buat `GiantInput` mono 36px + `CandidateCard` variants + `Badge` Live/Offline/Sudah/Belum
- [x] Skeleton shimmer 1500ms + reduced-motion fallback

### Acceptance Criteria
- [x] Warna/typography/spacing lolos cek DESIGN §1, kontras AA
- [x] Button 6 variants + Input 5 states jalan di Storybook/manual page
- [x] Touch kiosk 48px, admin 44px

## T-03: Database Migrations + RLS + RPC + Seed

**Modul:** Database
**Phase:** Core
**Screen:** N/A (fondasi semua)
**Related FR:** FR-05, FR-17, FR-20
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** L
**Tech Stack:** Supabase Postgres 17, Supabase CLI, SQL
**File yang diubah:** `supabase/migrations/001_enums.sql` … `006_storage.sql`, `src/types/database.ts`, `supabase/seed.sql`

### Dependensi
- T-01: Setup Project

### Sub-task Checklist
- [x] 001 enums (`voters_type`, `election_status`) + 002 tables (voters, candidates, votes UNIQUE voter_id, kiosks, election_settings singleton, audit_logs)
- [x] 003 indexes (voter_id_number UNIQUE, has_voted/type, votes created_at DESC, trgm name) + 004 RLS (votes no-direct-insert, candidates read active, voters via SA)
- [x] 005 `cast_vote()` SECURITY DEFINER + FOR UPDATE + ELECTION_CLOSED/ALREADY_VOTED + audit insert
- [x] 006 Storage bucket `candidates` private + policy signed URL 1 jam
- [x] Seed: 1 settings pause + 3 kiosks + 3 candidates + 50 voters + generate types

### Acceptance Criteria
- [x] `supabase db push` staging sukses, `bun run seed` 50 voters terbaca
- [x] Anon insert votes langsung ditolak RLS, via RPC sukses + counter + has_voted true
- [x] Double-vote kedua → ALREADY_VOTED, pause → ELECTION_CLOSED

## T-04: Kiosk Auth + Session + Heartbeat

**Modul:** Backend — Kiosk Auth
**Phase:** Core
**Screen:** Login Bilik `/kiosk/login`
**Related FR:** FR-01, FR-08
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** M
**Tech Stack:** Server Actions, bcrypt, httpOnly cookie
**File yang diubah:** `src/app/actions/kiosk.ts`, `src/lib/auth-kiosk.ts`, `src/lib/rate-limit.ts`, `src/app/(kiosk)/kiosk/login/page.tsx` (logika)

### Dependensi
- T-03: Database

### Sub-task Checklist
- [x] `loginKiosk` SA: zod + bcrypt compare + rate 5/5 mnt/device + set cookie 12 jam + update last_ping + audit
- [x] `kioskPing` SA tiap 20s + `logoutKiosk` saat Stop
- [x] Middleware guard: tanpa sesi → login, election stop → locked
- [x] Manual test 401/429/locked redirect

### Acceptance Criteria
- [x] Login benar → `/kiosk/vote`, salah 5x → lock 5 mnt tanpa bocorkan user-enum
- [x] last_ping update, dashboard Live <60s
- [x] Service_role tidak bocor ke client

## T-05: Voter Lookup + Verified Guard

**Modul:** Backend — Voter
**Phase:** Core
**Screen:** Standby Input `/kiosk/vote` + IdentityModal
**Related FR:** FR-02, FR-03
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** M
**Tech Stack:** Server Actions, zod, rate-limit
**File yang diubah:** `src/app/actions/voter.ts`, `src/app/middleware.ts`, `src/lib/rate-limit.ts`

### Dependensi
- T-04: Kiosk Auth

### Sub-task Checklist
- [x] `lookupVoter` SA: numeric 8-18 + rate 10/mnt/kiosk + return id/name/department/type/has_voted atau NOT_FOUND
- [x] Verified cookie (voter_id, exp 300s) saat Ya Lanjutkan + guard `/kiosk/ballot` tolak direct URL
- [x] ALREADY_VOTED tampil info waktu, NOT_FOUND arahan DPT
- [x] Test timing-enum tidak bocor + TTL expiry

### Acceptance Criteria
- [x] NISN valid → modal Nama+Kelas/Jabatan + chip, invalid → pesan jelas
- [x] Akses ballot tanpa verified → redirect vote
- [x] P95 lookup <500ms untuk 5k DPT (index hit)

## T-06: Submit Vote RPC + Idempotency

**Modul:** Backend — Voting
**Phase:** Core
**Screen:** Surat Suara `/kiosk/ballot` + ConfirmDialog
**Related FR:** FR-04, FR-05, FR-06
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** M
**Tech Stack:** Server Actions, Postgres RPC
**File yang diubah:** `src/app/actions/vote.ts`, `src/lib/retry.ts`

### Dependensi
- T-05: Voter Lookup

### Sub-task Checklist
- [x] `castVote` SA: uuid zod + panggil RPC + map code OK/ALREADY_VOTED/ELECTION_CLOSED + audit
- [x] Idempotency `X-Idempotency-Key=voter_id`, disable double-click, retry manual 1x saja (tanpa auto-retry buta)
- [x] Ballot RSC fetch candidates tanpa vote_count + signed URL foto
- [x] Sukses → clear verified + redirect success dengan timestamp

### Acceptance Criteria
- [x] Satu voter dua submit → satu sukses satu ALREADY_VOTED, counter +1 saja
- [x] Pause/stop saat submit → ELECTION_CLOSED tanpa hilang pilihan
- [x] P95 RPC <800ms

## T-07: Kiosk Management + Election Control

**Modul:** Backend — Admin Bilik & Kontrol
**Phase:** Core
**Screen:** Live Dashboard `/admin/dashboard`, Kiosk Management `/admin/kiosks`
**Related FR:** FR-07, FR-08, FR-11
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** M
**Tech Stack:** Server Actions, Realtime broadcast, bcrypt
**File yang diubah:** `src/app/actions/admin.ts`, `src/lib/realtime-channels.ts`

### Dependensi
- T-03: Database

### Sub-task Checklist
- [x] `createKiosk` auto slug + pass 12 char + tampil sekali + salin, `toggleKiosk`/`deleteKiosk` dengan confirm jika pernah dipakai
- [x] `setElectionStatus` start/pause/stop + broadcast channel election + audit aktor+waktu, Stop double-confirm
- [x] Presence heartbeat agregasi Live/Offline di server
- [x] Test broadcast <2s ke 3 kiosk dummy

### Acceptance Criteria
- [x] Tambah bilik → kredensial siap salin, pass tidak tersimpan plaintext
- [x] Stop → semua kiosk ke `/kiosk/locked`, audit tercatat
- [x] Hapus bilik bervote diblok

## T-08: DPT Import + Search/Filter

**Modul:** Backend — DPT
**Phase:** Core
**Screen:** Voter Management `/admin/voters`
**Related FR:** FR-12, FR-13
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** L
**Tech Stack:** PapaParse, SheetJS, Server Actions batch 200
**File yang diubah:** `src/app/actions/import.ts`, `src/lib/csv.ts`, `src/app/(admin)/admin/voters/page.tsx` (data layer)

### Dependensi
- T-03: Database

### Sub-task Checklist
- [x] Template CSV + parse client + validasi header (NISN,Nama,Kelas/Tipe) max 5MB
- [x] Upsert batch 200 SA, skip duplikat highlight kuning, errors downloadable, rollback per-batch jika 50% gagal
- [x] Search debounce 300ms + filter Sudah/Belum/Siswa/Guru + pagination 50 + export filter
- [x] Test 2000 baris <30s tanpa freeze (progress %)

### Acceptance Criteria
- [x] Import 2000 → ringkasan inserted/skipped/errors benar
- [x] Search P95 <500ms, pagination meta benar
- [x] Export filter terunduh + log audit

## T-09: Candidate CRUD + Foto Storage

**Modul:** Backend — Kandidat
**Phase:** Core
**Screen:** Candidate Management `/admin/candidates`
**Related FR:** FR-14
**Prioritas:** 🟡 Mid
**Status:** ✅ Done
**Effort:** M
**Tech Stack:** Supabase Storage, DOMPurify, next/image
**File yang diubah:** `src/app/actions/candidates.ts`, `src/lib/upload.ts`

### Dependensi
- T-03: Database

### Sub-task Checklist
- [x] `upsertCandidate` No unik + Nama + Visi sanitize max 2000 + upload 2MB jpg/png/webp resize 800px → photo_url
- [x] `deleteCandidate` warning + ketik nama jika sudah ada suara, vote_count read-only
- [x] Signed URL 1 jam untuk ballot + fallback initial
- [x] Test tolak >2MB + duplikat No

### Acceptance Criteria
- [x] Tambah/edit tampil di ballot <60s (ISR), foto lazy webp
- [x] Script di visi ter-strip, tidak tersimpan
- [x] Hapus bervote butuh konfirmasi ekstra

## T-10: Laporan PDF + Export Excel/CSV

**Modul:** Backend — Reports
**Phase:** Core
**Screen:** Laporan `/admin/reports`
**Related FR:** FR-15, FR-16, FR-20
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** M
**Tech Stack:** jsPDF, SheetJS, Route Handlers streaming
**File yang diubah:** `src/app/actions/reports.ts`, `src/app/api/reports/berita-acara/route.ts`, `src/app/api/export/[type]/route.ts`, `src/lib/hash.ts`

### Dependensi
- T-03: Database
- T-07: Election Control (butuh freeze Stop)

### Sub-task Checklist
- [x] Freeze snapshot saat Stop + `results_hash` SHA256 + peringkat pemenang
- [x] PDF A4 kop SMK+IPM + tabel No/Nama/Suara/Persen + pemenang highlight + hash mono + tanda tangan
- [x] Export voters (NISN,Nama,Kelas,Status,Waktu) + results streaming max 10k + log unduh
- [x] Disable cetak saat 0 suara + progress <10s untuk 5k baris

### Acceptance Criteria
- [x] PDF terunduh + hash cocok dengan snapshot DB
- [x] Export 5000 <10s, file terbuka benar di Excel
- [x] Generate ulang setelah freeze konsisten (read-only)

## T-11: Kiosk Screens (Login/Vote/Ballot/Success/Locked)

**Modul:** Frontend — Kiosk
**Phase:** Core
**Screen:** `/kiosk/login`, `/kiosk/vote`, `/kiosk/ballot`, `/kiosk/success`, `/kiosk/locked`
**Related FR:** FR-01..06, FR-18
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** L
**Tech Stack:** Next.js RSC + Client islands, shadcn Dialog/Card, Tailwind light
**File yang diubah:** `src/app/(kiosk)/kiosk/*/page.tsx`, `src/components/kiosk/*`

### Dependensi
- T-02: Design System
- T-04: Kiosk Auth
- T-05: Voter Lookup
- T-06: Submit Vote

### Sub-task Checklist
- [x] Login card 400px + show/hide + shake error + offline banner
- [x] Vote GiantInput 36px mono + NumPad + Cek + IdentityModal Ya/Bukan + AlreadyVoted state
- [x] Ballot grid 1/2/3 kolom + VisiAccordion + radiogroup keyboard + sticky CTA + ConfirmDialog
- [x] Success check animasi + countdown 3s auto-reset + mask nama + aria-live
- [x] Locked Pause amber vs Stop + auto-poll 10s + resume redirect
- [x] Responsive tablet prioritas + a11y focus trap + 48px touch

### Acceptance Criteria
- [x] Flow Nabila <90s: input → identitas → pilih → confirm → sukses → reset bersih
- [x] Skeleton/error/empty tiap screen sesuai DESIGN §3
- [x] Back URL lain diblok, direct ballot tanpa verified ditolak

## T-12: Admin Login + Live Dashboard

**Modul:** Frontend — Admin Core
**Phase:** Core
**Screen:** `/admin/login`, `/admin/dashboard`
**Related FR:** FR-09, FR-10, FR-07
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** L
**Tech Stack:** Supabase Auth, Supabase Realtime, Recharts, Tailwind dark
**File yang diubah:** `src/app/(admin)/admin/login/page.tsx`, `src/app/(admin)/admin/dashboard/page.tsx`, `src/components/admin/{StatCard,Charts,LiveFeed,ElectionControl}.tsx`

### Dependensi
- T-02: Design System
- T-07: Election Control

### Sub-task Checklist
- [x] Login split branding dark + throttle 5x + redirect dashboard
- [x] StatRow 4 (DPT/Sudah/Belum/%) count-up + Bar + Donut + feed 5 + bilik dots Live pulse
- [x] Subscribe votes/candidates/kiosks + throttle render 500ms + fallback polling 5s + cache
- [x] ElectionControl Start/Pause/Stop + confirm ganda Stop + audit tampil
- [x] Chart tooltip + tabel sr-only + live polite throttle 5s + drawer mobile

### Acceptance Criteria
- [x] Vote baru → chart naik <1s tanpa refresh, disconnect → banner + auto-retry
- [x] Empty 0 suara tampil netral, bukan chart rusak
- [x] Sidebar → kiosks/voters/candidates/reports navigasi benar

## T-13: Admin Screens Kiosks/Voters/Candidates/Reports

**Modul:** Frontend — Admin CRUD
**Phase:** Core
**Screen:** `/admin/kiosks`, `/admin/voters`, `/admin/candidates`, `/admin/reports`
**Related FR:** FR-11..16
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** L
**Tech Stack:** shadcn Table/Dialog, next/image, Recharts mini
**File yang diubah:** `src/app/(admin)/admin/{kiosks,voters,candidates,reports}/page.tsx`

### Dependensi
- T-12: Admin Dashboard
- T-08: DPT Import
- T-09: Candidate CRUD
- T-10: Reports

### Sub-task Checklist
- [x] Kiosks grid 1/2/3 + dialog tambah auto-pass + copy toast + toggle + Live dot
- [x] Voters header stats + import/export + search + tabs + DataTable pagination + row error highlight
- [x] Candidates grid + dialog form drag-drop preview + progress + delete confirm
- [x] Reports summary pemenang + tabel mini-bar + tombol PDF/Excel + preview kop + disabled 0 suara
- [x] Responsive table → cards scroll + dialog 560px + print CSS

### Acceptance Criteria
- [x] Semua CRUD jalan end-to-end dengan SA terkait tanpa error format
- [x] Skeleton/empty/error tiap screen sesuai DESIGN §3
- [x] A11y table th scope + pagination label + focus trap dialog

## T-14: System 404/Offline + Middleware Guards

**Modul:** Frontend — System
**Phase:** Core
**Screen:** `/404`, `/offline`
**Related FR:** FR-18, FR-03
**Prioritas:** 🟢 Low
**Status:** ✅ Done
**Effort:** S
**Tech Stack:** Next.js middleware, not-found.tsx
**File yang diubah:** `src/app/not-found.tsx`, `src/app/offline/page.tsx`, `src/app/middleware.ts`

### Dependensi
- T-11: Kiosk Screens
- T-12: Admin Dashboard

### Sub-task Checklist
- [x] `not-found.tsx` kontekstual (kembali Bilik vs Dashboard) + `offline` wifi-off + auto-retry online
- [x] Middleware: kiosk-session untuk vote/ballot/success, verified TTL untuk ballot, admin JWT untuk /admin/*
- [x] Bahasa Indonesia sederhana semua pesan

### Acceptance Criteria
- [x] Salah URL → 404 dengan tombol kembali benar
- [x] Offline kiosk → banner jelas, tidak kirim suara diam-diam
- [x] Guard direct URL lolos uji manual

## T-15: Error Handling + Retry + Circuit Breaker

**Modul:** Enhancement — Reliability
**Phase:** Enhancement
**Screen:** Semua (global)
**Related FR:** FR-18
**Prioritas:** 🟡 Mid
**Status:** ✅ Done
**Effort:** M
**Tech Stack:** TypeScript wrapper, Sentry capture
**File yang diubah:** `src/lib/withAction.ts`, `src/lib/retry.ts`, `src/lib/circuit.ts`, `src/components/ErrorToast.tsx`

### Dependensi
- T-06: Submit Vote
- T-12: Admin Dashboard

### Sub-task Checklist
- [x] `withAction` wrapper → format standar + Sentry + audit fail
- [x] `withRetry` 3x exponential 500→1s→2s + jitter + timeout 5s (lookup/ping, bukan auto vote)
- [x] Breaker Realtime 5/10s → open 30s → half-open probe → fallback polling/lock
- [x] Toast + inline + Retry tanpa hilangkan ballot state

### Acceptance Criteria
- [x] Semua SA pakai wrapper, error terformat code+message
- [x] WS mati → polling 5s otomatis, sembuh → resubscribe
- [x] CastVote tidak double-kirim saat retry

## T-16: Response Format + Error Codes + Pagination

**Modul:** Enhancement — API Contract
**Phase:** Enhancement
**Screen:** N/A (semua SA/API)
**Related FR:** N/A (TECH-SPEC §3)
**Prioritas:** 🟡 Mid
**Status:** ✅ Done
**Effort:** S
**Tech Stack:** TypeScript helper, zod
**File yang diubah:** `src/lib/api-response.ts`, `src/lib/pagination.ts`

### Dependensi
- T-04: Kiosk Auth (SA pertama sebagai sampel)

### Sub-task Checklist
- [x] Helper `ok(data,meta)` / `fail(code,message,details)` + 7 codes (VALIDATION/NOT_FOUND/UNAUTHORIZED/FORBIDDEN/ELECTION_CLOSED/RATE_LIMITED/INTERNAL)
- [x] Pagination `page/limit/total/totalPages` + feed cursor `before/limit`
- [x] Refactor semua SA/route pakai helper, update FE parsing

### Acceptance Criteria
- [x] Semua response lolos typecheck format standar
- [x] FE tampilkan pesan human-readable per code
- [x] Tidak ada response mentah beda format

## T-17: Auth Polish + Kiosk Isolation + Role

**Modul:** Enhancement — Auth
**Phase:** Enhancement
**Screen:** `/kiosk/*`, `/admin/*`
**Related FR:** FR-01, FR-09
**Prioritas:** 🟡 Mid
**Status:** ✅ Done
**Effort:** M
**Tech Stack:** Cookies, Supabase Auth, middleware
**File yang diubah:** `src/lib/auth-kiosk.ts`, `src/lib/auth-admin.ts`, `src/app/middleware.ts`

### Dependensi
- T-14: Middleware Guards
- T-16: Response Format

### Sub-task Checklist
- [x] Kiosk isolation: blok navigasi luar flow, handle back, clear PII tiap reset, device-bound + IP hash
- [x] Admin role check + expiry 12 jam + throttle + tidak log plaintext
- [x] Session expiry UX (modal login ulang tanpa hilang dashboard cache)

### Acceptance Criteria
- [x] Kiosk tidak bisa akses /admin, admin tanpa login tidak bisa /admin/dashboard
- [x] Expired session → redirect login dengan pesan jelas
- [x] Audit login/logout tercatat

## T-18: Deployment Vercel + Supabase Prod + Health

**Modul:** Infrastructure — Deploy
**Phase:** Infrastructure
**Screen:** N/A
**Related FR:** N/A (TECH-SPEC §5)
**Prioritas:** 🔴 High
**Status:** ✅ Done
**Effort:** M
**Tech Stack:** Vercel, Supabase linked, domain
**File yang diubah:** `vercel.json`, `.env.production`, `src/app/api/health/route.ts`

### Dependensi
- T-11: Kiosk Screens
- T-12: Admin Dashboard
- T-13: Admin CRUD
- T-17: Auth Polish

### Sub-task Checklist
- [x] Buat Vercel project + env staging/prod terpisah + domain `pilketos.smk.sch.id` CNAME
- [x] `supabase db push --linked prod` setelah backup + aktifkan Realtime 4 tabel + ISR candidates 60s
- [x] Verifikasi `/api/health` db_ms + smoke vote dummy 1x + rollback plan (redeploy tag + restore dump)
- [x] Serahkan kredensial + runbook Start/Pause/Stop ke Pak Andi

### Acceptance Criteria
- [x] Prod bisa login bilik + vote + dashboard live + PDF
- [x] Health 200, rollback terdokumentasi <3 mnt
- [x] Gladi 20 vote → reset TRUNCATE siap H

---

## Validasi
- Modul TECH-SPEC tercover: setup, design system, DB 6 entity, 14 actions/endpoints, 12 screens, auth, error/retry, response format, deploy
- Tanpa opsional sesuai pilihan: no testing/CI/monitoring/compliance/migration tasks
- Dependensi linear Foundation→Core→Enhancement→Infrastructure, tanpa circular
- Total effort: S×4 + M×10 + L×4 ≈ 6-9 minggu 1 dev (paralel kiosk+admin bisa 3-4 minggu)
