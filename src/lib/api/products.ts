import { request } from './client'
import { authSession } from '../session'

// Enum kanonik dari API_CONTRACT §10
export const CATEGORIES = ['Buku', 'Elektronik', 'Perabot', 'Pakaian', 'Makanan', 'Jasa'] as const
export type Condition = 'Used' | 'New'

export interface ProductPhoto { foto_id: string; url: string; urutan: number; is_primary: boolean }

export interface Product {
  product_id: string
  judul_produk: string
  kategori: string
  harga: number
  kondisi_barang: Condition
  status_stok?: 'Available' | 'Sold'
  lokasi?: string // BELUM ada di kontrak; opsional
  fotos: ProductPhoto[]
}

export interface PageMeta { page: number; limit: number; total: number; total_page: number }

export interface ProductQuery {
  q?: string
  kategori?: string
  kondisi?: Condition
  min_price?: number
  max_price?: number
  sort?: string // 'harga' | '-harga' | '-tanggal_unggah' (contoh di openapi)
  page?: number
  limit?: number
}

export interface MeetingPoint {
  location_id: string
  nama_titik_temu: string
  pin_point_notes?: string | null
  latitude: number
  longitude: number
}

function toQuery(q: ProductQuery) {
  const p = new URLSearchParams()
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const listProducts = (q: ProductQuery = {}) =>
  request<{ items: Product[]; meta: PageMeta }>(
    'GET', `/products${toQuery({ page: 1, limit: 20, ...q })}`, undefined, authSession.token(),
  )

export const listMeetingPoints = () =>
  request<MeetingPoint[] | { items: MeetingPoint[] }>('GET', '/meeting-points', undefined, authSession.token())

export interface Seller {
  user_id: string
  nama_lengkap: string
  foto_profil_url?: string | null
}

export interface ProductDetail extends Product {
  user_id: string
  deskripsi_produk: string
  seller: Seller
}

export interface ReviewSummary {
  average_rating: number | null // null jika belum ada ulasan (bukan 0)
  total_reviews: number
}

export const getProduct = (id: string) =>
  request<ProductDetail>('GET', `/products/${encodeURIComponent(id)}`, undefined, authSession.token())

export const getSellerRating = (userId: string) =>
  request<ReviewSummary>('GET', `/users/${encodeURIComponent(userId)}/reviews?page=1&limit=1`, undefined, authSession.token())