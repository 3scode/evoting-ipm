# DESIGN.md — E-Voting IPM SMK Muhammadiyah Kandanghaur

> Versi: 1.0 | Tanggal: 2026-10-14
> Platform: Web (Next.js 16 App Router + Supabase + Tailwind + shadcn/ui)
> Style: Modern & Clean | Mode: Both (Kiosk Light + Admin Dark Command Center)
> Pendekatan: Sistem Bilik Suara Terpusat (Kiosk Mode) & Live Dashboard

## Unique Value Proposition (UVP)

**"Bilik Aman, Hasil Live, Tanpa HP Pribadi."**

Dari riset aplikasi serupa:
- E-voting OSIS/IPM umum (SMAMDA, Mu'allimaat, Spemutu): pakai kode/QR + HP pribadi, rawan pinjam akun, tidak ada monitoring bilik.
- SaaS voting (Survey & Ballot Systems): kuat di live dashboard tapi tidak paham DPT sekolah (NISN/NIP, Kelas/Jabatan) dan tidak ada kiosk isolation.
- E-voting kampus open-source: fokus keamanan kripto tapi UX rumit untuk siswa.

**Pembeda E-Voting IPM ini:**
1. **Kiosk Mode Terpusat:** device disediakan panitia, voter tidak perlu HP/internet pribadi. Reduksi kecurangan + akses merata.
2. **Validasi Identitas Dinamis:** NISN → tunjukkan Nama+Kelas, NIP/NBM → Nama+Jabatan. Anti-salah orang, konfirmasi [Ya, Lanjutkan]/[Bukan, Kembali].
3. **Command Center Real-time:** Supabase Realtime Bar/Donut + status bilik Live/Offline + Election Control Start/Pause/Stop yang mengunci semua bilik seketika.
4. **Integritas Transaksional:** RPC atomik `INSERT votes + UPDATE candidates.vote_count + UPDATE voters.has_voted` + RLS ketat, cegah double-vote & race condition.
5. **Auto-Reset 3 Detik:** privasi bilik terjaga, antrean cepat, tanpa sisa sesi.

UVP ini menjadi acuan seluruh visual: Kiosk harus besar, tenang, minim distraksi (slate-50). Admin harus gelap, padat data, kesan ruang kontrol (slate-950).

---

## BAGIAN 1: Design System

### Design Style
- **Style:** Modern & Clean
- **Platform:** Web (responsive, prioritas 1366x768 laptop panitia + 10" tablet bilik)
- **Mode:** Both — Kiosk Light (default) + Admin Dark
- **UVP Highlight:** Kiosk = trustworthy & calm, Admin = control & urgency

### Color Palette

**Light Mode (Kiosk):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#0284C7` sky-600 | Brand Muhammadiyah/Aman, main CTA Pilih/Konfirmasi |
| `--color-primary-hover` | `#0369A1` sky-700 | Hover/active primary |
| `--color-primary-soft` | `#D1FAE5` sky-100 | Background badge sukses, highlight terpilih |
| `--color-secondary` | `#334155` slate-700 | Secondary button, teks heading sekunder |
| `--color-accent` | `#FBBF24` amber-400 | Identitas IPM, nomor urut, warning, chart series-2 |
| `--color-accent-hover` | `#D97706` amber-600 | Hover accent |
| `--color-surface` | `#FFFFFF` | Card kandidat, modal, input bg |
| `--color-background` | `#F8FAFC` slate-50 | Page bg bilik, tidak melelahkan mata |
| `--color-text-primary` | `#0F172A` slate-900 | Main text, nama kandidat |
| `--color-text-secondary` | `#64748B` slate-500 | Muted, label NISN, helper |
| `--color-error` | `#DC2626` red-600 | Error, tombol hapus, validasi gagal |
| `--color-success` | `#16A34A` green-600 | Sukses vote, status sudah memilih |
| `--color-border` | `#E2E8F0` slate-200 | Divider, card border, input border |
| `--color-info` | `#0284C7` sky-600 | Info, link visi-misi expand |

**Dark Mode (Admin Command Center):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary-dark` | `#10B981` sky-500 | CTA utama di dark, grafik kandidat-1 |
| `--color-primary-hover-dark` | `#34D399` sky-400 | Hover dark |
| `--color-secondary-dark` | `#38BDF8` sky-400 | Series chart, secondary action dark |
| `--color-accent-dark` | `#FBBF24` amber-400 | Nomor urut, highlight IPM di dark |
| `--color-surface-dark` | `#1E293B` slate-800 | Card/panel admin |
| `--color-surface-elevated-dark` | `#334155` slate-700 | Modal, dropdown di dark |
| `--color-background-dark` | `#020617` slate-950 | Page bg command center |
| `--color-text-primary-dark` | `#F8FAFC` slate-50 | Main text dark |
| `--color-text-secondary-dark` | `#94A3B8` slate-400 | Muted dark |
| `--color-error-dark` | `#F87171` red-400 | Error dark |
| `--color-success-dark` | `#34D399` sky-400 | Sukses/live indicator |
| `--color-border-dark` | `#334155` slate-700 | Border dark |
| `--color-warning-dark` | `#FBBF24` amber-400 | Pause/offline warning |

Kontras: slate-900 on slate-50 = 15.6:1, white on sky-600 = 4.6:1 (AA pass untuk large text/button bold), slate-50 on slate-950 = 18:1. Amber hanya untuk aksen besar/icon, tidak untuk body text kecil di atas putih.

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| Font Family Body | `Inter, Geist, system-ui` | UI, angka, tabel DPT — keterbacaan tinggi |
| Font Family Display | `Plus Jakarta Sans, Poppins` | Heading, nama kandidat, judul bilik |
| Font Family Mono | `JetBrains Mono, monospace` | NISN/NIP, kredensial bilik, kode, timestamp |
| `--font-h1` | 32px / 700 / 40px, Display | Judul halaman bilik "Masukkan NISN/NIP", judul dashboard |
| `--font-h2` | 24px / 700 / 32px, Display | Section title, nama kandidat di kartu |
| `--font-h3` | 20px / 600 / 28px, Display | Card title admin, dialog title |
| `--font-body` | 16px / 400 / 24px, Body | Body, visi-misi, tabel |
| `--font-body-lg` | 18px / 500 / 28px, Body | Input bilik standby, deskripsi penting |
| `--font-caption` | 14px / 400 / 20px, Body | Label, helper, meta kelas/jabatan |
| `--font-mono` | 14px / 500 / 20px, Mono | NISN/NIP display, password bilik |
| `--font-button` | 16px / 600 / 24px, Body | Button text, min 16px agar touch-friendly |
| `--font-kiosk-input` | 36px / 700 / 44px, Mono | Input raksasa bilik text-3xl+ center |

### Spacing (4px Grid)

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--space-3xl` | 64px (hero bilik) |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Input kecil admin, badge |
| `--radius-md` | 8px | Input bilik, button default |
| `--radius-lg` | 16px | Card kandidat, modal dialog |
| `--radius-full` | 999px | Nomor urut chip, avatar fallback, status dot |

### Elevation / Shadow

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(2,6,23,.06)` | Card admin, tabel row hover |
| `--shadow-md` | `0 4px 12px rgba(2,6,23,.10)` | Card kandidat terangkat, dropdown |
| `--shadow-lg` | `0 12px 32px rgba(2,6,23,.18)` | Modal konfirmasi, dialog identitas |

### Icon Style
- Style: Outline, stroke 2px, rounded caps (Lucide)
- Default: 24px (kiosk action), 20px (admin table), 16px (inline meta)
- Touch target kiosk min 48x48px, admin min 44x44px
- Skeleton loading: shimmer gradient `slate-200 → slate-100 → slate-200` (light), `slate-800 → slate-700 → slate-800` (dark), animasi 1500ms linear loop. Pulse fallback untuk prefers-reduced-motion.

---

## BAGIAN 2: Screen Map & User Flow

### Information Architecture / Sitemap

```
[Depth 0] / (Landing redirect by role)
├── [Depth 1] Kiosk Module (/kiosk)
│   ├── [Depth 2] /kiosk/login — Login Bilik
│   ├── [Depth 2] /kiosk/vote — Standby Input NISN/NIP (+ modal identitas)
│   ├── [Depth 2] /kiosk/ballot — Surat Suara Digital (+ modal konfirmasi)
│   ├── [Depth 2] /kiosk/success — Sukses + Auto-reset 3s
│   └── [Depth 2] /kiosk/locked — Bilik Terkunci (Stop/Pause)
├── [Depth 1] Admin Module (/admin)
│   ├── [Depth 2] /admin/login — Login Admin
│   ├── [Depth 2] /admin/dashboard — Live Analytics Command Center
│   ├── [Depth 2] /admin/kiosks — Kiosk Management
│   ├── [Depth 2] /admin/voters — Voter Management (DPT)
│   ├── [Depth 2] /admin/candidates — Candidate Management
│   └── [Depth 2] /admin/reports — Laporan & Berita Acara
└── [Depth 1] System
    ├── [Depth 2] /404 — Not Found
    └── [Depth 2] /offline — Offline Fallback (kiosk)
```

**Navigasi Depth:** maksimal 2 level (Module → Screen). Tidak ada depth-3 untuk jaga kecepatan bilik.
**Breadcrumb:** Tidak ada di kiosk (anti-bingung). Ada di admin: `Admin / [Module]`.
**Nesting Rules:** Jika butuh detail, pakai Dialog/Drawer, bukan route baru. Contoh: detail kandidat = expand di ballot, bukan halaman baru.

### Screen Inventory

| # | Screen | Route | Module | Depth |
|---|--------|-------|--------|-------|
| 1 | Login Bilik | `/kiosk/login` | Kiosk | L1 |
| 2 | Standby Input NISN/NIP | `/kiosk/vote` | Kiosk | L1 |
| 3 | Surat Suara Digital | `/kiosk/ballot` | Kiosk | L1 |
| 4 | Sukses Memilih | `/kiosk/success` | Kiosk | L1 |
| 5 | Bilik Terkunci | `/kiosk/locked` | Kiosk | L1 |
| 6 | Login Admin | `/admin/login` | Admin | L1 |
| 7 | Live Dashboard | `/admin/dashboard` | Admin | L1 |
| 8 | Kiosk Management | `/admin/kiosks` | Admin | L1 |
| 9 | Voter Management (DPT) | `/admin/voters` | Admin | L1 |
| 10 | Candidate Management | `/admin/candidates` | Admin | L1 |
| 11 | Laporan & Berita Acara | `/admin/reports` | Admin | L1 |
| 12 | 404 / Offline | `/404`, `/offline` | System | L1 |

### User Flow Diagram

```
[K01 Login Bilik] ──→ [K02 Input NISN] ──→ [Modal Identitas] ──→ [K03 Ballot]
     │                    │                        │                   │
     │              (salah/Belum)            [Bukan,Kembali]      [Konfirmasi Modal]
     │                    │                        │                   │
     └─→ [K05 Locked] ←──┴── (Stop/Pause) ────────┴─────→ [K04 Success 3s] ──→ [K02]

[A06 Login Admin] ──→ [A07 Dashboard Live] ──→ [A08 Kiosks]
                           │  ⇢ [A09 Voters] ⇢ [Import CSV]
                           │  ⇢ [A10 Candidates] ⇢ [Upload Foto]
                           └──→ [A11 Reports] ──→ [Export PDF/Excel]
```

**Legend:** `→` primary, `⇢` alternative (tab/sidebar), `←` auto/back.

### Main Flows

**Flow 1: Mencoblos di Bilik (core, <90 detik)**
1. `/kiosk/login` — Panitia login pagi hari dengan username `bilik-lab-1` + password (JetBrains Mono, show/hide). Session kiosk tersimpan, masuk Kiosk Mode.
2. `/kiosk/vote` — Layar standby besar "Masukkan NISN / NIP". Pemilih ketik 10 digit + tap [Cek]. Validasi format lokal.
3. Modal Identitas — Jika siswa: "Budi Santoso — XII RPL 1", jika guru: "Ibu Siti — Waka Kurikulum". Tombol [Ya, Lanjutkan] sky / [Bukan, Kembali] ghost.
4. `/kiosk/ballot` — Kartu kandidat side-by-side (foto 4:3, nomor amber chip, nama Plus Jakarta Sans, visi-misi collapsed + [Lihat Visi Misi]). Tap kartu = selected ring sky + tombol [Pilih No.X] aktif.
5. Modal Konfirmasi — "Yakin memilih No.2 Ananda? Suara tidak dapat diubah." [Ya, Kirim Suara] / [Cek Lagi].
6. RPC vote → `/kiosk/success` check hijau besar + "Terima kasih, suara tercatat" + countdown 3-2-1 → auto-reset ke `/kiosk/vote`, clear state. Jika `has_voted=true` di langkah 2, tolak dengan pesan "NISN ini sudah memilih".

**Flow 2: Command Center Admin (real-time)**
1. `/admin/login` — Admin/panitia inti login (email+password Supabase Auth).
2. `/admin/dashboard` — Subscribe channel `votes`, `candidates`, `kiosks`. Lihat total pemilih, sudah/belum, partisipasi %, Bar + Donut Recharts auto-update tanpa refresh, feed suara masuk 5 terakhir, status bilik dots.
3. Sidebar → `/admin/kiosks` tambah bilik (auto-generate user/pass), toggle `is_active`, lihat `last_ping` → Live (<60s) / Offline. → `/admin/voters` import CSV, filter Sudah/Belum, search NISN. → `/admin/candidates` CRUD + upload Storage.
4. Election Control di header dashboard: [Start] sky / [Pause] amber / [Stop] red dengan confirm dialog. Saat Stop → semua kiosk redirect ke `/kiosk/locked`.
5. `/admin/reports` — Cetak Berita Acara PDF (kop SMK Muhammadiyah Kandanghaur, tabel perolehan, tanda tangan), export DPT CSV/Excel.

### Responsive Behavior
- **Mobile (<768px):** Kiosk ballot stack vertikal 1 kolom, input font 28px, bottom CTA sticky. Admin: sidebar jadi bottom nav/drawer, chart stack, tabel jadi card list + horizontal scroll.
- **Tablet (768-1024px):** Target utama bilik. Ballot 2 kolom, input 36px center. Admin grid 2 kolom.
- **Desktop (>1024px):** Bilik max-width 960px center. Admin sidebar 260px fixed + content 3 kolom stats + 2 kolom chart.

---

## BAGIAN 3: Per-Screen Design

> Semua warna/typography/spacing merujuk Bagian 1.

### Screen 01: Login Bilik — `/kiosk/login`

**Purpose:** Otentikasi device pagi hari oleh panitia. Masuk Kiosk Mode terkunci.
**UVP Highlight:** Kiosk Isolation dimulai di sini — setelah login tidak bisa akses URL lain.
**Route:** `/kiosk/login` **Access:** Public (device panitia)

**Layout:**
```
┌──────────────────────────────┐
│ [Logo IPM 64px]              │
│ PILKETOS IPM 2026            │
│ SMK Muh Kandanghaur          │
├──────────────────────────────┤
│ Card center 400px            │
│  Bilik Label                 │
│  [Username____]              │
│  [Password___][eye]          │
│  [Masuk ke Bilik →] big      │
│  helper: Hubungi admin jika  │
│  lupa kredensial             │
└──────────────────────────────┘
```

**Components:** LogoBlock top, AuthCard center, TextInput username/password, Button primary lg, ShowToggle eye.

| Component | Position | Description |
|-----------|----------|-------------|
| LogoBlock | Top center | Logo IPM + kop sekolah, h1 24px Display |
| AuthCard | Center | Surface white, radius-lg, shadow-md, padding 32px |
| Button Masuk | Bottom card | Primary sky full-width lg |

**States:**
| State | Visual | Trigger |
|-------|--------|---------|
| Default | Empty inputs, button enabled | Awal |
| Loading | Button spinner "Menghubungkan..." | Submit |
| Error | Inline red "Username/password salah" + shake | 401 |
| Success | Toast green + redirect /kiosk/vote | 200 |
| Offline | Banner amber "Tidak ada internet" | navigator offline |
| Locked | Redirect /kiosk/locked jika election=stopped | Election stopped |

**Skeleton:** Header logo pulse circle 64px, card rect 400x320 shimmer, button rect full shimmer 1500ms.
**Empty:** N/A (form) — helper text "Minta kredensial ke admin command center."
**Error Detail:** API 500 → card error + Retry; Offline → full banner + auto-retry on online; 404 → link kembali; Validation → border red + pesan di bawah field.
**Data Format:** username Text `kiosks.username` lowercase slug `bilik-lab-1`; password Password min 8 char; last_ping Timestamp ISO auto-update on login.
**Micro-interactions:** Input focus ring sky 200ms ease-out; button click scale .96 100ms; error shake 300ms; success fade-slide to /vote 300ms.
**Interactions:** Submit → loading→success; Eye toggle → show/hide; Back blocked dengan confirm "Keluar bilik?".
**Accessibility:** Label htmlFor, aria-invalid on error, focus trap, contrast 4.6:1, Enter submit, touch 48px.
**Responsive:** Mobile card full-width margin 16px; tablet 400px center; desktop + ilustrasi samping.

### Screen 02: Standby Input NISN/NIP — `/kiosk/vote`

**Purpose:** Layar idle antrean. Universal input satu field untuk siswa+guru.
**UVP Highlight:** Inti kecepatan — satu input besar, tanpa pilih tipe manual.
**Route:** `/kiosk/vote` **Access:** Kiosk session required

**Layout:**
```
┌──────────────────────────────┐
│ Header: [Bilik Lab 1 • Live] │
├──────────────────────────────┤
│  Masukkan NISN / NIP         │
│  [  0012345678  ] 36px mono  │
│  [NumPad 1-9,0,Hapus] (tablet)│
│  [ Cek Identitas → ] big     │
│  Antrean: privasi terjaga    │
├──────────────────────────────┤
│ Footer: Pemilu IPM Jujur     │
└──────────────────────────────┘
+ Modal Identitas (lihat bawah)
```

**Components:** KioskHeader, GiantInput mono center, NumPad (tablet), CTA Button, IdentityModal.

**States:** Default (placeholder "Contoh: 006123..."), Typing (clear button X), Checking (button loading + input disabled), IdentityFound (modal pop), AlreadyVoted (red inline modal "Sudah memilih"), ElectionPaused (amber banner overlay).

**Skeleton:** Input rect 480x72 shimmer, numpad grid 3x4 rects shimmer.
**Empty Spec:** Ilustrasi ballot 120px, Title "Siap menerima pemilih", Desc "Masukkan NISN/NIP untuk mulai. Maks 2 baris.", CTA none (idle).
**Error Detail:** Validation non-numeric → inline red; Not found NISN → modal "Data tidak ditemukan, hubungi panitia DPT"; Already voted → red + info waktu memilih; Offline → queue lokal + banner; 500 → retry.
**Data Format:** voter_id_number Text numeric 8-18 digit, trim; name Text title-case; department Text "XII RPL 1" / "Guru Mapel"; voter_type Enum siswa/guru dari prefix; has_voted Boolean.
**Micro:** Keypress scale numpad 100ms; modal fade+scale-up 250ms ease-out; success check pop 300ms; idle pulse logo 3s loop subtle.
**Interactions:** Enter → Cek; NumPad tap → append; [Ya,Lanjutkan] → /ballot; [Bukan] → close + clear.
**Accessibility:** aria-live untuk hasil cek, role dialog modal, focus ke input on mount & after reset, Esc tutup modal, mono 36px readable.
**Responsive:** Mobile numpad full + CTA sticky bottom; tablet numpad + keyboard fisik support; desktop max 640px center + shortcut F.

**Modal Identitas Spec:** Foto initial circle 56px, Nama h2 20px, Chip tipe (siswa sky-soft / guru sky-soft), Kelas/Jabatan caption, NISN mono, tombol Ya sky lg + Bukan ghost.

### Screen 03: Surat Suara Digital — `/kiosk/ballot`

**Purpose:** Tampilkan pilihan, expand visi-misi, pilih satu.
**UVP Highlight:** Kertas suara digital yang sah — foto jelas, nomor amber IPM, sekali tap.
**Route:** `/kiosk/ballot?voter=xxx` **Access:** Kiosk + voter verified (guard)

**Layout:**
```
┌──────────────────────────────┐
│ Halo, Budi (XII RPL 1) [Ganti]│
├──────────────────────────────┤
│ Pilih Satu Kandidat:         │
│ ┌─────┐ ┌─────┐ ┌─────┐      │
│ │Foto │ │Foto │ │Foto │      │
│ │No.1 │ │No.2 │ │No.3 │      │
│ │Nama │ │Nama │ │Nama │      │
│ │[Visi▼]│ ... │ ... │       │
│ └─────┘ └─────┘ └─────┘      │
│ [ Batal ] [ Pilih No.X → ]   │
└──────────────────────────────┘
+ Modal Konfirmasi
```

**Components:** VoterChip, CandidateCard x2-4, VisiAccordion, StickyActionBar, ConfirmDialog.

**States:** Default (none selected, CTA disabled), Selected (ring sky + CTA enabled "Pilih No.2 Ananda →"), Expanded (visi open), ConfirmOpen (modal), Submitting (overlay spinner "Merekam suara..."), Success → redirect.

**Skeleton:** 3 card rects 280x380 shimmer image 4:3 + lines.
**Empty:** Ilustrasi kotak kosong, Title "Belum ada kandidat", Desc "Panitia belum input paslon.", CTA "Kembali" + lapor admin.
**Error:** Submit fail → toast red + Retry tetap di ballot (tidak hilang pilihan); Offline → block submit + banner; Double submit dicegah disable; Validation pilih dulu → shake CTA + tooltip.
**Data Format:** candidate_number Integer unique badge `No.1`; name Text 24px Display truncate 2 lines; vision_mission HTML render <300 char preview + expand; photo_url Image 4:3 lazy, fallback initial; vote_count Hidden di kiosk (jaga netralitas).
**Micro:** Card hover lift 4px shadow-md 250ms; select ring animate 200ms + check badge pop; accordion height 300ms ease-in-out; confirm scale-up 250ms; submit button progress 500ms.
**Interactions:** Tap card → select; Tap visi → expand (stopPropagation); Pilih → confirm; Ya,Kirim → RPC; Batal/Ganti → back to /vote clear.
**Accessibility:** radiogroup + radio aria-checked, arrow keys pindah kandidat, focus trap di modal, alt foto "Foto paslon No.X Nama", kontras nama 15:1.
**Responsive:** Mobile 1 kolom stack + sticky CTA; tablet 2 kolom grid; desktop 3-4 kolom max 960px.

### Screen 04: Sukses Memilih — `/kiosk/success`

**Purpose:** Bukti suara masuk + privasi via auto-reset.
**UVP Highlight:** 3 detik lalu hilang — antrean cepat, tidak ada sisa sesi.
**Route:** `/kiosk/success` **Access:** Kiosk just-voted guard

**Layout:** Full center: Check circle 96px sky-soft animate, h1 "Terima kasih!", caption "Suara Anda tercatat • 09:12:03", progress bar countdown 3-2-1, small "Menyiapkan bilik untuk pemilih berikutnya...".

**States:** Default success, Counting (bar shrink), Resetting (fade out), Error fallback (jika RPC ambigu → "Cek ke panitia, jangan vote ulang"), Offline queued.
**Skeleton:** N/A — instant, tapi check skeleton pulse 500ms saat verifikasi.
**Empty:** N/A.
**Error Detail:** Jika `has_voted` true tapi visits success tanpa tx id → tampilkan warning amber + tombol [Lapor Panitia]; network drop after submit → tampilkan pending + auto-cek status.
**Data:** created_at Timestamp "12 Okt 2026 09:12" ; voter anon "B***i" masked; countdown Integer 3→0.
**Micro:** Check drawSVG 400ms ease-out, confetti subtle 600ms (reduced-motion off), progress linear 3s, auto fade-slide 300ms to /vote.
**Accessibility:** aria-live assertive "Suara berhasil direkam", no focusable selain hidden, warna + ikon (tidak hanya warna).
**Responsive:** Sama semua ukuran, center, font scale down mobile 28px h1.

### Screen 05: Bilik Terkunci — `/kiosk/locked`

**Purpose:** Saat election Pause/Stop, kunci bilik otomatis.
**Route:** `/kiosk/locked` **Access:** Public kiosk

Layout center lock icon 72px slate, h1 "Bilik Istirahat / Pemilihan Selesai", desc dinamis Pause ("Jeda — tunggu instruksi panitia") vs Stop ("Pemilihan ditutup — terima kasih"), status election chip, tombol [Muat Ulang Status] ghost + auto-poll 10s.

States: Paused amber, Stopped slate/red, Reconnecting loading, Online-Resume success auto-redirect /vote.
Skeleton: lock pulse + status bar shimmer.
Error: offline → tetap locked + info offline.
Data: election_status Enum start/pause/stop dari tabel settings/channel broadcast.
Micro: auto-poll fade, resume slide.
A11y: aria-live status, high contrast.
Responsive: center all.

### Screen 06: Login Admin — `/admin/login`

**Purpose:** Masuk command center.
**Route:** `/admin/login` **Access:** Public, redirect if authed.

Layout split: kiri branding dark slate-950 (logo, stats "1200 DPT • Live"), kanan form email+password + [Masuk Dashboard].

States: default/typing/loading/error/locked-after-5-fail.
Skeleton: form shimmer.
Error: 401 inline, 429 throttled, offline banner.
Data: email Email format, password min 8.
Micro: focus ring sky, button loading.
A11y: autocomplete, aria-invalid, show password toggle.
Responsive: mobile single col, desktop split 50/50.

### Screen 07: Live Dashboard — `/admin/dashboard`

**Purpose:** Command center real-time.
**UVP Highlight:** Layar yang diproyeksikan ke aula — angka besar, grafik live.
**Route:** `/admin/dashboard` **Access:** Admin auth

**Layout:**
```
┌────────────────────────────────────┐
│ Topbar: Logo | ElectionControl     │
│ [Start][Pause][Stop] | Admin avatar│
├────────┬───────────────┬───────────┤
│Sidebar │ StatRow x4    │ Bilik     │
│Dash    │ BarChart live │ Live list │
│Kiosk   │ Donut + Feed  │ dots      │
│DPT     │               │           │
│Kandidat│               │           │
│Laporan │               │           │
└────────┴───────────────┴───────────┘
```

**Components:** StatCard (Total DPT, Sudah, Belum, Partisipasi %), BarChart Recharts, DonutChart, LiveFeed, KioskStatusList, ElectionControl.

**States:** Live default (pulse green dot + "LIVE"), Connecting (skeleton charts), EmptyVotes (donut gray + "Belum ada suara"), Reconnecting (amber banner), Error (red card + Retry subscribe).
**Skeleton:** 4 stat rects 160x90 shimmer dark, bar 600x300 shimmer, donut circle shimmer.
**Empty:** Ilustrasi chart, Title "Belum ada suara masuk", Desc "Suara akan muncul otomatis di sini.", CTA [Lihat DPT].
**Error Detail:** Realtime disconnect → auto-retry 5s + toast; API 500 → cached last + Retry; 404 feed → hide; validation N/A.
**Data Format:** vote_count Integer locale `1.234`; partisipasi Percent `62,5%` 1 desimal; created_at Relative "2 mnt lalu" + absolute tooltip; kiosk last_ping Relative + Live <60s green / Offline gray; candidate warna fixed sky/amber/sky.
**Micro:** Number count-up 500ms on update; bar animate 400ms; donut tween 500ms; feed slide-in top 300ms; Live dot pulse 2s loop.
**Interactions:** Hover chart → tooltip; click kandidat bar → filter feed; ElectionControl → confirm dialog; bell → feed drawer.
**Accessibility:** Chart aria-label + tabel alternatif sr-only, keyboard tab chart legend, kontras text dark 12:1, live region polite untuk update (throttled 5s agar tidak spam SR).
**Responsive:** Mobile stats 2x2 grid, chart stack, sidebar drawer; tablet 2 col; desktop 4 stats + 2 col chart + right rail 320px.

### Screen 08: Kiosk Management — `/admin/kiosks`

**Purpose:** CRUD bilik + pantau Live/Offline.
**Route:** `/admin/kiosks` **Access:** Admin

Layout: header + [Tambah Bilik], grid cards bilik (nama, username mono, pass masked + copy, toggle is_active, last_ping, Live dot), dialog tambah (nama auto-generate user/pass + [Salin]).

States: default grid, empty (no kiosk), loading skeleton 3 cards, error load, toggling loading per-card, copied success toast.
Skeleton: 3 rects 300x180 shimmer dark.
Empty: ilustrasi monitor, Title "Belum ada bilik", Desc "Tambah bilik pertama untuk memulai.", CTA [Tambah Bilik].
Error: create fail → inline dialog error + retry; offline → disable toggle.
Data: kiosk_name Text "Bilik Lab 1"; username Slug unique; password_hash Hidden, plain shown once on create; is_active Boolean switch; last_ping Timestamp.
Micro: toggle slide 200ms, copy check 1.5s, card hover border sky 200ms, dialog scale 250ms.
A11y: switch role, copy aria-label, focus trap dialog.
Responsive: mobile 1 col, tablet 2 col, desktop 3 col.

### Screen 09: Voter Management (DPT) — `/admin/voters`

**Purpose:** Import + filter Sudah/Belum.
**Route:** `/admin/voters` **Access:** Admin

Layout: header stats mini + [Import CSV] + [Export] + search NISN + filter tabs Semua/Sudah/Belum/Siswa/Guru + DataTable (Nama, NISN mono, Tipe badge, Dept, Status badge, Aksi) + pagination.

States: default table, empty search ("Tidak ditemukan untuk '0061'"), empty DPT (belum import), importing progress bar %, import error row list, loading skeleton rows.
Skeleton: 8 row rects full-width shimmer.
Empty: ilustrasi tabel, Title "DPT kosong", Desc "Import Excel/CSV dengan kolom NISN,Nama,Kelas.", CTA [Download Template] + [Import].
Error: CSV kolom salah → dialog error list baris; duplicate NISN → highlight kuning + skip; API fail → retry; offline → block import.
Data: voter_id_number Unique numeric; name Title case; department "XII RPL 1"; has_voted Badge green Sudah / gray Belum; voter_type Badge sky siswa / sky guru.
Micro: row hover bg 150ms, tab underline slide 200ms, import progress linear, toast slide top 300ms.
A11y: table semantic th scope, search label, pagination aria, focus sort header.
Responsive: mobile table → cards + horizontal scroll sticky first col; desktop full table.

### Screen 10: Candidate Management — `/admin/candidates`

**Purpose:** CRUD paslon + foto.
**Route:** `/admin/candidates` **Access:** Admin

Layout: grid kandidat cards (foto 16:9, No chip amber, nama, visi truncated, vote_count hidden/live toggle, Edit/Hapus) + [Tambah Kandidat] + dialog form (No, Nama, Visi rich textarea, Foto upload drag-drop preview).

States: default, empty no candidate, uploading progress %, delete confirm, loading skeleton, validation error inline.
Skeleton: 3 cards image shimmer.
Empty: ilustrasi kandidat, Title "Belum ada paslon", Desc "Tambahkan minimal 2 kandidat.", CTA [Tambah].
Error: upload >2MB → compress hint; Storage fail → retry; duplicate No → inline red; delete voted → block warning "Sudah ada X suara, yakin?".
Data: candidate_number Integer unique 1..n; name Text; vision_mission Text max 2000 char; photo_url URL Supabase Storage `candidates/xxx.jpg` 800x600; vote_count Integer read-only.
Micro: drag-over border sky 200ms, preview fade 250ms, delete shake confirm.
A11y: file input label, alt preview, dialog focus trap, delete aria-danger.
Responsive: mobile 1 col, tablet 2 col, desktop 3 col + dialog 560px.

### Screen 11: Laporan & Berita Acara — `/admin/reports`

**Purpose:** Cetak sah + rekap.
**Route:** `/admin/reports` **Access:** Admin

Layout: summary cards (pemenang highlight sky border, total, partisipasi), tabel rekap per kandidat (% + bar mini), tombol [Cetak Berita Acara PDF] primary, [Export DPT Excel] secondary, [Export Hasil CSV] ghost, preview kop surat.

States: default ready, generating PDF loading, empty votes (disable cetak), error generate, success downloaded toast.
Skeleton: summary + table shimmer.
Empty: Title "Belum bisa cetak", Desc "Minimal 1 suara masuk untuk berita acara.", CTA disabled.
Error: PDF lib fail → retry; no data → info; offline → disable.
Data: PDF A4 kop "SMK Muhammadiyah Kandanghaur + IPM", tabel No,Nama,Suara,Persen; tanda tangan Ketua Panitia + Saksi; timestamp + hash `SHA-xxx` mono; Excel kolom NISN,Nama,Kelas,Status,Waktu.
Micro: generate progress 1-2s, download bounce 300ms, preview zoom 200ms.
A11y: print stylesheet, heading hierarchy, button labels jelas.
Responsive: mobile stack + preview scroll; desktop 2 col (preview + actions).

### Screen 12: System — 404 / Offline

404: ilustrasi 404, Title "Halaman tidak ditemukan", Desc + [Kembali ke Bilik/Dashboard]. Offline kiosk: ilustrasi wifi-off, Title "Koneksi terputus", auto-retry saat online + queue info. Data N/A. Micro fade. A11y live. Responsive center.

---

## BAGIAN 4: Component Specs

### Component: Button (Kiosk Big + Admin)

**Usage:** Semua screen. Category: Atom.

**Variants:**
| Variant | Visual | When to use |
|---------|--------|-------------|
| Primary | sky-600 bg white text radius-md lg padding 16/24 | CTA utama Pilih/Kirim/Masuk |
| Secondary | slate-700 bg / slate-800 dark white text | Aksi pendamping |
| Accent | amber-400 bg slate-900 text | Nomor/pemenang highlight |
| Ghost | transparent border slate-200 / slate-700 dark | Batal/Kembali |
| Danger | red-600 bg white text | Stop/Hapus |
| MonoLink | underline sky-600 | Lihat visi, template CSV |

**States:** Default, Hover (+darken 10% + shadow-sm 200ms), Active scale .96, Disabled opacity 50% cursor-not-allowed, Loading spinner + "Memproses...".

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `primary\|secondary\|accent\|ghost\|danger` | `primary` | Visual |
| `size` | `sm\|md\|lg\|xl-kiosk` | `md` | xl-kiosk = 20px font 24px padding |
| `loading` | `boolean` | `false` | Spinner |
| `disabled` | `boolean` | `false` | Disable |
| `onClick` | `function` | `-` | Handler |

**Accessibility:** role button, focus-visible ring 2px sky offset 2px, Enter/Space, min 44px (48px kiosk), aria-busy saat loading.

### Component: GiantInput (NISN/NIP)

**Usage:** `/kiosk/vote`, `/kiosk/login` username. Molecule.
**Variants:** Default outline, Focused ring sky, Error red border + pesan, Success sky border + check, Disabled gray.
**States:** default/hover/focus/typing/disabled/loading/error.
**Props:** `value,string`, `onChange,fn`, `error,string|null`, `mono,boolean=true`, `size,lg|xl`, `maxLength,number`.
**A11y:** label associated, aria-invalid, aria-describedby helper, numeric inputmode.

### Component: CandidateCard

**Usage:** `/kiosk/ballot`, `/admin/candidates` (read-only variant). Organism.
**Variants:** Default (foto+nama+visi collapsed), Selected (ring-4 sky + check badge), Compact (admin list: thumb 80px + meta), Winner ((sky) border + trophy accent di reports).
**States:** default/hover lift/selected/disabled (locked)/loading skeleton/error image fallback initial.
**Props:** `candidate,{no,name,vision,photo}`, `selected,boolean`, `onSelect,fn`, `showVotes,boolean=false (kiosk false, admin true)`, `expandable,boolean`.
**A11y:** role radio, aria-checked, alt foto, keyboard arrows.

### Component: Dialog (Identity + Confirm + Form)

**Usage:** Identity check, konfirmasi vote, tambah bilik/kandidat, election control confirm. Molecule.
**Variants:** Info (slate icon), Confirm ((sky)), Warning (amber Pause), Danger (red Stop/Hapus).
**States:** closed/opening (fade+scale 250ms)/open/closing (200ms)/loading-action.
**Props:** `open,boolean`, `title,string`, `description,string`, `actions,ReactNode`, `variant`, `onClose,fn`.
**A11y:** role dialog aria-modal, focus trap, Esc close (kecuali submitting), labelledby/describedby.

### Component: StatCard + Chart (Admin)

**Usage:** `/admin/dashboard`, `/admin/reports`. Organism.
**Variants:** Count (angka besar mono + delta), Percent (progress ring), Bar (Recharts), Donut.
**States:** loading skeleton, empty no-data gray, live updating, error cached, hover tooltip.
**Props:** `title,string`, `value,number|string`, `delta,string`, `live,boolean`, `data,array`, `onRetry,fn`.
**A11y:** aria-label ringkasan, tabel sr-only alternatif chart, live polite throttled.

### Component: DataTable (DPT)

**Usage:** `/admin/voters`, `/admin/kiosks` (variant). Organism.
**Variants:** Default paginated, Compact (kiosk list), Filterable (tabs+search), Selectable (checkbox bulk).
**States:** loading skeleton rows, empty search, empty dataset, error + retry, row-updating spinner.
**Props:** `columns,array`, `rows,array`, `page,size`, `onSearch,fn`, `filter,enum`, `onImport,fn`.
**A11y:** table semantics, sortable th aria-sort, pagination nav aria-label.

### Component: Badge/Status (Kiosk Live, Sudah/Belum, Tipe)

**Usage:** Semua admin + kiosk header. Atom.
**Variants:** Live sky dot pulse, Offline gray, Paused amber, Siswa sky-soft, Guru sky-soft, Sudah sky, Belum gray, Nomor amber-full circle.
**States:** default/dot-pulse/static/disabled.
**Props:** `tone,sky|amber|gray|sky|red`, `pulse,boolean`, `icon,optional`.
**A11y:** color + text/icon (tidak hanya warna), aria-label status.

### Component: KioskHeader + ElectionControl

**Usage:** Header kiosk + topbar admin. Molecule.
**Variants:** Kiosk (Bilik name + Live dot + jam), Admin (breadcrumb + control + avatar).
**States:** live/pause overlay/stop locked/reconnecting.
**Props:** `kioskName,string`, `status,live|offline`, `election,start|pause|stop`, `onStart/onPause/onStop,fn`.
**A11y:** status aria-live, confirm dialog untuk Stop, keyboard shortcut admin `Ctrl+E` cycle (dengan confirm).

---

## Validasi Checklist (pre-review)
- [x] Semua screen Bagian 2 ada di Bagian 3 (12/12)
- [x] Setiap screen pakai token Bagian 1
- [x] Setiap component ≥3 variants
- [x] Setiap screen ≥5 states
- [x] A11y + responsive tiap screen
- [x] Skeleton + error detail + data format + micro-interactions tiap screen
- [x] Dark tokens lengkap (admin)
- [x] IA/sitemap depth konsisten
