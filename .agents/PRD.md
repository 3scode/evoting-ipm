# PRD.md — E-Voting IPM SMK Muhammadiyah Kandanghaur

> Versi: 1.0 | Tanggal: 2026-10-14
> Acuan: `.agents/DESIGN.md` (12 screens, Web Modern & Clean, Kiosk Light + Admin Dark)
> Tech: Next.js 16 App Router, Supabase Postgres + Realtime + Storage, Tailwind + shadcn/ui, Recharts
> Organisasi: SMK Muhammadiyah Kandanghaur — Pemilihan Ketua IPM, Bilik Suara Terpusat (Kiosk Mode)

## BAGIAN 1: Visi & Tujuan Produk

### Visi Produk
Menjadikan pemilihan Ketua IPM SMK Muhammadiyah Kandanghaur sebagai teladan demokrasi pelajar yang jujur, cepat, dan transparan: tanpa kertas, tanpa antre lama, tanpa sengketa — satu bilik, satu NISN/NIP, satu suara sah, hasil live dapat diproyeksikan ke aula.

### Tujuan Utama

1. Eliminasi double-vote dan salah identitas — Indikator: 0 suara ganda terdeteksi di audit `votes` vs `voters.has_voted`.
2. Waktu mencoblos <90 detik per pemilih per bilik — Indikator: median durasi input NISN → sukses tercatat.
3. Rekap real-time tanpa hitung manual — Indikator: dashboard update <1 detik setelah RPC vote, tanpa refresh.
4. Operasional bilik oleh panitia non-teknis — Indikator: login bilik + reset antrean tanpa panggil admin.
5. Berita acara sah siap cetak hari-H — Indikator: PDF + rekap Excel ter-generate <10 detik setelah Stop.

### Value Proposition

- Bilik Aman Tanpa HP: device panitia, kiosk isolation, auto-reset 3 detik jaga privasi.
- Validasi Dinamis Anti-Salah Orang: NISN tampilkan Nama+Kelas, NIP/NBM tampilkan Nama+Jabatan, konfirmasi Ya/Bukan.
- Command Center Live: Bar/Donut Realtime + status bilik Live/Offline + Start/Pause/Stop kunci semua bilik seketika + transaksi RPC atomik.

### Analisis Kompetitor

| Kompetitor | Fitur Utama | Kelebihan | Kekurangan | Peluang |
|------------|-------------|-----------|------------|---------|
| E-voting IPM SMAMDA / Mu'allimaat / Spemutu | Kode/QR + HP pribadi | Murah, familiar siswa | Rawan pinjam akun, tidak ada monitoring bilik, tergantung HP siswa | Kiosk terpusat + pantau bilik live |
| SaaS Survey & Ballot Systems | Dashboard live, weighted vote | Live kuat, audit log | Tidak paham DPT sekolah (NISN/Kelas), mahal, overkill | DPT NISN/NIP + import CSV sekolah + gratis infra Supabase |
| E-voting OSIS open-source kampus | Kripto / QR verification | Keamanan tinggi | UX rumit, setup server berat, tanpa kiosk flow | UX 1-input besar + shadcn + Server Actions sederhana |
| Manual kertas | Coblos kertas + hitung papan | Tidak butuh listrik/internet | Lambat, kertas rusak, sengketa sah/tidak sah | Digital RPC + bukti timestamp + berita acara otomatis |

### Success Metrics

| Tujuan | KPI | Target | Cara Ukur |
|--------|-----|--------|-----------|
| Integritas | Double-vote rate | 0% | Query `votes` group by `voter_id` having count>1 + audit `has_voted` |
| Kecepatan bilik | Median vote duration | <90 detik | Log `created_at` ballot open → success, Supabase + Vercel Analytics |
| Realtime | P95 dashboard lag | <1000ms | Uji subscribe channel `votes/candidates/kiosks`,ukur write→render |
| Usability panitia | Bilik setup time | <2 menit/bilik | Waktu login kiosk → standby, observasi H-1 |
| Partisipasi | Turnout | >90% DPT | `count(has_voted=true)/count(*)` di `/admin/dashboard` |
| Kepercayaan | Sengketa | 0 sengketa suara sah | Berita acara ditandatangani tanpa keberatan |

## BAGIAN 2: User Persona

### Persona 1: Nabila — Pemilih Siswa

- **Usia/Pekerjaan:** 16 tahun, Pelajar kelas XI RPL 1
- **Level Teknis:** Menengah (terbiasa HP, jarang pakai laptop ujian)
- **Tujuan:** Mencoblos cepat di sela istirahat, pastikan suaranya masuk, tidak malu salah pencet.
- **Pain Points:** Takut salah pilih orang yang namanya mirip, takut data NISN disalahgunakan, antre lama, tulisan visi kecil.
- **Motivasi:** Ikut menentukan ketua IPM, ingin bukti jelas suaranya tercatat.

#### User Journey: Nabila

| Stage | Action | Touchpoints | Emotions | Pain Points |
|-------|--------|-------------|----------|-------------|
| 1. Antre | Lihat layar standby besar "Masukkan NISN" | Screen Standby Input `/kiosk/vote`, GiantInput 36px mono | Netral, sedikit tegang | Takut salah ketik NISN 10 digit |
| 2. Verifikasi | Ketik NISN, tap Cek, lihat pop-up Nama+Kelas | IdentityModal, tombol Ya/Bukan | Lega saat nama benar | Nama mirip, harus teliti |
| 3. Pilih | Baca kartu kandidat, expand visi, tap satu | Surat Suara `/kiosk/ballot`, CandidateCard, VisiAccordion | Antusias, ragu | Foto kecil / visi panjang |
| 4. Konfirmasi | Baca modal "Yakin No.2?" tap Ya Kirim | ConfirmDialog, overlay Merekam | Tegang sesaat | Takut double-tap kirim dua kali |
| 5. Selesai | Lihat check hijau + countdown 3s, tinggalkan bilik | Sukses `/kiosk/success` auto-reset | Puas | Ingin bukti foto (tidak boleh demi privasi) |

### Persona 2: Pak Andi — Panitia Inti / Admin Command Center

- **Usia/Pekerjaan:** 28 tahun, Guru Pembina IPM + admin IT dadakan
- **Level Teknis:** Mahir dasar (bisa Excel, pernah pakai Supabase dashboard)
- **Tujuan:** Pastikan semua bilik online, DPT bersih, hasil live akurat, cetak berita acara tanpa begadang rekap.
- **Pain Points:** DPT berantakan (NISN duplikat, nama beda ejaan), bilik offline tidak ketahuan, takut ada yang vote dua kali saat WiFi putus, dituntut cepat cetak laporan.
- **Motivasi:** Pemilihan legitimate, tidak ada protes, dipertanggungjawabkan ke kepala sekolah.

#### User Journey: Pak Andi

| Stage | Action | Touchpoints | Emotions | Pain Points |
|-------|--------|-------------|----------|-------------|
| 1. Setup H-1 | Import CSV DPT, tambah 3 bilik auto-generate pass, input 3 paslon + foto | `/admin/voters` import, `/admin/kiosks` tambah, `/admin/candidates` upload Storage | Sibuk, waspada | CSV kolom tidak standar, foto >2MB |
| 2. Start H | Login dashboard, tap Start, cek semua bilik Live | `/admin/dashboard`, ElectionControl Start, KioskStatusList last_ping | Tegang, fokus | Satu bilik Offline karena WiFi lab |
| 3. Monitor | Pantau Bar/Donut naik, feed 5 suara terakhir, cek partisipasi % | StatCard, BarChart, Donut, LiveFeed Realtime | Senang saat turnout naik | Realtime disconnect sesaat |
| 4. Intervensi | Pause 10 menit istirahat (bilik auto-lock), resume Start | `/kiosk/locked` auto, ElectionControl Pause/Start confirm | Tenang terkendali | Siswa panik dikira error |
| 5. Tutup | Tap Stop (semua bilik lock), cetak Berita Acara PDF + export Excel | `/admin/reports`, PDF kop sekolah + tanda tangan | Lega | Butuh tanda tangan saksi cepat |

## BAGIAN 3: User Stories

### Modul Kiosk (Bilik Suara)

### US-01: Login Bilik Pagi Hari
Sebagai panitia bilik, saya ingin login dengan kredensial bilik, agar device masuk Kiosk Mode terkunci.
**Priority:** High
**Screen:** Login Bilik `/kiosk/login`
**Acceptance Criteria:**
- [ ] Form username + password (show/hide) tersedia, font mono
- [ ] Gagal 401 tampil inline merah + shake, tidak bocorkan mana yang salah
- [ ] Sukses redirect `/kiosk/vote`, update `kiosks.last_ping`, `is_active=true`
- [ ] Jika election=stop, redirect `/kiosk/locked`
- [ ] Back/browser URL lain diblok selama sesi kiosk

### US-02: Input Universal NISN/NIP
Sebagai pemilih, saya ingin memasukkan NISN/NIP di satu field besar, agar tidak bingung pilih tipe siswa/guru.
**Priority:** High
**Screen:** Standby Input `/kiosk/vote`
**Acceptance Criteria:**
- [ ] Input 36px mono center + NumPad tablet + keyboard fisik support
- [ ] Validasi lokal 8-18 digit numerik sebelum hit API
- [ ] Enter / tombol Cek memicu lookup `voters.voter_id_number`
- [ ] Loading state disable input + spinner
- [ ] Offline tampil banner amber, cegah submit buta

### US-03: Konfirmasi Identitas Dinamis
Sebagai pemilih, saya ingin melihat Nama+Kelas/Jabatan sebelum lanjut, agar anti salah orang.
**Priority:** High
**Screen:** Standby Input `/kiosk/vote` + IdentityModal
**Acceptance Criteria:**
- [ ] Jika siswa tampil Nama+Kelas, jika guru tampil Nama+Jabatan/Mapel + chip tipe
- [ ] Tombol Ya Lanjutkan emerald dan Bukan Kembali ghost jelas
- [ ] Jika `has_voted=true` tampil penolakan merah + info sudah memilih, tidak bisa lanjut
- [ ] Jika NISN tidak ditemukan tampil arahan hubungi panitia DPT
- [ ] Esc / Bukan menutup + fokus kembali ke input

### US-04: Surat Suara Digital
Sebagai pemilih, saya ingin melihat foto, nomor, nama, visi-misi yang bisa di-expand, agar pilihan informed.
**Priority:** High
**Screen:** Surat Suara `/kiosk/ballot`
**Acceptance Criteria:**
- [ ] Kartu 4:3 foto lazy + fallback initial, nomor chip amber, nama 24px Display
- [ ] Visi collapsed 300 char + Lihat Visi expand tanpa pindah route
- [ ] Hanya 1 kandidat bisa selected (radiogroup), CTA disabled sampai pilih
- [ ] `vote_count` disembunyikan di kiosk jaga netralitas
- [ ] Guard: tanpa voter verified tidak bisa akses langsung via URL

### US-05: Konfirmasi & Kirim Suara Atomik
Sebagai pemilih, saya ingin konfirmasi final sebelum suara direkam, agar tidak ada penyesalan salah tap.
**Priority:** High
**Screen:** Surat Suara `/kiosk/ballot` + ConfirmDialog
**Acceptance Criteria:**
- [ ] Modal "Yakin No.X Nama? Tidak dapat diubah" Ya Kirim / Cek Lagi
- [ ] Double-submit dicegah (disable + idempotency `voter_id` unique)
- [ ] RPC atomik INSERT votes + UPDATE candidates.vote_count + UPDATE voters.has_voted dalam satu transaksi
- [ ] Gagal tampil toast retry tanpa hilangkan pilihan
- [ ] Sukses redirect `/kiosk/success` dengan tx timestamp

### US-06: Sukses + Auto-Reset 3 Detik
Sebagai pemilih berikutnya, saya ingin bilik otomatis bersih setelah 3 detik, agar privasi terjaga dan antre cepat.
**Priority:** High
**Screen:** Sukses `/kiosk/success`
**Acceptance Criteria:**
- [ ] Check hijau animasi + "Terima kasih, suara tercatat" + waktu
- [ ] Countdown bar 3-2-1 visible, lalu auto redirect `/kiosk/vote` + clear state
- [ ] Tidak ada nama lengkap pemilih sebelumnya tersisa (mask `B***i`)
- [ ] aria-live assertive umumkan sukses untuk SR
- [ ] Jika RPC ambigu tampil warning jangan vote ulang + tombol Lapor Panitia

### US-07: Bilik Terkunci Otomatis
Sebagai panitia, saya ingin bilik terkunci saat Pause/Stop, agar tidak ada suara liar.
**Priority:** High
**Screen:** Bilik Terkunci `/kiosk/locked`
**Acceptance Criteria:**
- [ ] Pause tampil amber "Jeda", Stop tampil "Ditutup" + chip status
- [ ] Auto-poll status 10 detik + tombol Muat Ulang
- [ ] Saat resume Start auto redirect `/kiosk/vote`
- [ ] Offline tetap tampil locked + info offline

### Modul Admin (Command Center)

### US-08: Login Admin
Sebagai admin, saya ingin login email+password aman, agar hanya panitia inti akses data.
**Priority:** High
**Screen:** Login Admin `/admin/login`
**Acceptance Criteria:**
- [ ] Validasi email format, password min 8, show toggle
- [ ] 5x gagal throttled, pesan tidak bocorkan user enum
- [ ] Sukses redirect `/admin/dashboard` via Supabase Auth session
- [ ] Split branding dark informatif di desktop

### US-09: Live Analytics Tanpa Refresh
Sebagai admin, saya ingin lihat total, partisipasi %, Bar/Donut, feed live, agar bisa proyeksikan ke aula.
**Priority:** High
**Screen:** Live Dashboard `/admin/dashboard`
**Acceptance Criteria:**
- [ ] Subscribe `votes`, `candidates`, `kiosks` Realtime, update <1s tanpa refresh
- [ ] Stat DPT/Sudah/Belum/Partisipasi count-up animasi
- [ ] Hover tooltip + tabel sr-only alternatif chart untuk SR
- [ ] Disconnect tampil banner amber + auto-retry 5s dengan cache terakhir
- [ ] Empty votes tampil netral "Belum ada suara" bukan chart kosong membingungkan

### US-10: Election Control Start/Pause/Stop
Sebagai admin, saya ingin Start/Pause/Stop satu tombol mengunci semua bilik, agar kontrol terpusat.
**Priority:** High
**Screen:** Live Dashboard `/admin/dashboard` + ElectionControl
**Acceptance Criteria:**
- [ ] Tiga tombol dengan confirm dialog, Stop butuh ketik konfirmasi / double confirm
- [ ] Broadcast ke semua kiosk <2s, kiosk redirect `/kiosk/locked`
- [ ] Audit log siapa + kapan ubah status
- [ ] Tombol Stop danger, Pause amber, Start emerald konsisten

### US-11: Kelola Bilik + Status Live/Offline
Sebagai admin, saya ingin tambah/hapus bilik + lihat Live/Offline, agar tahu bilik mana bermasalah.
**Priority:** High
**Screen:** Kiosk Management `/admin/kiosks`
**Acceptance Criteria:**
- [ ] Tambah dialog nama + auto-generate user/pass, plain pass ditampilkan sekali + tombol Salin
- [ ] Toggle `is_active`, Live jika `last_ping`<60s hijau pulse else gray
- [ ] Copy kredensial tampil toast sukses 1.5s
- [ ] Hapus bilik yang sudah dipakai vote diblok/dikonfirmasi

### US-12: Kelola DPT + Import CSV
Sebagai admin, saya ingin import Excel/CSV + filter Sudah/Belum/Siswa/Guru, agar DPT bersih cepat.
**Priority:** High
**Screen:** Voter Management `/admin/voters`
**Acceptance Criteria:**
- [ ] Template CSV tersedia (NISN,Nama,Kelas/Tipe), validasi kolom, tampilkan baris error
- [ ] Duplikat NISN di-skip + highlight kuning, tidak duplikat insert
- [ ] Search NISN + tabs filter + pagination 50/row
- [ ] Export hasil filter ke CSV
- [ ] Progress % saat import 1000+ baris tanpa freeze UI

### US-13: Kelola Kandidat + Foto
Sebagai admin, saya ingin CRUD paslon + upload foto, agar surat suara tampil resmi.
**Priority:** Mid
**Screen:** Candidate Management `/admin/candidates`
**Acceptance Criteria:**
- [ ] Form No unik, Nama, Visi max 2000 char, drag-drop foto preview
- [ ] Upload ke Supabase Storage `candidates/`, tolak >2MB dengan hint kompres
- [ ] Hapus paslon yang sudah ada suara butuh warning + ketik nama
- [ ] `vote_count` read-only, tidak bisa edit manual

### US-14: Laporan Berita Acara + Export
Sebagai admin, saya ingin cetak Berita Acara PDF + rekap Excel, agar sah ditandatangani.
**Priority:** High
**Screen:** Laporan `/admin/reports`
**Acceptance Criteria:**
- [ ] PDF A4 kop SMK Muhammadiyah Kandanghaur + IPM, tabel No/Nama/Suara/Persen, pemenang highlight, timestamp + hash mono, kolom tanda tangan
- [ ] Tombol disabled jika 0 suara dengan penjelasan
- [ ] Export DPT (NISN,Nama,Kelas,Status,Waktu) + Hasil (per kandidat) CSV/Excel
- [ ] Generate <10 detik untuk 2000 DPT, tampil progress

### US-15: Akses Offline & 404 Aman
Sebagai panitia bilik, saya ingin info jelas saat offline / salah URL, agar tidak panik.
**Priority:** Mid
**Screen:** System `/offline`, `/404`
**Acceptance Criteria:**
- [ ] Offline tampil wifi-off + auto-retry saat online, vote tidak hilang diam-diam
- [ ] 404 ada tombol kembali kontekstual (Bilik vs Dashboard)
- [ ] Semua pesan bahasa Indonesia sederhana

## BAGIAN 4: Functional Requirements

**FR-01: Auth Sesi Kiosk** — **Must Have** — **M**
- Input: `username` slug, `password` plaintext
- Proses: Verifikasi `kiosks` via Server Action (bcrypt compare), buat httpOnly session cookie device, update `last_ping`
- Output: Session kiosk + redirect `/kiosk/vote` atau `/kiosk/locked`
- Aturan: Password tidak disimpan di client; 5x gagal lock 5 menit per device; logout hanya oleh admin/Stop

**FR-02: Lookup Voter Universal** — **Must Have** — **M**
- Input: `voter_id_number` 8-18 digit
- Proses: `SELECT id,name,department,voter_type,has_voted FROM voters WHERE voter_id_number=?` via Server Action
- Output: Objek identitas + flag `has_voted` atau `NOT_FOUND`
- Aturan: Trim + numeric only; rate-limit 10 req/menit per kiosk cegah brute-force enumeration; jangan bedakan pesan timing untuk enum

**FR-03: Guard Voter Verified** — **Must Have** — **S**
- Input: Server session voter verified + `has_voted=false`
- Proses: Middleware check sebelum render `/kiosk/ballot`
- Output: Allow atau redirect `/kiosk/vote` + pesan
- Aturan: Direct URL tanpa verifikasi ditolak; verified TTL 5 menit

**FR-04: Tampil Surat Suara** — **Must Have** — **M**
- Input: `election_status=start`
- Proses: `SELECT id,candidate_number,name,vision_mission,photo_url FROM candidates ORDER BY candidate_number`
- Output: Daftar CandidateCard tanpa `vote_count`
- Aturan: Jika 0 kandidat tampil empty + blokir pilih; foto fallback initial

**FR-05: Submit Vote Transaksional (RPC)** — **Must Have** — **L**
- Input: `voter_id`, `candidate_id`, `kiosk_id`
- Proses: Postgres function `cast_vote(voter_id,candidate_id)`: cek `has_voted=false` + election=start + lock row `SELECT ... FOR UPDATE`, lalu INSERT votes, UPDATE candidates.vote_count+1, UPDATE voters.has_voted=true + `voted_at`
- Output: `{success, vote_id, created_at}` atau error `ALREADY_VOTED` / `ELECTION_CLOSED`
- Aturan: Unique constraint `votes.voter_id`; RLS votes hanya insert via definer function; idempotent retry aman; P95 <800ms

**FR-06: Auto-Reset Bilik** — **Must Have** — **S**
- Input: `vote_id` sukses
- Proses: Tampilkan `/kiosk/success` 3s, clear voter session + form state, prefetch `/kiosk/vote`
- Output: Bilik siap pemilih berikutnya
- Aturan: Tidak simpan PII di localStorage; mask nama; hormati reduced-motion

**FR-07: Election Control Broadcast** — **Must Have** — **M**
- Input: Admin aksi `start|pause|stop` + confirm
- Proses: Update `election_settings.status` + Broadcast channel `election` + audit log
- Output: Semua kiosk terima event <2s dan redirect sesuai status
- Aturan: Stop irreversible tanpa super-admin; Pause tampilkan pesan istirahat; semua transisi tercatat aktor+waktu

**FR-08: Heartbeat Kiosk** — **Must Have** — **S**
- Input: Ping tiap 20s dari kiosk aktif
- Proses: Update `kiosks.last_ping=now()`, publish presence
- Output: Status Live (<60s) / Offline di dashboard
- Aturan: Kiosk `is_active=false` diabaikan; clock skew toleransi 10s

**FR-09: Auth Admin Supabase** — **Must Have** — **S**
- Input: Email + password admin
- Proses: Supabase Auth signIn, role check `admin|panitia`, set session
- Output: Akses `/admin/*`
- Aturan: HTTPS wajib; session expiry 12 jam; 5x gagal throttle; password bcrypt + tidak log plaintext

**FR-10: Dashboard Realtime Subscribe** — **Must Have** — **L**
- Input: Channel `votes INSERT`, `candidates UPDATE`, `kiosks UPDATE`
- Proses: Subscribe + agregasi client (`total`, `sudah`, `partisipasi`, per-kandidat) + throttle render 500ms
- Output: Stat + Bar + Donut + feed 5 terakhir live
- Aturan: Fallback polling 5s jika WS gagal; data terakhir di-cache; SR update di-throttle 5s

**FR-11: CRUD Kiosk + Generate Kredensial** — **Must Have** — **M**
- Input: `kiosk_name` misal Bilik Lab 1
- Proses: Generate `username` slug unik + `password` 12 char aman, hash bcrypt simpan, tampilkan sekali
- Output: Kartu bilik + kredensial siap salin
- Aturan: Username unique; password min 12 campur; hapus butuh confirm jika pernah dipakai

**FR-12: Import DPT CSV/Excel** — **Must Have** — **L**
- Input: File .csv/.xlsx max 5MB, kolom NISN,Nama,Kelas/Tipe/Jabatan
- Proses: Parse client (PapaParse/SheetJS) → validasi → upsert batch 200/req via Server Action, skip duplikat
- Output: Ringkasan sukses/gagal + daftar baris error downloadable
- Aturan: `voter_id_number` unique; kosongkan `has_voted=false` default; rollback per-batch jika 50% gagal

**FR-13: Search + Filter DPT** — **Should Have** — **M**
- Input: Query NISN/nama + filter Sudah/Belum/Siswa/Guru
- Proses: Query paginated 50 dengan index `voter_id_number`, `has_voted`
- Output: Tabel + pagination + export filter
- Aturan: P95 search <500ms untuk 5000 DPT; debounce 300ms

**FR-14: CRUD Kandidat + Upload Foto** — **Must Have** — **M**
- Input: `candidate_number` unik, `name`, `vision_mission` HTML aman, file jpg/png/webp max 2MB
- Proses: Validasi + upload Supabase Storage `candidates/` + dapat `photo_url` + insert/update row
- Output: Kartu kandidat tampil di ballot + admin
- Aturan: Sanitize HTML visi (tanpa script); resize 800px sisi panjang; No duplikat ditolak

**FR-15: Laporan PDF Berita Acara** — **Must Have** — **L**
- Input: Snapshot hasil saat Stop (freeze `vote_count`)
- Proses: Generate PDF A4 (kop, tabel, persen, pemenang, hash SHA256 snapshot, tanda tangan) via server (puppeteer/jsPDF)
- Output: File `Berita-Acara-IPM-2026.pdf` + hash tercatat
- Aturan: Tidak bisa generate jika 0 suara; hash untuk verifikasi; print CSS rapi

**FR-16: Export Excel/CSV** — **Should Have** — **M**
- Input: Filter DPT / hasil per kandidat
- Proses: Generate .xlsx/.csv server, streaming untuk 5000 baris
- Output: Download file + toast sukses
- Aturan: Mask NISN? Tidak — full untuk admin, tapi log siapa unduh; max 10k baris/V1

**FR-17: RLS + Audit Log** — **Must Have** — **M**
- Input: Semua write votes/voters/candidates/kiosks
- Proses: Enforce RLS: anon read candidates active only, votes insert via function only, voters update has_voted via function only; tulis `audit_logs`
- Output: Penolakan otomatis jika langgar + log
- Aturan: Service_role hanya di server; tidak expose ke client; audit retensi 1 tahun

**FR-18: Offline & Error Handling Kiosk** — **Should Have** — **M**
- Input: `navigator.onLine`, fetch fail, 404
- Proses: Tampilkan banner/modal sesuai DESIGN error detail, queue tidak kirim diam-diam, auto-retry
- Output: UX jelas + tidak ada suara hilang
- Aturan: Dilarang simpan suara offline lalu kirim belakangan tanpa verifikasi has_voted ulang (cegah ganda)

**FR-19: Aksesibilitas & Responsive** — **Should Have** — **S**
- Input: Semua screen DESIGN
- Proses: Terapkan keyboard nav, ARIA, focus trap dialog, kontras AA, touch 48px kiosk, responsive 360px→1366px
- Output: Lolos cek axe + manual SR
- Aturan: Chart wajib tabel alternatif sr-only; hormati prefers-reduced-motion

**FR-20: Freeze Hasil + Pemenang** — **Could Have** — **S**
- Input: Status Stop
- Proses: Snapshot `results_snapshot` + tentukan peringkat
- Output: Badge Pemenang di reports + dashboard mode read-only
- Aturan: Tidak ubah `vote_count` setelah freeze; sengketa manual via admin log

## BAGIAN 5: Non-Functional Requirements

### Performa
- LCP kiosk `/kiosk/vote` <1.5s di tablet 4GB / WiFi sekolah (20 Mbps), ballot image lazy + next/image.
- RPC `cast_vote` P95 <800ms, dashboard lag write→render P95 <1000ms (Supabase Realtime).
- Support 5 bilik concurrent + 50 viewer dashboard concurrent V1; uji 240 koneksi acuan Supabase Realtime tanpa server WS sendiri.
- Import 2000 DPT <30 detik, export 5000 baris <10 detik, PDF <10 detik.

### Keamanan
- RLS ketat: `votes` insert via `SECURITY DEFINER cast_vote()` only; `voters.has_voted` hanya via function; `candidates.vote_count` read-only client.
- Password kiosk + admin bcrypt (cost 12), session httpOnly Secure SameSite=Lax, CSRF via Server Actions, rate-limit lookup 10/menit + login 5x lock.
- HTTPS wajib (Vercel), header CSP + nosniff, foto visi sanitize (DOMPurify), Storage bucket private dengan signed URL 1 jam.
- Kiosk isolation: tidak ada navigasi selain flow, disable back merusak alur, clear session tiap reset.

### Skalabilitas
- Target V1: 1500 DPT (siswa+guru), 5 bilik, 1 pemilihan/tahun. Arsitektur stateless Next.js + Supabase scale vertical cukup.
- Strategi scale: tambah bilik tanpa code change (tambah row kiosks), Realtime channel per-table, pagination + index `voter_id_number`, `has_voted`, `candidate_number`.
- Batas V1: 10k DPT, 20 bilik. Di atas itu perlu read-replica / edge cache.

### Usability
- Bahasa Indonesia semua pesan, angka locale `id-ID` (`1.234`, `62,5%`), tanggal `12 Okt 2026 09:12`.
- Responsive: bilik prioritas tablet 10" (768-1024), admin desktop 1366, mobile tetap bisa monitor (drawer + stack chart).
- Dark admin + light kiosk sesuai DESIGN, touch kiosk 48px, font input 36px mono, a11y AA.

## BAGIAN 6: Integration Points

| Service | Purpose | Auth Method | Data Flow | SLA / Limits |
|---------|---------|-------------|-----------|--------------|
| Supabase Postgres + Auth + Realtime | DB utama, auth admin, live channel votes/candidates/kiosks/election | Anon key (read terbatas RLS) + Service_role (server only) + JWT admin | Next Server Action → Postgres RPC `cast_vote` → Realtime broadcast → dashboard chart | Free 500MB DB, 200 concurrent Realtime, 99.9% uptime; fallback polling 5s |
| Supabase Storage | Foto kandidat `candidates/` | Signed URL 1 jam via server | Admin upload → Storage → `photo_url` → next/image di ballot | 1GB free, max 2MB/file V1, MIME jpg/png/webp |
| Vercel Hosting + Analytics | Deploy Next.js 16, edge, ukur LCP + duration | Vercel token deploy, Analytics beacon | Git push → build → edge serve + analytics | 100GB bandwidth free, build <2 menit target |
| Recharts (in-app lib) | Bar/Donut live di dashboard | N/A (lib) | Agregasi client → Recharts animate | Render <500ms untuk 5 kandidat, fallback tabel jika gagal |
| PDF/Excel generator (jsPDF + SheetJS, server) | Berita acara + rekap | N/A | Snapshot hasil → jsPDF A4 + SheetJS xlsx → download | Generate <10s untuk 5k baris, font embed Jakarta Sans |

- Synchronization: Realtime WS primary, polling 5s fallback, heartbeat kiosk 20s, election broadcast instant.
- Fallback: Supabase down → kiosk lock + banner, tidak terima suara baru (tolak lebih baik daripada ganda); Storage down → tampil initial fallback.
- Caching: `candidates` ISR 60s + client cache, foto `stale-while-revalidate`, hasil freeze di-cache permanen setelah Stop.

## BAGIAN 7: Compliance & Data Privacy

### Regulasi
- Indonesia: UU PDP No.27/2022 — data pelajar = data anak perlu perlindungan khusus + persetujuan wali via sekolah.
- Prinsip: minimasi (hanya NISN/Nama/Kelas/Jabatan + status vote, tanpa biometrik/alamat/HP), tujuan tunggal pemilihan, tidak untuk marketing.

### Data Classification

| Data Type | Category | Storage | Retention |
|-----------|----------|---------|-----------|
| NISN/NIP/NBM, Nama, Kelas/Jabatan | PII (anak) | Postgres encrypted at rest (Supabase AES-256), TLS transit | Aktif selama tahun ajaran + 1 tahun audit, lalu anonimize |
| Password kiosk/admin | Sensitive | bcrypt hash only, tidak plaintext/log | Ganti tiap pemilihan, hash lama dihapus |
| `has_voted`, `voted_at`, `votes.voter_id→candidate_id` | Sensitif (pilihan politik pelajar) | RLS ketat, hanya agregat tampil di dashboard, tidak tampil siapa pilih siapa ke publik | Hasil agregat permanen, link voter→candidate di-restrict admin + dihapus setelah 1 tahun (sisakan count) |
| Foto kandidat | Publik terbatas | Storage private + signed URL | Hapus jika kandidat mundur / setelah 1 tahun |
| Log audit + last_ping | Non-PII operasional | Log server 90 hari | Hapus otomatis 90 hari |

- Enkripsi: at rest AES-256 Supabase, transit TLS 1.2+, backup encrypted, signed URL foto 1 jam.
- Anonimitas pemilih di bilik: dashboard tidak tampilkan mapping nama→pilihan secara live; hanya total per kandidat + feed anonim "Suara #123 masuk".

### Data Deletion Flow
1. Siswa lulus / request via TU → admin verifikasi → soft delete (flag `deleted_at`) 30 hari → hard delete / anonimize `voter_id_number→HASH`, nama→`Alumni-XXX`.
2. Orang tua/wali bisa minta hapus via surat ke sekolah, SLA 14 hari, bukti log dihapus.
3. Setelah 1 tahun: jalankan job anonimize `votes` (putus `voter_id`, sisakan `candidate_id+created_at` untuk statistik).

### Consent Management
- Cookie: hanya essential session (tanpa tracking iklan), banner info singkat di login admin; kiosk tanpa cookie pihak ketiga.
- Agreement: SK panitia + info ke siswa/wali sebelum H (tujuan, data dipakai, retensi) ditempel di mading + dibacakan wali kelas; keikutsertaan = consent tercatat via kehadiran DPT.
- Opt-out: tidak bisa opt-out dari DPT jika masih siswa aktif (wajib pilih/golput tercatat), tapi bisa minta koreksi data via TU; golput = `has_voted=false` tetap tercatat tanpa stigma.

## BAGIAN 8: Out of Scope & Dependensi

### Out of Scope (V2, tidak di V1)
- Vote via HP pribadi / remote / QR dari rumah — V1 kiosk only demi integritas.
- Verifikasi biometrik / e-KTP scanner / face match — cukup NISN + modal identitas.
- Multi-pemilihan paralel (ketua + sekretaris sekaligus) — V1 satu surat suara satu kandidat.
- Notifikasi WA/SMS ke pemilih, live streaming, komentar — tidak perlu.
- Blockchain / zero-knowledge proof — RPC + RLS + audit cukup untuk skala sekolah.
- Multi-bahasa, dark kiosk, offline-first queue kirim belakangan — ditunda (risiko double-vote).

### Dependensi
- Next.js 16 App Router + Server Actions + next/font (Inter, Plus Jakarta Sans, JetBrains Mono) — framework utama.
- Supabase (Postgres 15+, Auth, Realtime, Storage) — BaaS, butuh project + RLS policies + RPC `cast_vote`.
- Tailwind + shadcn/ui (Cards, Dialogs, Tables, Switch) + Lucide icons — UI.
- Recharts + PapaParse + SheetJS + jsPDF — chart + import/export PDF.
- Infra: Vercel hosting + domain sekolah, WiFi lab stabil 20 Mbps, 3-5 laptop/tablet bilik + 1 proyektor aula.
- Data: CSV DPT dari TU (NISN,Nama,Kelas) + foto paslon resmi OSIS.

### Asumsi
- Internet sekolah stabil saat H; jika putus, pemilihan di-pause (FR-07) bukan lanjut offline.
- TU beri DPT bersih H-3; NISN unik; guru pakai NIP/NBM konsisten.
- Panitia 5 orang (2 bilik guard, 1 DPT helpdesk, 1 command center, 1 saksi); semua hadir gladi H-1.
- Device bilik tidak dipakai browsing lain; browser Chrome/Edge terbaru; jam device sinkron NTP.
- Pemilihan selesai 1 hari; Stop dilakukan hari yang sama; berita acara ditandatangani basah.

---

## Cross-ref DESIGN.md
Semua 12 screen tercover: US-01→`/kiosk/login`, US-02/03→`/kiosk/vote`, US-04/05→`/kiosk/ballot`, US-06→`/kiosk/success`, US-07→`/kiosk/locked`, US-08→`/admin/login`, US-09/10→`/admin/dashboard`, US-11→`/admin/kiosks`, US-12→`/admin/voters`, US-13→`/admin/candidates`, US-14→`/admin/reports`, US-15→`/offline,/404`. FR-01..20 mendukung penuh.
