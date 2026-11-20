import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, User } from 'react-feather'
import BottomNav from '../components/BottomNav'
import { listRooms, counterpartOf, type ChatRoom } from '../lib/api/chat'
import { ApiError } from '../lib/api/client'
import { authSession } from '../lib/session'
import { fmtListTime } from '../lib/format'
import { useLogoutConfirm } from '../hooks/useLogoutConfirm'

export default function MessagesPage() {
  const navigate = useNavigate()
  const confirmLogout = useLogoutConfirm()
  const me = authSession.user()?.user_id

  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)

  useEffect(() => {
    let cancelled = false
    listRooms(1, 50)
      .then((d) => {
        if (cancelled) return
        setRooms([...(d.items ?? [])].sort((a, b) =>
          +new Date(b.last_message_at ?? b.created_at) - +new Date(a.last_message_at ?? a.created_at)))
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.httpStatus === 401) {
          authSession.clear()
          navigate('/login', { replace: true })
          return
        }
        setError(err instanceof ApiError ? err.message : 'Gagal memuat percakapan. Coba lagi.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [navigate])

  const shown = unreadOnly ? rooms.filter((r) => (r.unread_count ?? 0) > 0) : rooms

  return (
    <div className="app-shell">
      <main className="msg-main">
        <header className="msg-head">
          <MessageCircle size={28} color="#110E0F" strokeWidth={1.8} />
          <h1>Pesan</h1>
        </header>

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={!unreadOnly} className={`tab${!unreadOnly ? ' on' : ''}`} onClick={() => setUnreadOnly(false)}>Semua</button>
          <button role="tab" aria-selected={unreadOnly} className={`tab${unreadOnly ? ' on' : ''}`} onClick={() => setUnreadOnly(true)}>Belum Dibaca</button>
        </div>

        {!loading && !error && <p className="conv-count">{shown.length} Percakapan</p>}
        {loading && <div style={{ padding: '16px 24px' }}><div className="skeleton" style={{ height: 80 }} /></div>}
        {!loading && error && <p className="field-error" role="alert" style={{ padding: '16px 24px' }}>{error}</p>}
        {!loading && !error && shown.length === 0 && (
          <p className="empty">{unreadOnly ? 'Tidak ada pesan yang belum dibaca.' : 'Belum ada percakapan. Mulai dari tombol Chat Penjual di halaman produk.'}</p>
        )}

        {shown.map((r) => {
          const { name } = counterpartOf(r, me)
          const unread = (r.unread_count ?? 0) > 0
          return (
            <Link key={r.room_id} to={`/chat/${r.room_id}`} state={{ room: r }} className="conv-row">
              <div className="avatar"><User size={22} color="#110E0F" /></div>
              <div className="conv-main">
                <p className="conv-name">{name}</p>
                <p className="conv-last">{r.last_message?.teks_pesan ?? 'Belum ada pesan'}</p>
                <p className="conv-prod">{r.product?.judul_produk}</p>
              </div>
              <div className="conv-meta">
                <span>{fmtListTime(r.last_message_at ?? r.created_at)}</span>
                {unread && <span className="unread-dot" role="img" aria-label="Belum dibaca" />}
              </div>
            </Link>
          )
        })}
      </main>
      <BottomNav active="chat" onProfile={confirmLogout} />
    </div>
  )
}