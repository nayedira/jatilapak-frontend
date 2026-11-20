# Frontend — Auth Slice (Arahan Kerja)

**Versi:** 0.1
**Tanggal:** 1 November 2026
**Untuk:** penanggung jawab frontend
**Fokus:** register, verifikasi OTP, resend OTP, login
**Stack:** React + TypeScript + Vite

---

## 1. Tujuan

Frontend harus bisa berjalan paralel dengan backend tanpa menunggu backend selesai.

Cakupan:

- halaman register,
- halaman verifikasi OTP,
- halaman login,
- API client,
- mock untuk development.

Belum ada profil, listing, chat, COD, review, laporan, admin, atau AI.

---

## 2. Kesepakatan Kontrak

### Base URL

Gunakan environment variable:

```text
VITE_API_BASE_URL=http://localhost:8080
```

Jangan hardcode URL backend di komponen.

### Envelope Response

Ikuti pola response project backend contoh:

Sukses:

```text
status, response_code, message, data
```

Error:

```text
status, response_code, message, error
```

Aturan:

- Gunakan `response_code` untuk menentukan sukses/gagal.
- Jangan bergantung pada string `status`.
- Tampilkan `message` ke pengguna.
- Jangan menampilkan `error` mentah ke pengguna.
- Jangan parsing `message` untuk logika jika masih bisa memakai HTTP status.

### Daftar Endpoint

| Method | Path | Auth | Data yang dikirim | Data yang diterima |
|---|---|---|---|---|
| POST | `/api/auth/register` | Tidak | nama_lengkap, npm, email_kampus, password, program_studi, fakultas, accept_terms | user_id, status `pending_otp` |
| POST | `/api/auth/verify-otp` | Tidak | email_kampus, otp | status `verified` |
| POST | `/api/auth/resend-otp` | Tidak | email_kampus | message |
| POST | `/api/auth/login` | Tidak | email_kampus, password | token, user |

Bentuk `user` pada login:

```text
user_id, nama_lengkap, role, status_verifikasi
```

Aturan:

- Frontend tidak pernah menerima OTP dari API.
- Frontend tidak pernah menerima password hash.
- OTP di development hanya terlihat di log backend.
- Jangan mengubah nama field tanpa koordinasi backend.

---

## 3. Alur Halaman

### Register

Route: `/register`

Field:

- nama lengkap,
- NPM,
- email kampus,
- program studi,
- fakultas,
- password,
- konfirmasi password,
- checkbox Terms & Conditions.

Aksi:

- validasi client-side,
- kirim ke backend,
- jika sukses simpan email ke `sessionStorage`,
- redirect ke `/verify-otp`.

Jangan simpan password di storage mana pun.

### Verifikasi OTP

Route: `/verify-otp`

Sumber email:

- ambil dari `sessionStorage`,
- jika kosong, redirect ke `/register`.

UI:

- tampilkan email tujuan,
- 6 input digit,
- auto-focus,
- dukung paste 6 digit,
- tombol kirim ulang,
- countdown 5 menit,
- tombol kirim ulang nonaktif 60 detik,
- tombol kembali ke register/login.

Aksi:

- kirim OTP,
- jika sukses arahkan ke `/login` dengan pesan berhasil,
- jika OTP salah tampilkan inline error,
- jika kedaluwarsa tampilkan opsi kirim ulang,
- jika terlalu banyak percobaan tampilkan opsi kirim ulang.

### Login

Route: `/login`

Field:

- email kampus,
- password.

Aksi:

- kirim ke backend,
- simpan token,
- simpan data user,
- redirect ke halaman beranda placeholder,
- jika belum verified arahkan ke `/verify-otp`,
- jika gagal tampilkan pesan generik.

---

## 4. Penyimpanan Token

Rekomendasi MVP:

- simpan token di `sessionStorage`,
- simpan data user minimum di state,
- jangan simpan token di cookie biasa tanpa pengamanan,
- jangan taruh token di URL.

Aturan:

- Belum ada endpoint terproteksi di slice ini; token disimpan untuk fitur berikutnya.
- Saat nanti ada endpoint terproteksi, kirim `Authorization: Bearer <token>`.
- Jangan menyimpan password atau OTP di storage.
- Refresh token belum ada. Jangan implementasikan refresh flow.

Catatan keamanan:

- `localStorage`/`sessionStorage` rentan XSS.
- Untuk MVP, `sessionStorage` cukup.
- Untuk produksi, pertimbangkan httpOnly cookie bersama backend.

---

## 5. Validasi Form

Validasi client-side mengikuti aturan backend, tetapi server tetap sumber kebenaran.

### Email

- wajib,
- harus berakhiran `@mail.unpad.ac.id`,
- tampilkan pesan jelas jika domain salah.

### NPM

- wajib,
- tepat 12 digit angka.

### Password

- wajib,
- 8–72 karakter,
- konfirmasi password harus sama,
- tampilkan toggle lihat password.

### Lainnya

- nama wajib,
- program studi wajib,
- fakultas wajib,
- Terms & Conditions wajib dicentang.

Jangan mengandalkan validasi client saja.

---

## 6. Penanganan Error

| HTTP | Kasus | Tindakan Frontend |
|---|---|---|
| 400 | Field tidak valid | Tampilkan inline error per field |
| 400 | Domain email salah | Tandai field email |
| 400 | OTP salah | Tampilkan error; jika sudah batas, arahkan kirim ulang |
| 400 | OTP kedaluwarsa | Tampilkan tombol kirim ulang |
| 400 | OTP terlalu banyak percobaan | Paksa kirim ulang |
| 401 | Login gagal | Pesan generik, jangan sebut email/password mana yang salah |
| 403 | Akun belum verified | Redirect ke verifikasi OTP |
| 403 | Akun diblokir | Tampilkan pesan, arahkan hubungi admin |
| 409 | Email sudah terdaftar | Tandai field email |
| 409 | NPM sudah terdaftar | Tandai field NPM |
| 429 | Resend cooldown | Tampilkan countdown, nonaktifkan tombol |
| 500 | Gagal kirim email | Tampilkan pesan coba lagi |

Aturan UX:

- Jangan tampilkan stack trace.
- Jangan tampilkan response mentah.
- Jangan menampilkan pesan yang membocorkan email terdaftar saat login/resend.
- Disable tombol saat request berjalan untuk mencegah double submit.

---

## 7. State dan UX

Wajib ada:

- loading state per aksi,
- error state inline,
- success state,
- disabled state saat submit,
- countdown resend,
- countdown OTP kedaluwarsa.

Sebaiknya ada:

- `aria-live` untuk pesan error,
- `autocomplete="one-time-code"` pada input OTP,
- `inputmode="numeric"` pada NPM dan OTP,
- fokus otomatis ke input OTP pertama,
- dukungan paste OTP,

Jangan:

- auto-submit OTP tanpa kendali pengguna,
- menampilkan OTP di UI,
- menyimpan OTP di state global permanen.

---

## 8. Kerja Paralel dengan Backend

Frontend tidak perlu menunggu backend selesai.

Langkah:

1. Buat API client sesuai kontrak di atas.
2. Buat mock response untuk semua endpoint.
3. Buat halaman register, OTP, login.
4. Uji alur dengan mock.
5. Ganti base URL ke backend asli saat endpoint siap.
6. Uji integrasi per endpoint.

Mock minimal:

- register sukses,
- register domain salah,
- register email duplikat,
- verify OTP sukses,
- verify OTP salah,
- verify OTP kedaluwarsa,
- resend sukses,
- resend cooldown,
- login sukses,
- login salah,
- login belum verified.

Koordinasi dengan backend:

- minta CORS mengizinkan `http://localhost:5173`,
- minta akun seed untuk tes,
- minta cara melihat OTP dev,
- minta konfirmasi nama field final,
- minta konfirmasi envelope response final.

---

## 9. Urutan Kerja

- [ ] Setup React + TypeScript + Vite.
- [ ] Setup router.
- [ ] Setup environment `VITE_API_BASE_URL`.
- [ ] Buat API client dan tipe response.
- [ ] Buat mock server atau mock handler.
- [ ] Buat halaman register.
- [ ] Buat halaman verifikasi OTP.
- [ ] Buat halaman login.
- [ ] Buat redirect ke halaman beranda placeholder.
- [ ] Hubungkan ke backend asli.
- [ ] Uji semua error state.
- [ ] Serahkan bukti uji.

---

## 10. Acceptance Frontend

- Register mengirim field yang benar.
- Domain email salah ditolak di client dan server.
- NPM selain 12 digit ditolak.
- Password dan konfirmasi tidak cocok ditolak.
- T&C wajib dicentang.
- OTP 6 digit bisa diisi dan paste.
- Countdown OTP dan resend bekerja.
- Resend cooldown menonaktifkan tombol.
- Login sukses menyimpan token dan redirect ke beranda placeholder.
- Login gagal menampilkan pesan generik.
- Login belum verified mengarahkan ke verifikasi.
- Tidak ada OTP, password, atau hash di UI/storage.
- Tidak ada URL backend hardcode.
- Semua error state ada.

---

## 11. Larangan

- Jangan memanggil Resend langsung dari frontend.
- Jangan membuat OTP sendiri di frontend.
- Jangan menyimpan OTP di storage.
- Jangan menyimpan password di storage.
- Jangan menampilkan OTP.
- Jangan menaruh API key atau secret di frontend.
- Jangan mengubah nama field kontrak.
- Jangan mengerjakan fitur listing/chat/COD/review/admin.
- Jangan menganggap validasi client sebagai pengganti validasi server.

---

## 12. Referensi

- `docs/BACKEND_AUTH.md` — kontrak dan aturan backend.
- `docs/DATABASE_AUTH.md` — skema database.
- `Dokumentasi Teknis_RPL_COD Aja.md` — FR-001, UC-001, NFR-003, NFR-006.
