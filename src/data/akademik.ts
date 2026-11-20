// CONTOH untuk pengembangan. Lengkapi dan verifikasi dengan data resmi Unpad sebelum rilis.
export const FAKULTAS_PRODI: Record<string, string[]> = {
  'Fakultas Matematika dan Ilmu Pengetahuan Alam': ['Matematika', 'Statistika', 'Fisika', 'Kimia', 'Biologi', 'Geofisika', 'Teknik Informatika'],
  'Fakultas Ekonomi dan Bisnis': ['Ilmu Ekonomi', 'Manajemen', 'Akuntansi', 'Ekonomi Islam'],
  'Fakultas Hukum': ['Ilmu Hukum'],
  'Fakultas Ilmu Sosial dan Ilmu Politik': ['Administrasi Publik', 'Administrasi Bisnis', 'Hubungan Internasional', 'Ilmu Kesejahteraan Sosial', 'Ilmu Pemerintahan'],
  'Fakultas Ilmu Budaya': [],
  'Fakultas Ilmu Komunikasi': [],
  'Fakultas Psikologi': ['Psikologi'],
  'Fakultas Pertanian': [],
  'Fakultas Peternakan': [],
  'Fakultas Perikanan dan Ilmu Kelautan': [],
  'Fakultas Teknologi Industri Pertanian': [],
  'Fakultas Teknik Geologi': ['Teknik Geologi'],
  'Fakultas Farmasi': ['Farmasi'],
  'Fakultas Kedokteran': [],
  'Fakultas Kedokteran Gigi': ['Kedokteran Gigi'],
  'Fakultas Keperawatan': ['Keperawatan'],
}

export const FAKULTAS = Object.keys(FAKULTAS_PRODI)

// "Lainnya" selalu tersedia agar pendaftaran tidak buntu bila prodi belum terdaftar.
export const prodiFor = (fakultas: string) =>
  fakultas ? [...(FAKULTAS_PRODI[fakultas] ?? []), 'Lainnya'] : []