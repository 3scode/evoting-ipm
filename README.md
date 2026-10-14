# E-Voting IPM — SMK Muhammadiyah Kandanghaur

Aplikasi e-voting berbasis web untuk pemilihan Ketua IPM dengan sistem **Bilik Suara Terpusat (Kiosk Mode)** + **Live Dashboard Command Center**.

- Pemilih mencoblos di device bilik panitia (tanpa HP pribadi): input NISN/NIP → konfirmasi identitas → surat suara digital → sukses + auto-reset 3 detik.
- Admin pantau real-time: perolehan suara (Bar/Donut), status bilik Live/Offline, Start/Pause/Stop terpusat, kelola DPT + kandidat + cetak Berita Acara.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Bun 1.4.x (wajib `bun`, bukan npm/node) |
| Framework | Next.js 16.4 (App Router, Server Actions, Server Components), React 19, TypeScript 5.9 |
| Styling | Tailwind CSS 4, shadcn/ui, Lucide |
| Database/Auth/Realtime/Storage | Supabase (Postgres 17, Auth, Realtime, Storage bucket `candidates`) |
| Chart/Import/Export | Recharts, PapaParse, SheetJS, jsPDF |
| Hosting | Vercel |

Dokumen lengkap: `.agents/DESIGN.md`, `.agents/PRD.md`, `.agents/TECH-SPEC.md`, `.agents/TASKS.md`.

---

## Prasyarat

1. **Bun ≥ 1.4** — cek dengan `bun --version` (repo ini pakai `packageManager: bun@1.4.3`, Bun 1.4.2 tetap jalan). Install: https://bun.sh
2. **Akun Supabase** (gratis cukup) — https://supabase.com, untuk project cloud. Opsional: Supabase CLI + Docker kalau mau DB lokal.
3. **Akun Vercel** (hanya untuk deploy) — https://vercel.com

---

## Cara Setup & Jalankan di Local

### 1. Clone & install

```bash
git clone <repo-url> e-voting-ipm
cd e-voting-ipm
bun install
```

### 2. Buat project Supabase (cloud, cara termudah)

1. Buka https://supabase.com/dashboard → **New project** → isi nama `e-voting-ipm`, pilih region terdekat (Singapore), tunggu provisioning.
2. Buka **Project Settings → API**, catat:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` (klik Reveal, **rahasia, hanya di server**) → `SUPABASE_SERVICE_ROLE_KEY`
   - `Database → Connection string (URI)` → `DATABASE_URL`
3. Buka **Authentication → Users → Add user** untuk akun admin, contoh:
   - Email: `admin@smk.sch.id`, password bebas (min 8 karakter), centang **Auto Confirm User**.

### 3. Isi environment

```bash
cp .env.example .env.local
```

Edit `.env.local`, minimal isi 4 ini:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # JANGAN commit / expose ke client
DATABASE_URL=postgresql://postgres:xxxxx@db.xyz.supabase.co:5432/postgres
```

 Sisanya (`KIOSK_SESSION_SECRET`, `STORAGE_BUCKET=candidates`, dsb.) sudah ada default di `.env.example` dan bisa dipakai apa adanya untuk local.

### 4. Jalankan migration database

Migration ada di `supabase/migrations/` (`001_enums` → `006_storage`). Pilih salah satu:

**Opsi A — via Supabase Dashboard (paling mudah, tanpa CLI):**
Buka **SQL Editor → New query**, jalankan isi file **berurutan**: `001_enums.sql`, `002_tables.sql`, `003_indexes.sql`, `004_rls.sql`, `005_rpc.sql`, `006_storage.sql`.

**Opsi B — via Supabase CLI:**

```bash
bunx supabase login
bunx supabase link --project-ref xyz   # xyz = project ref dari URL
bunx supabase db push
```

Verifikasi: tabel `voters`, `candidates`, `votes`, `kiosks`, `election_settings`, `audit_logs` muncul di **Table Editor**, dan function `cast_vote` ada di **Database → Functions**.

Aktifkan Realtime untuk 4 tabel di **Database → Replication**: `votes`, `candidates`, `kiosks`, `election_settings`.

Buat Storage bucket di **Storage → New bucket**: nama `candidates`, **Private** (bukan public).

### 5. Seed data demo (opsional tapi disarankan)

```bash
bun run seed
```

Isinya: 3 bilik (`bilik-lab-1`, `bilik-lab-2`, `bilik-aula`, password semua `Bilik#123`), 3 kandidat demo, 50 pemilih demo (NISN `0000600001` dst).

Varian:

```bash
bun run seed:references   # hanya bilik + kandidat
bun run seed:demo          # hanya 50 voters demo
bun run seed:reset-votes   # cetak SQL reset hasil gladi (TRUNCATE votes + reset counter)
```

### 6. Jalankan dev server

```bash
bun dev
```

Buka http://localhost:3000, cek health: http://localhost:3000/api/health → `{"success":true,...}`.

| URL | Fungsi |
|---|---|
| `/` | Landing (link ke bilik & command center) |
| `/kiosk/login` | Login bilik (pakai kredensial seed, mis. `bilik-lab-1` / `Bilik#123`) |
| `/kiosk/vote` | Standby input NISN/NIP + modal identitas |
| `/kiosk/ballot` | Surat suara (wajib lewat verifikasi dulu) |
| `/admin/login` | Login admin (akun dari langkah 2.3) |
| `/admin/dashboard` | Live analytics + Start/Pause/Stop |
| `/admin/kiosks`, `/admin/voters`, `/admin/candidates`, `/admin/reports` | CRUD + import + laporan |

**Alur coba cepat (local):**
1. Login admin → `/admin/dashboard` → klik **Start**.
2. Di tab lain login bilik → input salah satu NISN demo → **Ya, Lanjutkan** → pilih kandidat → **Ya, Kirim Suara** → sukses auto-reset 3 detik.
3. Kembali ke dashboard: angka + grafik naik tanpa refresh. Klik **Stop** → semua bilik terkunci → `/admin/reports` bisa cetak Berita Acara.

### Scripts

| Command | Fungsi |
|---|---|
| `bun dev` | Dev server :3000 |
| `bun run build` / `bun start` | Build production + run hasil build |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | Next lint |
| `bun test` | Unit test (Bun test) |
| `bun run seed*` | Seed demo (lihat varian di atas) |

---

## Cara Deploy ke Vercel

### Opsi A — via Dashboard Vercel (disarankan)

1. Push repo ke GitHub/GitLab/Bitbucket.
2. Buka https://vercel.com/new → **Import** repo → framework terdeteksi **Next.js**, biarkan build command default (`next build`).
3. Di **Environment Variables**, isi minimal (copy dari `.env.local` production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (wajib secret, jangan prefix `NEXT_PUBLIC_`)
   - `DATABASE_URL` (untuk seed/migrate bila perlu)
   - `KIOSK_SESSION_SECRET` (isi random 32+ char baru, beda dari local)
   - `NEXT_PUBLIC_APP_URL` = URL Vercel kamu, mis. `https://e-voting-ipm.vercel.app`
   - Sisanya samakan dengan `.env.example` (`STORAGE_BUCKET`, `SIGNED_URL_TTL`, `MAX_UPLOAD_MB`, dsb.)
4. Klik **Deploy**, tunggu hingga live.
5. **Pasca-deploy (wajib sekali):**
   - Pastikan migration `001–006` sudah dijalankan di **Supabase project production** (jangan pakai DB local).
   - Pastikan bucket `candidates` (Private) + Realtime 4 tabel aktif (langkah local no. 4).
   - Buat akun admin production via **Supabase Dashboard → Authentication**.
   - Buka `https://<app>.vercel.app/api/health` → harus `{"success":true}`.
   - Smoke test: Start → vote 1x dari HP/laptop → dashboard naik → Stop → cetak Berita Acara.
6. (Opsional) Custom domain sekolah, mis. `pilketos.smk.sch.id`: **Vercel → Settings → Domains → Add** → tambahkan CNAME di DNS ke `cname.vercel-dns.com` → update `NEXT_PUBLIC_APP_URL` + redeploy.

### Opsi B — via CLI

```bash
bunx vercel login
bunx vercel link
bunx vercel env add NEXT_PUBLIC_SUPABASE_URL production
bunx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
bunx vercel env add SUPABASE_SERVICE_ROLE_KEY production
bunx vercel env add DATABASE_URL production
bunx vercel env add KIOSK_SESSION_SECRET production
bunx vercel env add NEXT_PUBLIC_APP_URL production
bunx vercel --prod
```

### Catatan deploy

- Setiap push ke branch utama = deploy production otomatis; Pull Request = preview deployment terpisah (aman untuk gladi).
- Rollback: **Vercel → Deployments → pilih deployment lama → Promote to Production** (< 3 menit). Untuk DB, restore dari backup `pg_dump` sebelum Stop, lalu jalankan down/up migration bila perlu.
- Jangan pernah expose `SUPABASE_SERVICE_ROLE_KEY` ke client / prefix `NEXT_PUBLIC_` / commit ke git.

---

## Troubleshooting

| Gejala | Penyebab umum → solusi |
|---|---|
| `bun install` lama/timeout | Deps Next.js besar → ulangi dengan koneksi stabil, atau `bun install --no-progress` |
| `/api/health` → `db_reachable: false` | URL/anon key salah → cek `.env.local`, restart `bun dev` |
| Login bilik 401 terus | Username case-sensitive (lowercase) / password salah → cek tabel `kiosks`, atau re-seed |
| `lookupVoter` 429 | Rate limit 10/menit/kiosk → tunggu 1 menit (by design anti brute-force NISN) |
| Vote → `ELECTION_CLOSED` | Status masih `pause` → admin klik **Start** di dashboard |
| Dashboard tidak live | Realtime belum diaktifkan untuk tabel / anon key salah → cek Replication + env |
| Foto kandidat tidak tampil | Bucket belum ada / bukan private + policy → buat bucket `candidates`, cek `SIGNED_URL_TTL` |
| Build Vercel gagal `env missing` | Env production belum diisi → lengkapi di **Settings → Environment Variables** lalu redeploy |
| PDF kosong / tombol disabled | 0 suara masuk → normal, tombol aktif setelah ≥ 1 suara + status Stop |

Gladi → H: jalankan SQL dari `bun run seed:reset-votes` di SQL Editor production untuk mengosongkan hasil gladi sebelum hari-H.
# evoting-ipm
