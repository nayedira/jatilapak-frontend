import type { Product } from './products'
import type { UserProfile } from './profile'
import { authSession } from '../session'
import { uuid } from '../uuid'

type Out = { status: number; message: string; data?: unknown; code?: string }
const ok = (data?: unknown, status = 200): Out => ({ status, message: 'OK', data })
const me = () => authSession.user()?.user_id ?? 'dev-user'

let profile: UserProfile | null = null
let mine: Product[] | null = null

function seed() {
  if (!profile) {
    const u = authSession.user()
    profile = {
      user_id: me(), nama_lengkap: u?.nama_lengkap ?? 'Keisya Rahmawati', npm: u?.npm ?? '140810210045',
      email_kampus: u?.email_kampus ?? 'keisya@mail.unpad.ac.id', program_studi: u?.program_studi ?? 'Teknik Informatika',
      fakultas: u?.fakultas ?? 'FMIPA', role: 'user', status_verifikasi: 'verified',
      tanggal_registrasi: '2026-11-01T00:00:00Z', foto_profil_url: null, bio: '', kontak_darurat: '',
      average_rating: 4.9, total_reviews: 7,
    }
  }
  if (!mine) {
    // 13 produk: 6 tersedia + 7 terjual, mengikuti desain
    const rows: Array<[string, number, 'Available' | 'Sold', string]> = [
      ['Sepatu Putih', 103000, 'Available', 'Pakaian'], ['Sepatu Hitam', 200000, 'Sold', 'Pakaian'],
      ['Outer Coklat', 45000, 'Available', 'Pakaian'], ['Sweater Hijau', 30000, 'Available', 'Pakaian'],
      ['Gelas Kaca', 10000, 'Sold', 'Perabot'], ['Kalkulator Scientific', 150000, 'Sold', 'Elektronik'],
      ['Buku Kalkulus Edisi 8', 80000, 'Available', 'Buku'], ['Meja Lipat', 120000, 'Sold', 'Perabot'],
      ['Hoodie Abu', 65000, 'Sold', 'Pakaian'], ['Rice Cooker Mini', 175000, 'Available', 'Elektronik'],
      ['Lampu Belajar', 35000, 'Sold', 'Perabot'], ['Modul Praktikum', 20000, 'Available', 'Buku'],
      ['Jasa Print Cepat', 5000, 'Sold', 'Jasa'],
    ]
    mine = rows.map(([judul, harga, status, kategori], i) => ({
      product_id: `mine-${i + 1}`, user_id: me(), judul_produk: judul, deskripsi_produk: `Deskripsi ${judul}.`,
      kategori, harga, kondisi_barang: 'Used', status_stok: status, fotos: [],
    }))
  }
}

export function mockProfileRoute(method: string, path: string, body: unknown): Out | null {
  const [p, qs] = path.split('?')
  const sp = new URLSearchParams(qs ?? '')
  const b = (body ?? {}) as Record<string, unknown>
  if (!/^\/(users|uploads|products)/.test(p)) return null
  seed()
  const list = mine!

  if (method === 'GET' && p === '/users/profile') return ok(profile)
  if (method === 'PUT' && p === '/users/profile') {
    profile = {
      ...profile!,
      ...(b.foto_profil_url !== undefined ? { foto_profil_url: b.foto_profil_url as string | null } : {}),
      ...(b.bio !== undefined ? { bio: b.bio as string | null } : {}),
      ...(b.kontak_darurat !== undefined ? { kontak_darurat: b.kontak_darurat as string | null } : {}),
    }
    return ok(profile)
  }

  if (method === 'POST' && p === '/uploads/images') return ok({ url: String(b.url), public_id: uuid() }, 201)

  if (method === 'GET' && /^\/users\/[^/]+\/reviews$/.test(p)) {
    const items = [5, 5, 4].map((s, i) => ({
      review_id: `rv${i}`, product_id: `p${i}`, reviewer_id: `u${i}`, reviewee_id: me(), skor_rating: s,
      teks_ulasan: ['Barang sesuai deskripsi, COD tepat waktu.', 'Penjual ramah dan responsif.', 'Oke, barang bagus.'][i],
      waktu_ulasan: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString(),
    }))
    return ok({ average_rating: 4.9, total_reviews: 7, items, meta: { page: 1, limit: 20, total: 3, total_page: 1 } })
  }

  if (method === 'GET' && p === '/products' && sp.get('mine') === 'true') {
    const st = sp.get('status')
    const all = list.filter((x) => !st || x.status_stok === st)
    const page = Number(sp.get('page') ?? 1)
    const limit = Number(sp.get('limit') ?? 5)
    return ok({
      items: all.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total: all.length, total_page: Math.max(1, Math.ceil(all.length / limit)) },
    })
  }

  if (method === 'POST' && p === '/products') {
    const np: Product = {
      product_id: uuid(), user_id: me(), judul_produk: String(b.judul_produk), deskripsi_produk: String(b.deskripsi_produk),
      kategori: String(b.kategori), harga: Number(b.harga), kondisi_barang: b.kondisi_barang as 'Used' | 'New',
      status_stok: 'Available',
      fotos: ((b.fotos as { url: string; urutan: number; is_primary: boolean }[]) ?? []).map((f) => ({ foto_id: uuid(), ...f })),
    }
    list.unshift(np)
    return ok(np, 201)
  }

  const m = p.match(/^\/products\/([^/]+)(\/status)?$/)
  if (m) {
    const idx = list.findIndex((x) => x.product_id === m[1])
    if (idx >= 0 && method === 'PUT' && !m[2]) {
      list[idx] = {
        ...list[idx], ...(b as Partial<Product>),
        fotos: b.fotos ? (b.fotos as { url: string; urutan: number; is_primary: boolean }[]).map((f) => ({ foto_id: uuid(), ...f })) : list[idx].fotos,
      }
      return ok(list[idx])
    }
    if (idx >= 0 && method === 'DELETE') { list.splice(idx, 1); return ok(null) }
    // Ubah status: perbarui daftar milik sendiri, lalu lanjutkan ke handler chat (return null)
    if (idx >= 0 && method === 'PUT' && m[2]) list[idx] = { ...list[idx], status_stok: b.status_stok as 'Available' | 'Sold' }
  }
  return null
}