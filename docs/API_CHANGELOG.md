# API Changelog — JatiLapak

**Versi:** 1.0
**Tanggal:** 7 November 2026
**Fungsi:** menjelaskan **apa yang berubah** dari dokumen lama dan implementasi sebelumnya terhadap kontrak penuh `API_CONTRACT.md`.
**Kontrak yang berlaku:** `/api/v1` (REST), `GET /health` tanpa versi, dan WebSocket sesuai `asyncapi.yaml`.
**Sumber acuan baru:** `CONTEXT/API_CONTRACT.md`, `CONTEXT/openapi.yaml`, `CONTEXT/asyncapi.yaml`.
**Dokumen lama yang dibandingkan:** `Dokumentasi Teknis_RPL_COD Aja.md`, `CONTEXT/auth_feature_md/FRONTEND_AUTH.md`, `CONTEXT/FRONTEND_API_CONTRACT.md`.

Dokumen ini bukan pengganti kontrak. Detail endpoint dan schema ada di `API_CONTRACT.md` dan file YAML. Di sini fokus pada delta, alasan, dan dampak.

---

## 1. Ringkasan Perubahan Besar

| Area | Sebelum | Sekarang |
|---|---|---|
| Versi path | `/api` | `/api/v1`; `/health` tanpa versi; `/api` alias deprecated |
| Error | `status`, `response_code`, `message`, `error` | tambah `code` stabil untuk logika frontend |
| Auth verify | Dokumen teknis: mengembalikan token | hanya `status`; JWT dari login |
| Foto produk | satu `Foto_Produk_URL` | tabel foto + array objek `{foto_id,url,urutan,is_primary}` |
| Upload | tidak eksplisit | endpoint upload dua langkah sebelum create/update |
| Chat | `chat_message` + `room_id` di API | tabel `chat_room` + endpoint buka room + protokol WS |
| Titik COD | satu tabel campuran | master `meeting_point` + per-chat `chat_meeting_point`, propose/agree |
| Review | daftar ulasan | daftar + `average_rating`/`total_reviews`; unique per pihak |
| Report | polymorphic target | dua FK di balik layar; API tetap `target_type`+`target_id` |
| Admin | endpoint moderasi terpisah | `POST /admin/reports/{id}/actions` + AI summary |
| Pagination | tidak konsisten | `page`/`limit` untuk list; cursor untuk chat |
| Waktu | campur | RFC3339 UTC |
| Rate limit | hanya cooldown OTP | tabel limit per endpoint + header |
| Idempotensi | tidak eksplisit | unique room + `client_message_id` WS |

---

## 2. Path dan Versioning

**Sebelum**
- Auth: `/api/auth/*`
- API internal lain: `/api/...`
- Tidak ada kebijakan versi.

**Sekarang**
- REST kanonik: `/api/v1/...`
- Health: `/health` (tanpa versi)
- `/api/auth/*` dipertahankan sebagai **alias deprecated**.
- Breaking change berikutnya → `/api/v2`.

**Alasan**
- Kontrak `/api/v1` menjadi acuan tetap.
- Health adalah endpoint operasional, tidak perlu versi.

**Dampak**
- Backend menyediakan route v1; alias lama hanya untuk kompatibilitas.
- Frontend memakai prefix `/api/v1`.
- Dokumen teknis dan `FRONTEND_API_CONTRACT.md` diperbarui.

---

## 3. Envelope dan Error `code`

**Sebelum**
```json
{"status":"Error Conflict","response_code":409,"message":"Email sudah terdaftar","error":"..."}
```

**Sekarang**
```json
{"status":"Error Conflict","response_code":409,"code":"EMAIL_TAKEN","message":"Email sudah terdaftar","error":"..."}
```

**Alasan**
- Frontend butuh alasan yang bisa diprogram tanpa parsing teks.
- `message` boleh berubah; `code` stabil.

**Dampak**
- Backend menambah field `code`.
- Frontend switch ke `code`, bukan `message`.
- Dokumen error harus memuat katalog code (`API_CONTRACT.md §4`).

---

## 4. Auth

| Topik | Sebelum | Sekarang |
|---|---|---|
| Verify OTP | Dokumen API-002 menyebut token | Hanya `status`; token dari login |
| Register | `nama`, `prodi` | `nama_lengkap`, `program_studi`, `accept_terms` |
| Resend | Pesan literal `OTP_Sent` | Pesan generik; sukses tanpa `data` |
| Path | `/api/auth/*` | `/api/v1/auth/*` (alias lama deprecated) |
| Error OTP salah | 400 (dokumen frontend) | 401 |
| Attempts habis | 400 (dokumen frontend) | 429 |
| Health | Tidak ada | `GET /health` |

**Alasan**
- Verifikasi email bukan autentikasi sesi; token hanya dari login.
- Mencegah enumerasi email lewat pesan resend.
- Status code diselaraskan dengan perilaku backend.

**Dampak**
- Frontend: setelah verify arahkan ke login.
- Dokumen API-002, `FRONTEND_AUTH.md`, dan `FRONTEND_API_CONTRACT.md` direvisi.

---

## 5. Profil

**Sebelum**
- `DATA-001` tidak memuat foto, bio, kontak darurat.
- `API-005/006` membutuhkan field tersebut.

**Sekarang**
- `users`: tambah `foto_profil_url`, `bio`, `kontak_darurat`.
- `GET/PUT /api/v1/users/profile`.
- `status_keaktifan` dipetakan dari `status_verifikasi`.
- `average_rating`/`total_reviews` dihitung dari review.

**Dampak**
- Migrasi ALTER `users`.
- Frontend menambah form profil.

---

## 6. Upload dan Produk

**Sebelum**
- `DATA-002`: `Foto_Produk_URL` tunggal.
- `API-009` langsung membuat listing dengan foto.

**Sekarang**
- `POST /api/v1/uploads/images` (multipart) → `{url, public_id}`.
- Create/update produk memakai array objek foto.
- Foto disimpan di tabel `product_photo` dengan urutan dan `is_primary`.
- Hapus produk = soft delete (`deleted_at`).
- Tambah endpoint status stok.

**Alasan**
- Galeri, urutan, hapus/ganti satu foto.
- Memisahkan upload agar bisa retry/preview.
- Soft delete menjaga riwayat review/report/chat.

**Dampak**
- Frontend: upload dua langkah, kirim array foto.
- Backend: endpoint upload + validasi Cloudinary + tabel foto.
- Dokumen teknis DATA-002/API-009/010 diperbarui.

---

## 7. Chat dan WebSocket

**Sebelum**
- `DATA-003` hanya pesan; `API-013/015` memakai `room_id` tanpa tabel room.
- WebSocket hanya disebut singkat.

**Sekarang**
- Tabel `chat_room` (product + buyer + seller, idempoten).
- `POST /api/v1/chat/rooms` untuk membuka room.
- REST untuk daftar room, riwayat, dan fallback kirim pesan.
- WebSocket `/ws/chat/{room_id}` dengan protokol lengkap:
  - auth lewat pesan pertama,
  - `message.send`/`message.created`,
  - `message.read`,
  - `meeting_point.updated`,
  - `ping`/`pong`,
  - `client_message_id` untuk idempotensi,
  - reconnect dengan `last_chat_id`.

**Alasan**
- `chat_id` = satu pesan; `room_id` = percakapan.
- WebSocket butuh identitas channel dan otorisasi peserta.
- Pesan disimpan sebelum broadcast agar tidak hilang.

**Dampak**
- Backend menambah tabel room + endpoint room + gateway WS.
- Frontend memakai room dari REST lalu konek WS.
- Spesifikasi di `asyncapi.yaml`.

---

## 8. Titik Temu COD

**Sebelum**
- `DATA-004` mencampur master (`location_id`, nama, koordinat) dan per-chat (`chat_id`, `sender_id`, catatan).

**Sekarang**
- `meeting_point` = master (di-seed, `is_active`).
- `chat_meeting_point` = per room; mendukung master atau pin custom.
- Status `Proposed`/`Agreed`/`Rejected`; satu `Agreed` per room.
- Endpoint `propose` dan `agree` terpisah.

**Alasan**
- Master dipakai bersama; keputusan per chat punya riwayat.
- Mendukung pin custom Leaflet.

**Dampak**
- Frontend: pilih master atau pin, usul lalu sepakati.
- Backend: dua tabel + validasi peserta.
- Dokumen teknis DATA-004/API-017 diperbarui.

---

## 9. Review

**Sebelum**
- `DATA-005` menyebut review dua arah, tanpa aturan unik.
- `API-019` mengembalikan rata-rata.

**Sekarang**
- `UNIQUE(product_id, reviewer_id)`.
- Hanya produk `Sold` dan peserta transaksi.
- `GET /api/v1/users/{user_id}/reviews` mengembalikan `average_rating`, `total_reviews`, item, meta.
- `average_rating` null jika belum ada review (bukan 0).
- Agregasi saat baca; tanpa cache.

**Dampak**
- Frontend menampilkan reputasi dengan penanganan null.
- Backend memvalidasi status produk dan peserta.

---

## 10. Report, Admin, dan AI

**Sebelum**
- `DATA-006`: target polymorphic.
- `API-022/023`: endpoint moderasi terpisah.
- `API-024`: AI summary.

**Sekarang**
- API tetap `target_type` + `target_id`; DB memakai dua FK nullable.
- `POST /api/v1/admin/reports/{report_id}/actions` dengan `action` enum.
- `POST /api/v1/admin/reports/ai-summary` (sync timeout 15 detik; 502/504 saat gagal).
- Status laporan kanonik: `Pending`, `Reviewed`, `Resolved`, `Rejected`.
- `User_Blocked` bukan status laporan; disimpan sebagai `action_taken`.

**Alasan**
- Integritas FK; dasbor admin lebih sederhana.
- Satu pintu aksi moderasi.
- AI tidak boleh memblokir UI terlalu lama.

**Dampak**
- Dokumen API-022/023 disatukan.
- Frontend admin memakai endpoint actions dan summary.
- Backend menambah validasi role admin (401 vs 403).

---

## 11. Non-Fitur yang Ditetapkan

| Topik | Keputusan |
|---|---|
| Pagination | `page`/`limit` (maks 100); chat cursor `before` |
| Waktu | RFC3339 UTC; durasi dalam detik |
| Rate limit | per endpoint; `Retry-After` + `RateLimit-*` |
| Idempotensi | unique room; `client_message_id` WS |
| Auth | Bearer JWT 24 jam; tanpa refresh |
| Upload | maks 2 MB; jpg/png/webp; maks 5 foto produk |
| Enum | kanonik di DB/API/UI |
| Soft delete | produk |
| Reputasi | agregasi saat baca |
| AI | sync timeout; async opsional |

---

## 12. Endpoint Baru / Berubah / Dihapus

### Baru
- `POST /api/v1/uploads/images`
- `POST /api/v1/chat/rooms`
- `POST /api/v1/chat/rooms/{room_id}/meeting-points`
- `POST /api/v1/chat/rooms/{room_id}/meeting-points/{meeting_id}/agree`
- `POST /api/v1/admin/reports/{report_id}/actions`
- `WS /ws/chat/{room_id}`

### Berubah
- Semua path → `/api/v1` (health tetap `/health`).
- `API-002` verify: tanpa token.
- `API-008/009/010`: foto menjadi array objek.
- `API-011`: soft delete.
- `API-013/014/015`: memakai room nyata.
- `API-017`: dipisah propose/agree.
- `API-022/023`: digabung ke `actions`.
- Error: tambah `code`.

### Dihapus/konsep lama
- Foto tunggal di tabel produk.
- `reported_target_id` polymorphic sebagai satu-satunya representasi DB.
- Path moderasi terpisah untuk delete listing dan block user.

---

## 13. Cakupan Kontrak

Kontrak berlaku untuk semua endpoint di `API_CONTRACT.md` dan `openapi.yaml`:
- REST: `/api/v1/...`
- Health: `/health`
- WebSocket: `/ws/chat/{room_id}` sesuai `asyncapi.yaml`

Dokumen ini fokus pada delta kontrak, bukan status implementasi.

---

## 14. Checklist Revisi Dokumen

| Dokumen & bagian | Perlu diubah |
|---|---|
| `Dokumentasi Teknis §2.5` | path `/api/v1`, `code`, endpoint baru, API-002 tanpa token, API-022/023 digabung |
| `Dokumentasi Teknis §1.6 DATA-002` | foto array + upload dua langkah + soft delete |
| `Dokumentasi Teknis §1.6 DATA-003` | room + status baca |
| `Dokumentasi Teknis §1.6 DATA-004` | master vs per-chat |
| `Dokumentasi Teknis §1.6 DATA-006` | dua FK di balik layar + enum |
| `Dokumentasi Teknis §1.8 UC-005/006` | alur room/WS dan propose/agree |
| `Dokumentasi Teknis §3.3` | daftar endpoint aktual |
| `FRONTEND_AUTH.md` | verify tanpa token, port 3030, error 401/429, field register |
| `FRONTEND_API_CONTRACT.md` | tandai legacy; acuan penuh `API_CONTRACT.md` |
| `DATABASE_FULL.md` | pastikan enum/field sama dengan kontrak API |
| `DATABASE_CHANGELOG.md` | catat perubahan API yang memengaruhi schema |

---

## 15. Riwayat Perubahan

| Tanggal | Versi | Perubahan |
|---|---|---|
| 7 Nov 2026 | 1.0 | Dokumen awal: delta kontrak penuh, endpoint baru/berubah, checklist revisi |
