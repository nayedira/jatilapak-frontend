export const SUPPORT_EMAIL = 'support@jatilapak.unpad.ac.id'
// Isi di .env: VITE_SUPPORT_WA=628xxxxxxxxxx (format internasional tanpa +)
export const SUPPORT_WA = (import.meta.env.VITE_SUPPORT_WA as string | undefined) ?? ''
export const SUPPORT_HOURS = 'Jam operasional admin: 08.00 - 21.00 WIB (Senin - Minggu)'

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Bagaimana cara menentukan lokasi COD yang aman di Jatinangor?',
    a: 'Buka chat dengan lawan transaksi, tekan "Pilih Lokasi COD", lalu pilih titik rekomendasi seperti Gerbang Lama, Kantin PPBS, atau Perpustakaan. Pilih area ramai dan bertemu di siang hari.',
  },
  {
    q: 'Apakah bisa bertransaksi dengan mahasiswa luar Unpad?',
    a: 'Tidak. Hanya akun dengan email @mail.unpad.ac.id yang sudah terverifikasi OTP yang bisa bertransaksi di JatiLapak.',
  },
  {
    q: 'Bagaimana cara melaporkan penipuan atau akun fiktif?',
    a: 'Buka halaman produk lalu tekan ikon bendera, atau buka menu ⋮ di chat dan pilih Laporkan. Pilih alasan dan jelaskan kejadiannya. Tim moderasi akan meninjau laporanmu.',
  },
  {
    q: 'Bagaimana cara menandai barang terjual dan memberi ulasan?',
    a: 'Setelah COD selesai, penjual membuka chat, menu ⋮, lalu "Tandai Terjual". Setelah itu penjual dan pembeli bisa memberi rating dan ulasan.',
  },
]
