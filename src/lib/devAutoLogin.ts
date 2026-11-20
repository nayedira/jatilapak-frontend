import { authSession } from './session'

// Hanya untuk development dengan mock. Tidak aktif di build produksi.
export function devAutoLogin() {
  const on =
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_MOCK === 'true' &&
    import.meta.env.VITE_DEV_AUTOLOGIN === 'true'
  if (!on || authSession.token()) return

  authSession.save('dev-token', {
    user_id: 'dev-user',
    nama_lengkap: 'Dev Mahasiswa',
    npm: '140810240001',
    email_kampus: 'dev@mail.unpad.ac.id',
    program_studi: 'Teknik Informatika',
    fakultas: 'FMIPA',
    role: 'user',
    status_verifikasi: 'verified',
    tanggal_registrasi: '2026-11-01T00:00:00Z',
  })
}