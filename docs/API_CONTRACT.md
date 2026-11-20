# API Contract — JatiLapak (Full)

**Versi:** 1.0
**Tanggal:** 7 November 2026
**Status dokumen:** kontrak penuh + status implementasi.
**Sumber mesin:** `CONTEXT/openapi.yaml` (REST) dan `CONTEXT/asyncapi.yaml` (WebSocket).
**Sumber data:** `CONTEXT/DATABASE_FULL.md`, `CONTEXT/DATABASE_CHANGELOG.md`, `Dokumentasi Teknis_RPL_COD Aja.md`.

Dokumen ini adalah kontrak API penuh. OpenAPI adalah sumber kebenaran untuk schema; dokumen ini menjelaskan alur, aturan, dan keputusan.

> **Delta dari dokumen lama:** lihat `CONTEXT/API_CHANGELOG.md`. Dokumen ini memakai `/api/v1` sebagai kontrak penuh; status implementasi dicatat apa adanya.

---

## 1. Status Implementasi

| Status | Arti |
|---|---|
| `implemented` | Endpoint berjalan di backend. |
| `pending-migration` | Logika berjalan, tetapi kontrak v1 (`/api/v1`, `code`) belum aktif. |
| `planned` | Target kontrak; belum ada di backend. |

Ringkas:

- Auth (register, verify, resend, login): **implemented**, tetapi path masih `/api/auth/*` dan error belum punya `code`.
- `GET /health`: **implemented**.
- Profil, produk, upload, chat, titik temu, review, report, admin, AI, WebSocket: **planned**.

---

## 2. Konvensi

### 2.1 Base URL dan versi
- REST: `http://localhost:3030` (dev), base path `/api/v1`.
- Health: `GET /health` **tanpa versi**.
- Path lama `/api/auth/*` = alias **deprecated**.
- WebSocket: `ws://localhost:3030/ws/chat/{room_id}`.

### 2.2 Envelope
Sukses:
```json
{
  "status": "Success",
  "response_code": 200,
  "message": "Login berhasil",
  "data": {}
}
```
Error:
```json
{
  "status": "Error Conflict",
  "response_code": 409,
  "code": "EMAIL_TAKEN",
  "message": "Email sudah terdaftar",
  "error": "email sudah terdaftar"
}
```
Aturan:
- `response_code` = HTTP status.
- `code` = kode stabil untuk logika frontend (lihat §4).
- `message` = teks manusia; boleh berubah.
- `error` = detail internal; jangan ditampilkan.
- `data` = opsional; resend OTP sukses tidak punya `data`.

### 2.3 Autentikasi
- JWT HS256 dari login, TTL 24 jam.
- Header: `Authorization: Bearer <token>`.
- Claim: `user_id`, `role`, `email`, `iat`, `exp`.
- Tanpa token/invalid/expired → **401**.
- Sudah login tetapi bukan admin / akun blocked → **403**.
- Refresh token belum ada.

### 2.4 Waktu
- Semua timestamp **RFC3339 UTC** (`2026-11-01T13:48:12Z`).
- Frontend mengubah ke zona waktu pengguna.
- Durasi di API memakai detik (`Retry-After`, `expires_in_seconds`), bukan string `5m`.

### 2.5 Pagination
- List umum: `?page=1&limit=20` (maks 100), response `meta {page, limit, total, total_page}`.
- Riwayat chat: cursor `?before=<chat_id>&limit=50`, response `meta {next_cursor, has_more}`.
- Urutan selalu stabil (tie-breaker `id`).

### 2.6 Idempotensi
- Room: `UNIQUE(product_id, buyer_id, seller_id)`; `POST /chat/rooms` mengembalikan room yang sama.
- Pesan WebSocket: `client_message_id` wajib dan idempoten per pengirim/room.
- REST kirim pesan: `client_message_id` opsional tetapi disarankan.

### 2.7 Rate limit
Header pada 429: `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.

---

## 3. Katalog Endpoint

| ID | Method | Path | Auth | Status |
|---|---|---|---|---|
| HEALTH | GET | `/health` | Tidak | implemented |
| AUTH-REG | POST | `/api/v1/auth/register` | Tidak | pending-migration |
| AUTH-VER | POST | `/api/v1/auth/verify-otp` | Tidak | pending-migration |
| AUTH-RES | POST | `/api/v1/auth/resend-otp` | Tidak | pending-migration |
| AUTH-LOG | POST | `/api/v1/auth/login` | Tidak | pending-migration |
| PROF-GET | GET | `/api/v1/users/profile` | Bearer | planned |
| PROF-PUT | PUT | `/api/v1/users/profile` | Bearer | planned |
| UPLOAD | POST | `/api/v1/uploads/images` | Bearer | planned |
| PROD-LIST | GET | `/api/v1/products` | Bearer | planned |
| PROD-CREATE | POST | `/api/v1/products` | Bearer | planned |
| PROD-DETAIL | GET | `/api/v1/products/{product_id}` | Bearer | planned |
| PROD-UPDATE | PUT | `/api/v1/products/{product_id}` | Bearer | planned |
| PROD-DELETE | DELETE | `/api/v1/products/{product_id}` | Bearer | planned |
| PROD-STATUS | PUT | `/api/v1/products/{product_id}/status` | Bearer | planned |
| MP-LIST | GET | `/api/v1/meeting-points` | Bearer | planned |
| CHAT-ROOMS | GET | `/api/v1/chat/rooms` | Bearer | planned |
| CHAT-OPEN | POST | `/api/v1/chat/rooms` | Bearer | planned |
| CHAT-MSGS | GET | `/api/v1/chat/rooms/{room_id}/messages` | Bearer | planned |
| CHAT-SEND | POST | `/api/v1/chat/rooms/{room_id}/messages` | Bearer | planned |
| MP-PROPOSE | POST | `/api/v1/chat/rooms/{room_id}/meeting-points` | Bearer | planned |
| MP-AGREE | POST | `/api/v1/chat/rooms/{room_id}/meeting-points/{meeting_id}/agree` | Bearer | planned |
| REV-CREATE | POST | `/api/v1/reviews` | Bearer | planned |
| REV-LIST | GET | `/api/v1/users/{user_id}/reviews` | Bearer | planned |
| REPORT-CREATE | POST | `/api/v1/reports` | Bearer | planned |
| ADMIN-REPORTS | GET | `/api/v1/admin/reports` | Bearer admin | planned |
| ADMIN-ACTION | POST | `/api/v1/admin/reports/{report_id}/actions` | Bearer admin | planned |
| ADMIN-AI | POST | `/api/v1/admin/reports/ai-summary` | Bearer admin | planned |
| WS-CHAT | WS | `/ws/chat/{room_id}` | JWT via pesan auth | planned |

---

## 4. Katalog Error `code`

| Code | HTTP umum | Arti |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input tidak valid |
| `EMAIL_DOMAIN_INVALID` | 400 | Domain email bukan `@mail.unpad.ac.id` |
| `NPM_INVALID` | 400 | NPM bukan 12 digit |
| `PASSWORD_INVALID` | 400 | Password di luar 8–72 karakter |
| `TERMS_REQUIRED` | 400 | `accept_terms` belum true |
| `EMAIL_TAKEN` | 409 | Email sudah terdaftar |
| `NPM_TAKEN` | 409 | NPM sudah terdaftar |
| `INVALID_CREDENTIALS` | 401 | Email/password salah (generik) |
| `NOT_VERIFIED` | 403 | Akun belum verified |
| `BLOCKED` | 403 | Akun diblokir |
| `OTP_INVALID` | 401 | Kode OTP salah / user tidak ditemukan |
| `OTP_EXPIRED` | 400 | Kode OTP kedaluwarsa |
| `OTP_ATTEMPTS_EXCEEDED` | 429 | Percobaan OTP habis |
| `RESEND_COOLDOWN` | 429 | Cooldown resend belum lewat |
| `RATE_LIMITED` | 429 | Rate limit umum |
| `NOT_FOUND` | 404 | Resource tidak ada |
| `FORBIDDEN` | 403 | Tidak berhak |
| `NOT_PARTICIPANT` | 403 | Bukan peserta room/produk |
| `PRODUCT_NOT_SOLD` | 400 | Review sebelum produk Sold |
| `REVIEW_ALREADY_EXISTS` | 409 | Review ganda |
| `MEETING_POINT_CONFLICT` | 409 | Titik temu Agreed sudah ada |
| `UPSTREAM_ERROR` | 502 | Layanan eksternal gagal (Gemini/Cloudinary) |
| `UPSTREAM_TIMEOUT` | 504 | Layanan eksternal timeout |
| `SERVICE_UNAVAILABLE` | 503 | DB/server tidak siap |
| `INTERNAL_ERROR` | 500 | Kesalahan server |

Catatan: implementasi auth saat ini belum mengirim `code`; ini gap yang dicatat di §12.

---

## 5. Health

### `GET /health`
Tanpa auth.
- 200: `data {status:"ok", database:"ok"}`.
- 503: `code: SERVICE_UNAVAILABLE`.

---

## 6. Auth

Aturan umum: OTP tidak pernah dikembalikan API; OTP 6 digit; TTL 5 menit; resend cooldown 60 detik; maks 5 percobaan.

### `POST /api/v1/auth/register`
Request:
| Field | Tipe | Aturan |
|---|---|---|
| `nama_lengkap` | string | wajib, maks 100 |
| `npm` | string | 12 digit |
| `email_kampus` | string | domain `@mail.unpad.ac.id`, lowercase |
| `password` | string | 8–72 karakter |
| `program_studi` | string | wajib |
| `fakultas` | string | wajib |
| `accept_terms` | boolean | wajib `true` |

Sukses 201: `data {user_id, status:"pending_otp"}`.
Error: 400 (`VALIDATION_ERROR`, `EMAIL_DOMAIN_INVALID`, `NPM_INVALID`, `PASSWORD_INVALID`, `TERMS_REQUIRED`), 409 (`EMAIL_TAKEN`, `NPM_TAKEN`), 500.
Tidak ada token.

### `POST /api/v1/auth/verify-otp`
Request: `{email_kampus, otp}` (`otp` 6 digit).
Sukses 200: `data {status:"verified"}`.
Error: 400 `OTP_EXPIRED`, 401 `OTP_INVALID`, 403 `BLOCKED`, 429 `OTP_ATTEMPTS_EXCEEDED`, 500.
Tidak ada token; frontend ke login.

### `POST /api/v1/auth/resend-otp`
Request: `{email_kampus}`.
Sukses 200 **tanpa `data`**, pesan generik.
Error: 400, 403 `BLOCKED`, 409 (sudah verified), 429 `RESEND_COOLDOWN`, 500.
Email tak terdaftar tetap 200 dengan pesan sama.

### `POST /api/v1/auth/login`
Request: `{email_kampus, password}`.
Sukses 200: `data {token, user}`.
`user`: `user_id, nama_lengkap, npm, email_kampus, program_studi, fakultas, role, status_verifikasi, tanggal_registrasi`.
Error: 400, 401 `INVALID_CREDENTIALS`, 403 `NOT_VERIFIED`/`BLOCKED`, 500.

---

## 7. Profil

### `GET /api/v1/users/profile`
Bearer.
Sukses 200: `data UserProfile` = field `User` + `foto_profil_url`, `bio`, `kontak_darurat`, `average_rating`, `total_reviews`.
`average_rating` null jika belum ada ulasan; `total_reviews` 0.
Error: 401, 403, 500.

### `PUT /api/v1/users/profile`
Request (semua opsional):
| Field | Tipe | Aturan |
|---|---|---|
| `foto_profil_url` | string/null | URL Cloudinary |
| `bio` | string/null | maks 500 |
| `kontak_darurat` | string/null | maks 30 |

Sukses 200: `data UserProfile`.
Error: 400, 401, 403, 500.

---

## 8. Upload Gambar

### `POST /api/v1/uploads/images`
Bearer. `multipart/form-data`.
| Field | Tipe | Aturan |
|---|---|---|
| `file` | binary | wajib; jpg/png/webp; maks 2 MB |
| `purpose` | string | `product`, `profile`, `report` |

Sukses 201: `data {url, public_id}`.
Error: 400, 401, 413 (terlalu besar), 415 (tipe tidak didukung), 500 (`UPSTREAM_ERROR` bila Cloudinary gagal).

Alur: upload dulu → gunakan `url` di create/update produk, profil, atau report.

---

## 9. Produk

### `GET /api/v1/products`
Bearer. Query:
| Param | Tipe | Catatan |
|---|---|---|
| `page`, `limit` | int | default 1/20, maks 100 |
| `kategori` | enum | lihat §10 |
| `kondisi` | enum | `Used`, `New` |
| `min_price`, `max_price` | number | >= 0 |
| `status` | enum | `Available`, `Sold` |
| `q` | string | cari judul/deskripsi |
| `sort` | string | default `-tanggal_unggah` |

Sukses 200: `data {items: Product[], meta}`.
Produk `Sold`/deleted disembunyikan dari katalog default.
Error: 400, 401, 500.

### `POST /api/v1/products`
Bearer, hanya user verified.
Request:
| Field | Tipe | Aturan |
|---|---|---|
| `judul_produk` | string | wajib, maks 150 |
| `deskripsi_produk` | string | wajib |
| `kategori` | enum | wajib |
| `harga` | number | >= 0 |
| `kondisi_barang` | enum | `Used`/`New` |
| `fotos` | array | maks 5, item `{url, urutan, is_primary}` |

Sukses 201: `data Product`.
Error: 400, 401, 403, 500.

### `GET /api/v1/products/{product_id}`
Sukses 200: `data Product`.
Error: 401, 404, 500.

### `PUT /api/v1/products/{product_id}`
Bearer, hanya pemilik.
Request sama seperti create (semua opsional).
Sukses 200: `data Product`.
Error: 400, 401, 403, 404, 500.

### `DELETE /api/v1/products/{product_id}`
Bearer, hanya pemilik.
Soft delete (`deleted_at`).
Sukses 200: `data {status}`.
Error: 401, 403, 404, 500.

### `PUT /api/v1/products/{product_id}/status`
Bearer, hanya pemilik. Body `{status_stok:"Available"|"Sold"}`.
Sukses 200: `data Product`.
Error: 400, 401, 403, 404, 500.

Bentuk `Product`:
`product_id, user_id, judul_produk, deskripsi_produk, kategori, harga, kondisi_barang, status_stok, tanggal_unggah, updated_at, deleted_at, seller (User), fotos (ProductPhoto[])`.
`ProductPhoto`: `foto_id, url, urutan, is_primary`.

---

## 10. Enum Kanonik

| Domain | Nilai |
|---|---|
| Kategori | `Buku`, `Elektronik`, `Perabot`, `Pakaian`, `Makanan`, `Jasa` |
| Kondisi | `Used`, `New` |
| Status stok | `Available`, `Sold` |
| Role | `user`, `admin` |
| Verifikasi | `pending_otp`, `verified`, `blocked` |
| Status baca | `Read`, `Unread` |
| Status titik temu | `Proposed`, `Agreed`, `Rejected` |
| Status laporan | `Pending`, `Reviewed`, `Resolved`, `Rejected` |
| Alasan laporan | `Spam`, `Akun Fiktif`, `Penipuan`, `Barang Terlarang` |
| Aksi moderasi | `Delete_Listing`, `Block_User` |

Label UI boleh bahasa Indonesia; token DB/API tetap seperti di atas.

---

## 11. Titik Temu COD

### `GET /api/v1/meeting-points`
Bearer. Mengembalikan master aktif (`is_active=true`).
Sukses 200: `data {items: MeetingPoint[]}`.
`MeetingPoint`: `location_id, nama_titik_temu, latitude, longitude, pin_point_notes, is_active`.
Error: 401, 500.

### `POST /api/v1/chat/rooms/{room_id}/meeting-points`
Bearer, peserta room.
Request: tepat salah satu:
- `{meeting_point_id, pin_point_notes?}`, atau
- `{custom_latitude, custom_longitude, pin_point_notes?}`.

Sukses 201: `data ChatMeetingPoint` (`status:"Proposed"`).
Error: 400, 401, 403, 404, 500.

### `POST /api/v1/chat/rooms/{room_id}/meeting-points/{meeting_id}/agree`
Bearer, peserta room.
Sukses 200: `data ChatMeetingPoint` (`status:"Agreed"`, `agreed_at` terisi).
Aturan: hanya satu `Agreed` per room; yang lama menjadi `Rejected`.
Error: 400, 401, 403, 404, 409 `MEETING_POINT_CONFLICT`, 500.

---

## 12. Chat

### REST

#### `GET /api/v1/chat/rooms`
Bearer. Pagination `page`/`limit`.
Sukses 200: `data {items: ChatRoom[], meta}`.
`ChatRoom`: `room_id, product_id, buyer_id, seller_id, created_at, last_message_at, product?, last_message?, unread_count`.
Error: 401, 500.

#### `POST /api/v1/chat/rooms`
Bearer. Body `{product_id, other_user_id?}`.
Aturan:
- Jika pemanggil pembeli: `other_user_id` tidak perlu; seller dari pemilik produk.
- Jika pemanggil penjual: `other_user_id` wajib (buyer).
- Idempoten: room yang sama dikembalikan.
Sukses 200/201: `data ChatRoom`.
Error: 400, 401, 403 (`NOT_PARTICIPANT` jika bukan pihak produk), 404, 500.

#### `GET /api/v1/chat/rooms/{room_id}/messages`
Bearer, peserta room. Cursor `before` + `limit`.
Sukses 200: `data {items: ChatMessage[], meta:{next_cursor,has_more}}`.
Error: 401, 403, 404, 500.

#### `POST /api/v1/chat/rooms/{room_id}/messages`
Bearer, peserta room. Body `{teks_pesan, client_message_id?}`.
Sukses 201: `data ChatMessage`.
Error: 400, 401, 403, 404, 429 `RATE_LIMITED`, 500.

### WebSocket (`/ws/chat/{room_id}`)
Auth: pesan `auth` pertama berisi JWT; server verifikasi peserta room.
Event klien: `auth`, `message.send`, `message.read`, `ping`.
Event server: `auth.ok`, `message.created`, `message.read`, `meeting_point.updated`, `error`, `pong`.
Aturan:
- Simpan pesan ke DB **sebelum** broadcast.
- `client_message_id` wajib untuk `message.send`; idempoten.
- Reconnect mengirim `last_chat_id`.
- Heartbeat 30 detik; backoff eksponensial.
- Detail schema: `CONTEXT/asyncapi.yaml`.

---

## 13. Review

### `POST /api/v1/reviews`
Bearer. Body `{product_id, skor_rating (1–5), teks_ulasan}`.
Aturan:
- Produk harus `Sold`.
- Hanya peserta transaksi.
- Satu review per `(product_id, reviewer_id)`.
Sukses 201: `data Review`.
Error: 400 `PRODUCT_NOT_SOLD`, 401, 403 `NOT_PARTICIPANT`, 409 `REVIEW_ALREADY_EXISTS`, 500.

### `GET /api/v1/users/{user_id}/reviews`
Bearer. Pagination.
Sukses 200: `data {average_rating, total_reviews, items: Review[], meta}`.
`average_rating` null jika `total_reviews=0`, dibulatkan 2 desimal.
Error: 404, 500.

---

## 14. Laporan

### `POST /api/v1/reports`
Bearer. Body:
| Field | Tipe | Aturan |
|---|---|---|
| `target_type` | enum | `user`/`product` |
| `target_id` | uuid | target sesuai tipe |
| `alasan` | enum | alasan kanonik |
| `deskripsi_laporan` | string | wajib, maks 2000 |
| `bukti_foto_url` | string/null | URL Cloudinary |

Sukses 201: `data Report` (`status_laporan:"Pending"`).
Error: 400, 401, 403, 429, 500.

`Report` memuat `report_id, reporter_user_id, reported_user_id, reported_product_id, target_type, target_id, alasan, deskripsi_laporan, bukti_foto_url, status_laporan, tanggal_laporan, resolved_by, action_taken, executed_at`.

---

## 15. Admin

Semua endpoint admin: Bearer + role `admin`. Token invalid → 401; bukan admin/blocked → 403.

### `GET /api/v1/admin/reports`
Query `status` (enum), `page`, `limit`.
Sukses 200: `data {items: Report[], meta}`.
Error: 401, 403, 500.

### `POST /api/v1/admin/reports/{report_id}/actions`
Body `{action:"Delete_Listing"|"Block_User"}`.
Aturan:
- `Delete_Listing` → soft delete produk target.
- `Block_User` → set user target `blocked`.
- Laporan menjadi `Resolved`; isi `resolved_by`, `action_taken`, `executed_at`.
Sukses 200: `data Report`.
Error: 400, 401, 403, 404, 409, 500.

### `POST /api/v1/admin/reports/ai-summary`
Body `{target_type, target_id}`.
Sukses 200: `data {summary_text, patterns[], recommended_actions[], generated_at, model}`.
Aturan: sinkron dengan timeout 15 detik; gagal upstream 502 `UPSTREAM_ERROR` / 504 `UPSTREAM_TIMEOUT`; rate limit per admin.
Error: 400, 401, 403, 429, 500, 502, 504.

---

## 16. Rate Limit Default

| Endpoint | Batas usulan |
|---|---|
| Register | 5/jam per IP, 3/jam per email |
| Verify OTP | 10/menit per user + 5 percobaan per OTP |
| Resend OTP | 60 detik cooldown + 5/jam per email |
| Login | 10/menit per IP, 5/menit per email |
| Upload gambar | 50/hari per user |
| Create produk | 20/hari per user |
| Chat kirim pesan | 60/menit per user |
| Buat laporan | 10/hari per user |
| AI summary | 10/jam per admin |
| Umum | 120/menit per IP |

Nilai dapat diubah lewat konfigurasi; header `RateLimit-*` dan `Retry-After` wajib pada 429.

---

## 17. Versioning dan Migrasi

- Kanonik: `/api/v1`.
- Lama: `/api/auth/*` = alias **deprecated**. Respons alias menambahkan header `Deprecation: true`; `Sunset` diisi saat tanggal pensiun ditetapkan.
- Health tidak berversi.
- Perubahan aditif (field opsional baru, code baru) tidak menaikkan versi.
- Breaking change → `/api/v2`.
- Jangan mencampur `/api` dan `/api/v1` untuk endpoint baru.

---

## 18. Gap Implementasi Saat Ini

| Gap | Dampak | Rencana |
|---|---|---|
| Auth masih `/api/auth/*` | Frontend harus pakai alias sementara | Aktifkan `/api/v1/auth/*`, alias deprecated |
| Envelope belum punya `code` | Frontend belum bisa switch `code` | Tambah field `code` (aditif) |
| Endpoint `planned` belum ada | Frontend butuh mock | Gunakan OpenAPI + Prism |
| WebSocket belum ada | Chat real-time belum bisa | Implementasi sesuai AsyncAPI |
| `FRONTEND_API_CONTRACT.md` khusus auth | Dua dokumen | Ditandai **legacy/superseded**; acuan penuh `API_CONTRACT.md` |
| Upload endpoint baru | Belum ada di dokumen teknis | Catat di revisi dokumen |

---

## 19. Perbedaan vs Dokumen Teknis

| Topik | Dokumen teknis | Kontrak ini |
|---|---|---|
| Versi | `/api` | `/api/v1` + alias deprecated |
| API-002 verify | Mengembalikan token | Hanya `status`; token dari login |
| API-022/023 | Path moderasi terpisah | Digabung `POST /admin/reports/{id}/actions` |
| Foto produk | `Foto_Produk_URL` tunggal | Array objek `ProductPhoto` |
| Chat room | Tidak ada endpoint room | `POST /chat/rooms` |
| Upload | Tidak ada | `POST /uploads/images` |
| Error | Tanpa `code` | `code` stabil |
| Pagination | Tidak konsisten | `page`/`limit` + cursor chat |
| WebSocket | Singkat | Protokol lengkap di AsyncAPI |
| Profil | Field belum lengkap | `foto_profil_url`, `bio`, `kontak_darurat` |

---

## 20. Workflow Kontrak

1. **OpenAPI = sumber schema**; markdown = penjelasan.
2. Mock: `npx @stoplight/prism-cli mock CONTEXT/openapi.yaml`.
3. Generate tipe: `npx openapi-typescript CONTEXT/openapi.yaml -o src/api/schema.d.ts`.
4. Lint: `npx @stoplight/spectral-cli lint CONTEXT/openapi.yaml`.
5. AsyncAPI untuk WS; validasi dengan `npx @asyncapi/cli validate CONTEXT/asyncapi.yaml`.
6. Contract test di CI membandingkan respons nyata dengan OpenAPI.
7. Setiap perubahan kontrak dicatat (lihat `DATABASE_CHANGELOG.md` untuk perubahan skema; tambahkan catatan API saat endpoint berubah status).

---

## 21. Checklist Implementasi Berikutnya

- [ ] Aktifkan `/api/v1/auth/*` + alias `/api` deprecated.
- [ ] Tambah `code` di envelope dan semua error.
- [ ] Implementasi profil + kolom `users`.
- [ ] Upload Cloudinary + validasi file.
- [ ] Produk + foto + soft delete.
- [ ] Room + pesan REST.
- [ ] WebSocket sesuai AsyncAPI.
- [ ] Titik temu propose/agree.
- [ ] Review + agregat reputasi.
- [ ] Report + admin + AI summary.
- [ ] Rate limit + header.
- [ ] Contract test di CI.

---

## 22. Perubahan dari Dokumen Lama

Ringkasan delta ada di `CONTEXT/API_CHANGELOG.md`. Poin utama:

1. **Versioning**: `/api` → `/api/v1`; `/health` tanpa versi; alias lama deprecated.
2. **Error**: tambah `code` stabil di envelope.
3. **Auth**: verify tanpa token; register `accept_terms`; resend tanpa `data`.
4. **Produk**: foto tunggal → array objek; upload dua langkah; soft delete.
5. **Chat**: tabel/endpoint room + protokol WebSocket di AsyncAPI.
6. **Titik temu**: master + per-chat; `propose`/`agree` terpisah.
7. **Review**: agregat `average_rating`/`total_reviews`.
8. **Report/admin/AI**: target dua FK di balik layar; endpoint `actions`; AI summary.
9. **Non-fitur**: pagination, RFC3339 UTC, rate limit, idempotensi.
10. **Endpoint baru**: uploads, chat rooms, admin actions, AI summary; API-022/023 digabung.
