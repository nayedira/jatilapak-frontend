import { request } from './client'
import { authSession } from '../session'
import type { MeetingPoint, PageMeta, Product, Seller } from './products'

const tok = () => authSession.token()

export type ReadStatus = 'Read' | 'Unread'
export type MeetingStatus = 'Proposed' | 'Agreed' | 'Rejected'

export interface ChatMessage {
  chat_id: string
  room_id: string
  sender_id: string
  receiver_id: string
  teks_pesan: string
  waktu_kirim: string
  status_baca: ReadStatus
  client_message_id?: string | null
}

export interface ChatMeetingPoint {
  id: string
  room_id: string
  meeting_point_id?: string | null
  custom_latitude?: number | null
  custom_longitude?: number | null
  proposed_by: string
  pin_point_notes?: string | null
  status: MeetingStatus
  created_at: string
  agreed_at?: string | null
  meeting_point?: MeetingPoint | null
}

export interface ChatRoom {
  room_id: string
  product_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  last_message_at?: string | null
  product?: Product & { seller?: Seller }
  last_message?: ChatMessage | null
  unread_count?: number
  // BELUM ada di kontrak (lihat catatan): dipakai kalau backend menambahkannya
  counterpart?: { user_id: string; nama_lengkap: string } | null
  meeting_point?: ChatMeetingPoint | null
}

export function counterpartOf(room: ChatRoom, me?: string) {
  const iAmBuyer = room.buyer_id === me
  const id = iAmBuyer ? room.seller_id : room.buyer_id
  const name =
    room.counterpart?.nama_lengkap ??
    (iAmBuyer ? room.product?.seller?.nama_lengkap : undefined) ??
    (iAmBuyer ? 'Penjual' : 'Pembeli')
  return { id, name }
}

export const REPORT_REASONS = ['Akun Fiktif', 'Penipuan', 'Spam', 'Barang Terlarang'] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export const listRooms = (page = 1, limit = 50) =>
  request<{ items: ChatRoom[]; meta: PageMeta }>('GET', `/chat/rooms?page=${page}&limit=${limit}`, undefined, tok())

export const openRoom = (productId: string, otherUserId?: string) =>
  request<ChatRoom>('POST', '/chat/rooms', { product_id: productId, ...(otherUserId ? { other_user_id: otherUserId } : {}) }, tok())

export const listMessages = (roomId: string, before?: string | null, limit = 30) =>
  request<{ items: ChatMessage[]; meta: { has_more: boolean; next_cursor?: string | null } }>(
    'GET',
    `/chat/rooms/${encodeURIComponent(roomId)}/messages?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`,
    undefined,
    tok(),
  )

export const sendMessageRest = (roomId: string, text: string, clientId: string) =>
  request<ChatMessage>('POST', `/chat/rooms/${encodeURIComponent(roomId)}/messages`, { teks_pesan: text, client_message_id: clientId }, tok())

export const proposeMeetingPoint = (roomId: string, meetingPointId: string) =>
  request<ChatMeetingPoint>('POST', `/chat/rooms/${encodeURIComponent(roomId)}/meeting-points`, { meeting_point_id: meetingPointId }, tok())

export const agreeMeetingPoint = (roomId: string, meetingId: string) =>
  request<ChatMeetingPoint>('POST', `/chat/rooms/${encodeURIComponent(roomId)}/meeting-points/${encodeURIComponent(meetingId)}/agree`, undefined, tok())

export const setProductStatus = (productId: string, status: 'Available' | 'Sold') =>
  request<unknown>('PUT', `/products/${encodeURIComponent(productId)}/status`, { status_stok: status }, tok())

export const createReview = (productId: string, score: number, text: string) =>
  request<unknown>('POST', '/reviews', { product_id: productId, skor_rating: score, teks_ulasan: text }, tok())

export const createReport = (targetType: 'user' | 'product', targetId: string, reason: ReportReason, description: string) =>
  request<unknown>('POST', '/reports', { target_type: targetType, target_id: targetId, alasan: reason, deskripsi_laporan: description }, tok())