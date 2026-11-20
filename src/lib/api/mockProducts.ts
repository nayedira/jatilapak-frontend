import type { Product, ProductDetail } from './products'
const p = (id: string, judul: string, kategori: string, harga: number, kondisi: 'Used' | 'New', lokasi?: string) =>
  ({ product_id: id, judul_produk: judul, kategori, harga, kondisi_barang: kondisi, status_stok: 'Available', lokasi, fotos: [] }) as Product

const DATA: Product[] = [
  p('p1', 'Handbag', 'Pakaian', 50000, 'Used', 'Sukawening'),
  p('p2', 'Kalkulator Casio FX-991EX', 'Elektronik', 185000, 'Used', 'Hegarmanah'),
  p('p3', 'Buku', 'Buku', 25000, 'Used'),
  p('p4', 'Cardigan', 'Pakaian', 50000, 'Used'),
  p('p5', 'Celana', 'Pakaian', 15000, 'Used'),
  p('p6', 'Rice Cooker', 'Elektronik', 300000, 'Used'),
  p('p7', 'T-Shirt', 'Pakaian', 20000, 'New'),
  p('p8', 'Hanger baju', 'Perabot', 10000, 'New'),
  p('p9', 'Kalkulus Edisi 9', 'Buku', 185000, 'Used'),
  p('p10', 'Kalkulus Dasar Teknik', 'Buku', 92000, 'Used'),
  p('p11', 'Paket Buku Kalkulus', 'Buku', 240000, 'Used'),
  p('p12', 'Modul Kalkulus Integral', 'Buku', 48000, 'Used'),
  p('p13', 'Kalkulus untuk Sains', 'Buku', 125000, 'New'),
  p('p14', 'Ringkasan Rumus Kalkulus', 'Buku', 35000, 'Used'),
]

export function queryMockProducts(path: string) {
  const sp = new URLSearchParams(path.split('?')[1] ?? '')
  const q = (sp.get('q') ?? '').toLowerCase()
  let items = DATA.filter((x) =>
    (!q || x.judul_produk.toLowerCase().includes(q)) &&
    (!sp.get('kategori') || x.kategori === sp.get('kategori')) &&
    (!sp.get('kondisi') || x.kondisi_barang === sp.get('kondisi')) &&
    (!sp.get('min_price') || x.harga >= Number(sp.get('min_price'))) &&
    (!sp.get('max_price') || x.harga <= Number(sp.get('max_price'))),
  )
  const sort = sp.get('sort')
  if (sort === 'harga') items = [...items].sort((a, b) => a.harga - b.harga)
  if (sort === '-harga') items = [...items].sort((a, b) => b.harga - a.harga)

  const page = Number(sp.get('page') ?? 1)
  const limit = Number(sp.get('limit') ?? 20)
  const total = items.length
  return {
    items: items.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total, total_page: Math.ceil(total / limit) },
  }
}

const swatch = (hex: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='${hex}'/></svg>`,
  )}`

export function getMockProduct(id: string): ProductDetail | null {
  const base = DATA.find((x) => x.product_id === id)
  if (!base) return null
  const colors = id === 'p1' ? ['#c9a27a', '#8b5e3c', '#d6c1a5', '#5c3d2e'] : []
  return {
    ...base,
    user_id: 'seller-1',
    deskripsi_produk: 'Tas preloved baru 1 minggu dipakai, warna coklat, no baret masih bagus. alasan jual karena tidak cocok.',
    seller: { user_id: 'seller-1', nama_lengkap: 'Rabani' },
    fotos: colors.map((c, i) => ({ foto_id: `f${i}`, url: swatch(c), urutan: i + 1, is_primary: i === 0 })),
  }
}