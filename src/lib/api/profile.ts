import { request, requestForm } from './client'
import { authSession } from '../session'
import { setProductStatus } from './chat'
import type { AuthUser } from './types'
import type { Condition, PageMeta, Product } from './products'

const tok = () => authSession.token()

export interface UserProfile extends AuthUser {
  foto_profil_url?: string | null
  bio?: string | null
  kontak_darurat?: string | null
  average_rating?: number | null // null jika belum ada ulasan
  total_reviews?: number
}

export const getProfile = () => request<UserProfile>('GET', '/users/profile', undefined, tok())

export const updateProfile = (b: { foto_profil_url?: string | null; bio?: string | null; kontak_darurat?: string | null }) =>
  request<UserProfile>('PUT', '/users/profile', b, tok())

// ---- unggah gambar (maks 2 MB; jpg/png/webp) ----
export type UploadPurpose = 'product' | 'profile' | 'report'
const MAX_BYTES = 2 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImage(file: File): string | undefined {
  if (!TYPES.includes(file.type)) return 'Format foto harus JPG, PNG, atau WebP.'
  if (file.size > MAX_BYTES) return 'Ukuran foto maksimal 2 MB.'
}

export function uploadImage(file: File, purpose: UploadPurpose) {
  const form = new FormData()
  form.append('file', file)
  form.append('purpose', purpose)
  return requestForm<{ url: string; public_id: string }>('/uploads/images', form, tok())
}

// ---- listing milik sendiri ----
export interface ProductInput {
  judul_produk: string
  deskripsi_produk: string
  kategori: string
  harga: number
  kondisi_barang: Condition
  fotos: { url: string; urutan: number; is_primary: boolean }[]
}

// CATATAN: kontrak belum punya filter "produk saya". `mine=true` perlu ditambahkan backend.
// Sementara hasil juga disaring di klien berdasarkan user_id sebagai pengaman.
export function listMyProducts(o: { status?: 'Available' | 'Sold'; page?: number; limit?: number } = {}) {
  const me = authSession.user()?.user_id
  const p = new URLSearchParams({ mine: 'true', page: String(o.page ?? 1), limit: String(o.limit ?? 5) })
  if (o.status) p.set('status', o.status)
  return request<{ items: Product[]; meta: PageMeta }>('GET', `/products?${p.toString()}`, undefined, tok()).then((d) => ({
    ...d,
    items: (d.items ?? []).filter((x) => !x.user_id || x.user_id === me),
  }))
}

export const createProduct = (b: ProductInput) => request<Product>('POST', '/products', b, tok())
export const updateProduct = (id: string, b: Partial<ProductInput>) =>
  request<Product>('PUT', `/products/${encodeURIComponent(id)}`, b, tok())
export const deleteProduct = (id: string) =>
  request<unknown>('DELETE', `/products/${encodeURIComponent(id)}`, undefined, tok())
export { setProductStatus }

// ---- ulasan ----
export interface Review {
  review_id: string
  product_id: string
  reviewer_id: string
  reviewee_id: string
  skor_rating: number
  teks_ulasan: string
  waktu_ulasan: string
}
export const getReviews = (userId: string, page = 1, limit = 20) =>
  request<{ average_rating: number | null; total_reviews: number; items: Review[]; meta: PageMeta }>(
    'GET', `/users/${encodeURIComponent(userId)}/reviews?page=${page}&limit=${limit}`, undefined, tok(),
  )