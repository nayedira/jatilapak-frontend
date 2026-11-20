import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, ExternalLink, Image as ImageIcon, MapPin, MoreVertical, Paperclip, Send } from 'react-feather'
import CodSheet from '../components/CodSheet'
import ReviewModal from '../components/ReviewModal'
import ReportModal from '../components/ReportModal'
import {
  agreeMeetingPoint, counterpartOf, createReview, listMessages, listRooms, proposeMeetingPoint,
  sendMessageRest, setProductStatus,
  type ChatMeetingPoint, type ChatMessage, type ChatRoom,
} from '../lib/api/chat'
import { ApiError } from '../lib/api/client'
import { connectChat, type ChatEvent, type ChatSocket } from '../lib/chatSocket'
import { authSession } from '../lib/session'
import { fmtDayLabel, fmtTime, initials, sameDay } from '../lib/format'
import { uuid } from '../lib/uuid'

type UiMessage = ChatMessage & { pending?: boolean; failed?: boolean }
type TItem = { k: 'msg'; t: string; m: UiMessage } | { k: 'cod'; t: string }

const nf = new Intl.NumberFormat('id-ID')
const keyOf = (m: ChatMessage) => (m.client_message_id ? `c:${m.client_message_id}` : `i:${m.chat_id}`)

// Gabungkan pesan; pesan dengan client_message_id yang sama menggantikan versi sementara.
function mergeMessages(prev: UiMessage[], incoming: ChatMessage[]): UiMessage[] {
  const map = new Map<string, UiMessage>()
  prev.forEach((m) => map.set(keyOf(m), m))
  incoming.forEach((m) => map.set(keyOf(m), { ...m }))
  return [...map.values()].sort((a, b) => +new Date(a.waktu_kirim) - +new Date(b.waktu_kirim))
}

const lastServerId = (list: UiMessage[]) => {
  for (let i = list.length - 1; i >= 0; i--) if (!list[i].chat_id.startsWith('tmp-')) return list[i].chat_id
  return null
}

function meetingLabel(mp: ChatMeetingPoint) {
  const name = mp.meeting_point?.nama_titik_temu ?? 'Lokasi pilihan di peta'
  const note = mp.pin_point_notes || mp.meeting_point?.pin_point_notes
  return note ? `${name} · ${note}` : name
}
function mapsUrl(mp: ChatMeetingPoint) {
  const lat = mp.custom_latitude ?? mp.meeting_point?.latitude
  const lng = mp.custom_longitude ?? mp.meeting_point?.longitude
  return lat != null && lng != null ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null
}

export default function ChatRoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const me = authSession.user()?.user_id

  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [meeting, setMeeting] = useState<ChatMeetingPoint | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [error, setError] = useState('')
  const [conn, setConn] = useState<'connecting' | 'open' | 'closed'>('connecting')
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [codOpen, setCodOpen] = useState(false)
  const [codBusy, setCodBusy] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const socketRef = useRef<ChatSocket | null>(null)
  const messagesRef = useRef<UiMessage[]>([])
  messagesRef.current = messages
  const scrollRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  const restore = useRef<{ h: number; top: number } | null>(null)
  const readSent = useRef(new Set<string>())

  const fail = useCallback((err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.httpStatus === 401) {
      authSession.clear()
      navigate('/login', { replace: true })
      return
    }
    setNotice(err instanceof ApiError ? err.message : fallback)
  }, [navigate])

  // ---- muat room + riwayat ----
  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        let r = (location.state as { room?: ChatRoom } | null)?.room
        if (!r || r.room_id !== roomId) {
          const list = await listRooms(1, 100)
          r = list.items.find((x) => x.room_id === roomId)
        }
        if (!r) throw new ApiError(404, 'Percakapan tidak ditemukan.')
        const page = await listMessages(roomId, null, 30)
        if (cancelled) return
        setRoom(r)
        setMeeting(r.meeting_point ?? null)
        setMessages(mergeMessages([], page.items ?? []))
        setHasMore(page.meta?.has_more ?? false)
        setCursor(page.meta?.next_cursor ?? null)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.httpStatus === 401) {
          authSession.clear()
          navigate('/login', { replace: true })
          return
        }
        setError(err instanceof ApiError ? err.message : 'Gagal memuat percakapan. Coba lagi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  // ---- WebSocket ----
  useEffect(() => {
    if (!room) return
    const onEvent = (ev: ChatEvent) => {
      switch (ev.type) {
        case 'status': setConn(ev.data); break
        case 'message.created': setMessages((p) => mergeMessages(p, [ev.data])); break
        case 'message.read':
          setMessages((p) => p.map((m) => (ev.data.chat_ids.includes(m.chat_id) ? { ...m, status_baca: 'Read' } : m)))
          break
        case 'meeting_point.updated': setMeeting(ev.data); break
        case 'error': setNotice(ev.data.message); break
      }
    }
    const s = connectChat(room.room_id, onEvent, () => lastServerId(messagesRef.current))
    socketRef.current = s
    return () => { s.close(); socketRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.room_id])

  // ---- tandai dibaca ----
  useEffect(() => {
    if (!me || conn !== 'open' || document.visibilityState !== 'visible') return
    const ids = messages
      .filter((m) => m.sender_id !== me && m.status_baca === 'Unread' && !readSent.current.has(m.chat_id))
      .map((m) => m.chat_id)
    if (!ids.length) return
    ids.forEach((i) => readSent.current.add(i))
    socketRef.current?.markRead(ids)
    setMessages((p) => p.map((m) => (ids.includes(m.chat_id) ? { ...m, status_baca: 'Read' } : m)))
  }, [messages, conn, me])

  // ---- scroll ----
  function onScroll() {
    const el = scrollRef.current
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (restore.current) {
      el.scrollTop = restore.current.top + (el.scrollHeight - restore.current.h)
      restore.current = null
    } else if (stick.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, meeting?.status, loading])

  async function loadOlder() {
    if (!room || !hasMore || !cursor || loadingOlder) return
    const el = scrollRef.current
    restore.current = { h: el?.scrollHeight ?? 0, top: el?.scrollTop ?? 0 }
    stick.current = false
    setLoadingOlder(true)
    try {
      const page = await listMessages(room.room_id, cursor, 30)
      setMessages((p) => mergeMessages(p, page.items ?? []))
      setHasMore(page.meta?.has_more ?? false)
      setCursor(page.meta?.next_cursor ?? null)
    } catch (err) {
      restore.current = null
      fail(err, 'Gagal memuat pesan lama.')
    } finally {
      setLoadingOlder(false)
    }
  }

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(t)
  }, [notice])

  // ---- kirim pesan ----
  const peer = room ? counterpartOf(room, me) : { id: '', name: '' }

  async function deliver(text: string, clientId: string) {
    if (!room) return
    const viaWs = socketRef.current?.send(text, clientId)
    if (viaWs) {
      // Tanpa balasan dari server dalam 8 detik: tandai gagal (ketuk untuk kirim ulang lewat REST).
      setTimeout(() => {
        setMessages((p) => p.map((m) => (m.client_message_id === clientId && m.pending ? { ...m, pending: false, failed: true } : m)))
      }, 8000)
      return
    }
    try {
      const saved = await sendMessageRest(room.room_id, text, clientId)
      setMessages((p) => mergeMessages(p, [saved]))
    } catch (err) {
      setMessages((p) => p.map((m) => (m.client_message_id === clientId ? { ...m, pending: false, failed: true } : m)))
      fail(err, 'Pesan gagal terkirim.')
    }
  }

  function send() {
    const text = draft.trim()
    if (!text || !room || !me) return
    const clientId = uuid()
    stick.current = true
    setMessages((p) => mergeMessages(p, [{
      chat_id: `tmp-${clientId}`, room_id: room.room_id, sender_id: me, receiver_id: peer.id,
      teks_pesan: text, waktu_kirim: new Date().toISOString(), status_baca: 'Unread',
      client_message_id: clientId, pending: true,
    } as UiMessage]))
    setDraft('')
    void deliver(text, clientId)
  }

  function retry(m: UiMessage) {
    if (!m.client_message_id) return
    setMessages((p) => p.map((x) => (x.client_message_id === m.client_message_id ? { ...x, pending: true, failed: false } : x)))
    // Kirim ulang lewat REST dengan client_message_id yang sama (idempoten).
    sendMessageRest(m.room_id, m.teks_pesan, m.client_message_id)
      .then((saved) => setMessages((p) => mergeMessages(p, [saved])))
      .catch((err) => {
        setMessages((p) => p.map((x) => (x.client_message_id === m.client_message_id ? { ...x, pending: false, failed: true } : x)))
        fail(err, 'Pesan gagal terkirim.')
      })
  }

  // ---- COD, terjual, ulasan ----
  async function proposePoint(pointId: string) {
    if (!room) return
    setCodBusy(true)
    try {
      setMeeting(await proposeMeetingPoint(room.room_id, pointId))
      setCodOpen(false)
    } catch (err) {
      fail(err, 'Gagal mengusulkan titik temu.')
    } finally {
      setCodBusy(false)
    }
  }
  async function agreePoint() {
    if (!room || !meeting) return
    try { setMeeting(await agreeMeetingPoint(room.room_id, meeting.id)) } catch (err) { fail(err, 'Gagal menyetujui titik temu.') }
  }
  async function markSold() {
    setMenuOpen(false)
    if (!room?.product || !window.confirm('Tandai produk ini sudah terjual?')) return
    try {
      await setProductStatus(room.product_id, 'Sold')
      setRoom((r) => (r && r.product ? { ...r, product: { ...r.product, status_stok: 'Sold' } } : r))
      setReviewOpen(true)
    } catch (err) {
      fail(err, 'Gagal mengubah status produk.')
    }
  }
  async function submitReview(score: number, text: string) {
    if (!room) return
    // Kontrak mewajibkan teks ulasan (min 1 karakter); desain menyebutnya opsional.
    await createReview(room.product_id, score, text || 'Tanpa ulasan tertulis.')
    setReviewOpen(false)
    setNotice('Ulasan dan rating berhasil dikirim.')
  }

  // ---- timeline ----
  const timeline = useMemo(() => {
    const items: TItem[] = messages.map((m) => ({ k: 'msg', t: m.waktu_kirim, m }))
    if (meeting && meeting.status !== 'Rejected') items.push({ k: 'cod', t: meeting.agreed_at ?? meeting.created_at })
    return items.sort((a, b) => +new Date(a.t) - +new Date(b.t))
  }, [messages, meeting])

  const isSeller = !!room && room.seller_id === me
  const product = room?.product
  const sold = product?.status_stok === 'Sold'
  const thumb = product?.fotos?.[0]?.url

  const header = (
    <header className="chat-head">
      <button className="icon-plain" aria-label="Kembali" onClick={() => navigate('/pesan')}>
        <ArrowLeft size={24} color="#110E0F" />
      </button>
      <div className="avatar big">{room ? initials(peer.name) : ''}</div>
      <div className="chat-who">
        <p className="chat-name">{room ? peer.name : '…'}</p>
        <p className="chat-status">Mahasiswa terverifikasi</p>
      </div>
      {room && (
        <button className="icon-plain" aria-label="Menu percakapan" aria-haspopup="menu" aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}>
          <MoreVertical size={20} color="#110E0F" />
        </button>
      )}
      {menuOpen && (
        <>
          <div className="menu-scrim" onClick={() => setMenuOpen(false)} />
          <div className="menu" role="menu">
            {isSeller && !sold && <button role="menuitem" onClick={markSold}>Tandai Terjual</button>}
            {sold && <button role="menuitem" onClick={() => { setMenuOpen(false); setReviewOpen(true) }}>Beri Ulasan</button>}
            <button role="menuitem" onClick={() => { setMenuOpen(false); setReportOpen(true) }}>Laporkan</button>
          </div>
        </>
      )}
    </header>
  )

  if (loading || error || !room) {
    return (
      <div className="chat-shell">
        {header}
        <div className="chat-scroll">
          {loading && <div className="skeleton" style={{ height: 60, margin: 24 }} />}
          {!loading && <p className="field-error" role="alert" style={{ padding: 24, textAlign: 'center' }}>{error || 'Percakapan tidak ditemukan.'}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="chat-shell">
      {header}

      {product && (
        <Link to={`/produk/${room.product_id}`} className="product-link">
          {thumb ? <img src={thumb} alt="" /> : <span className="thumb-ph"><ImageIcon size={22} color="#110E0F" /></span>}
          <span className="product-link-text">
            <strong>{product.judul_produk}</strong>
            <span>Rp{nf.format(product.harga)} · Lihat produk</span>
          </span>
          <ChevronRight size={16} color="#110E0F" />
        </Link>
      )}

      {conn === 'closed' && <div className="conn-banner" role="status">Menyambungkan ulang…</div>}

      <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
        <button className="cod-pill" disabled={sold} onClick={() => setCodOpen(true)}>
          <MapPin size={14} color="#110E0F" /> Pilih Lokasi COD
        </button>

        {hasMore && (
          <button className="link-btn older" onClick={loadOlder} disabled={loadingOlder}>
            {loadingOlder ? 'Memuat…' : 'Muat pesan sebelumnya'}
          </button>
        )}
        {messages.length === 0 && <p className="empty">Belum ada pesan. Sapa dulu penjualnya 👋</p>}

        {timeline.map((it, i) => {
          const showDay = i === 0 || !sameDay(it.t, timeline[i - 1].t)
          return (
            <Fragment key={it.k === 'msg' ? keyOf(it.m) : 'cod'}>
              {showDay && <div className="day-sep">{fmtDayLabel(it.t)}</div>}
              {it.k === 'msg' ? (
                <div className={`bubble-row${it.m.sender_id === me ? ' mine' : ''}`}>
                  <div
                    className={`bubble${it.m.pending ? ' pending' : ''}${it.m.failed ? ' failed' : ''}`}
                    role={it.m.failed ? 'button' : undefined}
                    tabIndex={it.m.failed ? 0 : undefined}
                    onClick={it.m.failed ? () => retry(it.m) : undefined}
                    onKeyDown={it.m.failed ? (e) => { if (e.key === 'Enter') retry(it.m) } : undefined}
                  >
                    {it.m.teks_pesan}
                  </div>
                  <span className="stamp">
                    {it.m.failed
                      ? 'Gagal terkirim · ketuk untuk kirim ulang'
                      : `${fmtTime(it.m.waktu_kirim)}${it.m.sender_id === me && it.m.status_baca === 'Read' && !it.m.pending ? ' · Dibaca' : ''}`}
                  </span>
                </div>
              ) : meeting && (
                <div className="cod-msg">
                  <span className="cod-badge"><MapPin size={16} color="#fff" /></span>
                  <div className="cod-msg-text">
                    <strong>
                      {meeting.status === 'Agreed' ? 'Titik COD dipilih'
                        : meeting.proposed_by === me ? 'Menunggu persetujuan' : 'Usulan titik COD'}
                    </strong>
                    <span>{meetingLabel(meeting)}</span>
                    {meeting.status === 'Proposed' && meeting.proposed_by === me && <span className="cod-small">Menunggu {peer.name} menyetujui</span>}
                    {mapsUrl(meeting) && (
                      <a href={mapsUrl(meeting)!} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} color="#fff" /> Buka di Google Maps</a>
                    )}
                  </div>
                  {meeting.status === 'Proposed' && meeting.proposed_by !== me && (
                    <button className="cod-agree" onClick={agreePoint}>Setujui</button>
                  )}
                </div>
              )}
            </Fragment>
          )
        })}

        {sold && product && (
          <p className="sold-line">Produk {product.judul_produk}<br />telah terjual secara COD</p>
        )}
      </div>

      {notice && <div className="toast chat" role="status">{notice}</div>}

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send() }}>
        <button type="button" className="sq-btn" aria-label="Lampirkan file (belum tersedia)" disabled title="Lampiran belum tersedia">
          <Paperclip size={18} color="#fff" />
        </button>
        <input className="chat-field" placeholder="Tulis pesan…" aria-label="Tulis pesan" maxLength={2000}
          value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="sq-btn" aria-label="Kirim" disabled={!draft.trim()}>
          <Send size={18} color="#fff" />
        </button>
      </form>

      <CodSheet open={codOpen} busy={codBusy} onClose={() => setCodOpen(false)} onConfirm={proposePoint} />
      <ReviewModal open={reviewOpen} productName={product?.judul_produk ?? ''} counterpartName={peer.name}
        onClose={() => setReviewOpen(false)} onSubmit={submitReview} />
      <ReportModal open={reportOpen} targetType="user" targetId={peer.id}
        onClose={() => setReportOpen(false)} onDone={setNotice} />
    </div>
  )
}