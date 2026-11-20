import type { ChatMessage, ChatMeetingPoint, ChatRoom } from './chat'
import type { MeetingPoint, Product } from './products'
import type { ChatEvent, ChatSocket } from '../chatSocket'
import { getMockProduct } from './mockProducts'
import { authSession } from '../session'
import { uuid } from '../uuid'

type Out = { status: number; message: string; data?: unknown; code?: string }

export const MOCK_POINTS: MeetingPoint[] = [
  { location_id: 'm1', nama_titik_temu: 'Perpustakaan Pusat', pin_point_notes: 'Lobi Utama', latitude: -6.9266, longitude: 107.7715 },
  { location_id: 'm2', nama_titik_temu: 'Gerbang Lama (Gerlam)', pin_point_notes: 'Pos satpam sisi timur', latitude: -6.9271, longitude: 107.7702 },
  { location_id: 'm3', nama_titik_temu: 'Kantin PPBS', pin_point_notes: 'Dekat tempat duduk dan meja makan', latitude: -6.9259, longitude: 107.7721 },
]

// ---- bus event (pengganti server WebSocket) ----
const listeners = new Set<(roomId: string, ev: ChatEvent) => void>()
const emit = (roomId: string, ev: ChatEvent) => listeners.forEach((l) => l(roomId, ev))

// ---- penyimpanan di memori ----
const me = () => authSession.user()?.user_id ?? 'dev-user'
let rooms: ChatRoom[] = []
const msgs = new Map<string, ChatMessage[]>()
const meetings = new Map<string, ChatMeetingPoint>()
const reviewed = new Set<string>()
let seeded = false
let replyIdx = 0

const mins = (n: number) => new Date(Date.now() - n * 60000).toISOString()
const yesterday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return new Date(d.getTime() - 3 * 3600000).toISOString()
}

const product = (id: string, judul: string, harga: number, sold = false): Product => ({
  product_id: id, judul_produk: judul, kategori: 'Buku', harga, kondisi_barang: 'Used',
  status_stok: sold ? 'Sold' : 'Available', fotos: [],
})

const mk = (room: string, from: string, to: string, text: string, t: string, read = true): ChatMessage => ({
  chat_id: uuid(), room_id: room, sender_id: from, receiver_id: to, teks_pesan: text,
  waktu_kirim: t, status_baca: read ? 'Read' : 'Unread', client_message_id: null,
})

function seed() {
  if (seeded) return
  seeded = true
  const u = me()
  // [dariSaya, teks, waktu, sudahDibaca]
  type Row = [boolean, string, string, boolean?]
  const defs: Array<{ id: string; name: string; seller: boolean; prod: Product; chat: Row[] }> = [
    { id: 'r1', name: 'Raka Aditya', seller: true, prod: product('p2', 'Kalkulator Casio FX-991EX', 185000, true),
      chat: [[false, 'Halo, kalkulatornya masih tersedia?', mins(35)], [true, 'Masih, Kak. Kondisi normal dan lengkap dengan cover.', mins(33)], [false, 'Boleh COD siang ini di kampus?', mins(30), false]] },
    { id: 'r2', name: 'Sinau Gani', seller: false, prod: product('p20', 'Sweater Hitam', 50000), chat: [[true, 'Masih ada kak?', mins(90)], [false, 'OK', mins(80)]] },
    { id: 'r3', name: 'Carlos', seller: true, prod: product('p21', 'Gelas Keramik 1 Set', 45000), chat: [[true, 'Terima kasih ya kak', mins(150)], [false, 'Sama - sama kak!', mins(140), false]] },
    { id: 'r4', name: 'Cindy', seller: false, prod: product('p22', 'Sepatu Hitam', 103000), chat: [[false, 'Baik', yesterday()]] },
    { id: 'r5', name: 'Nania', seller: false, prod: product('p23', 'Jas Lab', 70000), chat: [[false, 'Ohh gitu, oke kak', yesterday()]] },
  ]
  rooms = defs.map((d) => {
    const other = `u-${d.id}`
    const list = d.chat.map(([mine, text, t, read]) =>
      mk(d.id, mine ? u : other, mine ? other : u, text, t, read ?? true))
    msgs.set(d.id, list)
    const last = list[list.length - 1]
    return {
      room_id: d.id, product_id: d.prod.product_id,
      buyer_id: d.seller ? other : u, seller_id: d.seller ? u : other,
      created_at: list[0].waktu_kirim, last_message_at: last.waktu_kirim,
      product: d.prod, last_message: last,
      unread_count: list.filter((m) => m.sender_id !== u && m.status_baca === 'Unread').length,
      counterpart: { user_id: other, nama_lengkap: d.name },
    }
  })
  meetings.set('r1', {
    id: uuid(), room_id: 'r1', meeting_point_id: 'm1', proposed_by: u, status: 'Agreed',
    created_at: mins(22), agreed_at: mins(21), meeting_point: MOCK_POINTS[0],
    custom_latitude: null, custom_longitude: null, pin_point_notes: null,
  })
}

const withMeeting = (r: ChatRoom): ChatRoom => ({ ...r, meeting_point: meetings.get(r.room_id) ?? null })

function append(roomId: string, from: string, text: string, clientId: string | null): ChatMessage {
  const room = rooms.find((r) => r.room_id === roomId)!
  const existing = clientId ? (msgs.get(roomId) ?? []).find((m) => m.client_message_id === clientId) : undefined
  if (existing) return existing // idempoten
  const to = from === room.buyer_id ? room.seller_id : room.buyer_id
  const m = mk(roomId, from, to, text, new Date().toISOString(), false)
  m.client_message_id = clientId
  msgs.set(roomId, [...(msgs.get(roomId) ?? []), m])
  room.last_message = m
  room.last_message_at = m.waktu_kirim
  emit(roomId, { type: 'message.created', data: m })

  if (from === me()) {
    const replies = ['Oke kak, siap 👍', 'Boleh, kabari lagi ya.', 'Baik, noted.']
    setTimeout(() => append(roomId, to, replies[replyIdx++ % replies.length], null), 1200)
  }
  return m
}

export function mockSocket(roomId: string, onEvent: (e: ChatEvent) => void): ChatSocket {
  seed()
  const listener = (rid: string, ev: ChatEvent) => { if (rid === roomId) onEvent(ev) }
  listeners.add(listener)
  const t = setTimeout(() => { onEvent({ type: 'status', data: 'open' }); onEvent({ type: 'auth.ok' }) }, 250)
  return {
    send(text, clientId) { append(roomId, me(), text, clientId); return true },
    markRead() { /* mock: tidak perlu */ },
    close() { clearTimeout(t); listeners.delete(listener) },
  }
}

const ok = (data?: unknown, status = 200): Out => ({ status, message: 'OK', data })
const err = (status: number, message: string, code?: string): Out => ({ status, message, code })

export function mockChatRoute(method: string, path: string, body: unknown): Out | null {
  const [p, qs] = path.split('?')
  const sp = new URLSearchParams(qs ?? '')
  const b = (body ?? {}) as Record<string, unknown>
  if (!/^\/(chat|reviews|reports)|^\/products\/[^/]+\/status$/.test(p)) return null
  seed()

  if (method === 'GET' && p === '/chat/rooms') {
    const items = [...rooms]
      .sort((a, c) => +new Date(c.last_message_at ?? c.created_at) - +new Date(a.last_message_at ?? a.created_at))
      .map(withMeeting)
    return ok({ items, meta: { page: 1, limit: 50, total: items.length, total_page: 1 } })
  }

  if (method === 'POST' && p === '/chat/rooms') {
    const pid = String(b.product_id)
    const found = rooms.find((r) => r.product_id === pid && r.buyer_id === me())
    if (found) return ok(withMeeting(found))
    const d = getMockProduct(pid)
    if (!d) return err(404, 'Produk tidak ditemukan', 'NOT_FOUND')
    if (d.user_id === me()) return err(403, 'Kamu tidak bisa chat dengan lapak sendiri', 'FORBIDDEN')
    const room: ChatRoom = {
      room_id: uuid(), product_id: pid, buyer_id: me(), seller_id: d.user_id,
      created_at: new Date().toISOString(), last_message_at: null, product: d,
      last_message: null, unread_count: 0, counterpart: d.seller,
    }
    rooms.push(room)
    msgs.set(room.room_id, [])
    return ok(room, 201)
  }

  let m = p.match(/^\/chat\/rooms\/([^/]+)\/messages$/)
  if (m && method === 'GET') {
    const all = [...(msgs.get(m[1]) ?? [])].reverse() // terbaru dulu
    const limit = Number(sp.get('limit') ?? 30)
    const before = sp.get('before')
    const start = before ? all.findIndex((x) => x.chat_id === before) + 1 : 0
    const items = all.slice(start, start + limit)
    const more = start + limit < all.length
    return ok({ items, meta: { has_more: more, next_cursor: more ? items[items.length - 1].chat_id : null } })
  }
  if (m && method === 'POST') {
    const text = String(b.teks_pesan ?? '').trim()
    if (!text) return err(400, 'Pesan tidak boleh kosong', 'VALIDATION_ERROR')
    return ok(append(m[1], me(), text, (b.client_message_id as string | null) ?? null), 201)
  }

  m = p.match(/^\/chat\/rooms\/([^/]+)\/meeting-points$/)
  if (m && method === 'POST') {
    const roomId = m[1]
    const mp = MOCK_POINTS.find((x) => x.location_id === b.meeting_point_id)
    const cm: ChatMeetingPoint = {
      id: uuid(), room_id: roomId, meeting_point_id: mp?.location_id ?? null,
      custom_latitude: null, custom_longitude: null, proposed_by: me(), pin_point_notes: null,
      status: 'Proposed', created_at: new Date().toISOString(), agreed_at: null, meeting_point: mp ?? null,
    }
    meetings.set(roomId, cm)
    // Simulasi: lawan bicara menyetujui setelah 2,5 detik
    setTimeout(() => {
      const cur = meetings.get(roomId)
      if (cur && cur.id === cm.id && cur.status === 'Proposed') {
        const agreed = { ...cur, status: 'Agreed' as const, agreed_at: new Date().toISOString() }
        meetings.set(roomId, agreed)
        emit(roomId, { type: 'meeting_point.updated', data: agreed })
      }
    }, 2500)
    return ok(cm, 201)
  }

  m = p.match(/^\/chat\/rooms\/([^/]+)\/meeting-points\/([^/]+)\/agree$/)
  if (m && method === 'POST') {
    const cur = meetings.get(m[1])
    if (!cur || cur.id !== m[2]) return err(404, 'Usulan tidak ditemukan', 'NOT_FOUND')
    const agreed = { ...cur, status: 'Agreed' as const, agreed_at: new Date().toISOString() }
    meetings.set(m[1], agreed)
    return ok(agreed)
  }

  m = p.match(/^\/products\/([^/]+)\/status$/)
  if (m && method === 'PUT') {
    rooms.forEach((r) => { if (r.product_id === m![1] && r.product) r.product = { ...r.product, status_stok: b.status_stok as 'Available' | 'Sold' } })
    return ok({ product_id: m[1], status_stok: b.status_stok })
  }

  if (method === 'POST' && p === '/reviews') {
    const pid = String(b.product_id)
    const sold = rooms.some((r) => r.product_id === pid && r.product?.status_stok === 'Sold')
    if (!sold) return err(403, 'Produk belum berstatus terjual', 'PRODUCT_NOT_SOLD')
    if (reviewed.has(pid)) return err(409, 'Kamu sudah memberi ulasan untuk produk ini', 'REVIEW_ALREADY_EXISTS')
    reviewed.add(pid)
    return ok({ review_id: uuid(), ...b }, 201)
  }

  if (method === 'POST' && p === '/reports') return ok({ report_id: uuid(), status_laporan: 'Pending' }, 201)

  return null
}