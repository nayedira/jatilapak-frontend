import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Flag, Image as ImageIcon, MapPin, User } from 'react-feather'
import {
  getProduct, getSellerRating, listMeetingPoints,
  type MeetingPoint, type ProductDetail, type ProductPhoto, type ReviewSummary,
} from '../lib/api/products'
import { ApiError } from '../lib/api/client'
import { authSession } from '../lib/session'
import { openRoom } from '../lib/api/chat'
import ReportModal from '../components/ReportModal'

const nf = new Intl.NumberFormat('id-ID')

function PhotoCarousel({ photos, title }: { photos: ProductPhoto[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const sorted = [...photos].sort((a, b) => a.urutan - b.urutan)

  function onScroll() {
    const el = ref.current
    if (el && el.clientWidth) setIdx(Math.round(el.scrollLeft / el.clientWidth))
  }
  function go(i: number) {
    const el = ref.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <>
      <div className="carousel" ref={ref} onScroll={onScroll} aria-label={`Foto ${title}`}>
        {sorted.length === 0 ? (
          <div className="slide"><ImageIcon size={56} color="#110E0F" aria-hidden="true" /></div>
        ) : (
          sorted.map((f, i) => (
            <div className="slide" key={f.foto_id}>
              <img src={f.url} alt={`${title}, foto ${i + 1}`} draggable={false} />
            </div>
          ))
        )}
      </div>
      {sorted.length > 1 && (
        <div className="dots">
          {sorted.map((f, i) => (
            <button key={f.foto_id} className="dot" aria-label={`Foto ${i + 1}`}
              aria-current={i === idx} onClick={() => go(i)} />
          ))}
        </div>
      )}
    </>
  )
}

function Stars({ rating }: { rating: ReviewSummary | null }) {
  if (!rating) return null
  if (rating.average_rating === null) return <span className="stars-none">Belum ada ulasan</span>
  const avg = rating.average_rating
  const n = Math.round(avg)
  return (
    <span className="stars" role="img" aria-label={`Rating ${avg.toFixed(1)} dari 5`}>
      {'★'.repeat(n)}<span className="off">{'★'.repeat(5 - n)}</span>
      <small>{avg.toFixed(1)} ({rating.total_reviews})</small>
    </span>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [rating, setRating] = useState<ReviewSummary | null>(null)
  const [points, setPoints] = useState<MeetingPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/katalog'))

  // Produk (wajib)
  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError('')
    getProduct(id)
      .then((p) => { if (!cancelled) setProduct(p) })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.httpStatus === 401) {
          authSession.clear()
          navigate('/login', { replace: true })
          return
        }
        setError(
          err instanceof ApiError && err.httpStatus === 404
            ? 'Produk tidak ditemukan atau sudah dihapus.'
            : err instanceof ApiError ? err.message : 'Gagal memuat produk. Coba lagi.',
        )
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, navigate])

  // Rating penjual dan titik COD (pelengkap: gagal tidak menghalangi halaman)
  const sellerId = product?.user_id
  useEffect(() => {
    if (!sellerId) return
    let cancelled = false
    getSellerRating(sellerId).then((r) => { if (!cancelled) setRating(r) }).catch(() => {})
    listMeetingPoints()
      .then((m) => {
        if (cancelled) return
        const list = Array.isArray(m) ? m : m.items
        setPoints((list ?? []).slice(0, 3))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [sellerId])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3000)
    return () => clearTimeout(t)
  }, [notice])

  const header = (
    <header className="detail-header">
      <button className="icon-plain" aria-label="Kembali" onClick={goBack}>
        <ArrowLeft size={24} color="#1b1b1b" />
      </button>
      <h1>Detail Produk</h1>
      <span />
    </header>
  )

    const [opening, setOpening] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)

    async function startChat() {
      if (!product || opening) return
      setOpening(true)
      try {
        const room = await openRoom(product.product_id)
        navigate(`/chat/${room.room_id}`, { state: { room } })
      } catch (err) {
        setNotice(err instanceof ApiError ? err.message : 'Gagal membuka chat. Coba lagi.')
      } finally {
        setOpening(false)
      }
    }
  if (loading) {
    return (
      <div className="app-shell">
        {header}
        <main className="detail-main">
          <div className="skeleton" style={{ height: 190 }} />
          <div className="skeleton" style={{ height: 24, width: '50%', margin: '20px 0 10px' }} />
          <div className="skeleton" style={{ height: 80 }} />
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="app-shell">
        {header}
        <main className="detail-main">
          <p className="field-error" role="alert" style={{ marginTop: 32, textAlign: 'center' }}>{error || 'Produk tidak ditemukan.'}</p>
          <button className="btn outline" style={{ marginTop: 16 }} onClick={() => navigate('/katalog')}>Kembali ke katalog</button>
        </main>
      </div>
    )
  }

  const me = authSession.user()?.user_id
  const isOwner = product.user_id === me
  const sold = product.status_stok === 'Sold'
  const chatLabel = isOwner ? 'Lapak kamu' : sold ? 'Sudah terjual' : 'Chat Penjual'

  return (
    <div className="app-shell">
      {header}

      <main className="detail-main">
        <PhotoCarousel photos={product.fotos} title={product.judul_produk} />

        <h2 className="detail-title">{product.judul_produk}</h2>
        <p className="detail-price">Rp {nf.format(product.harga)}</p>
        <div className="tags">
          <span className="tag">{product.kategori}</span>
          <span className="tag">{product.kondisi_barang === 'Used' ? 'Pre-loved' : 'Baru'}</span>
          {sold && <span className="tag sold">Terjual</span>}
        </div>

        <h3 className="detail-h">Deskripsi</h3>
        <p className="detail-desc">{product.deskripsi_produk}</p>

        <div className="divider" />

        <div className="seller">
          <div className="avatar">
            {product.seller.foto_profil_url
              ? <img src={product.seller.foto_profil_url} alt="" />
              : <User size={22} color="#757575" aria-hidden="true" />}
          </div>
          <div>
            <p className="seller-name">{product.seller.nama_lengkap}</p>
            <Stars rating={rating} />
          </div>
        </div>

        <div className="divider" />

        <h3 className="cod-head"><MapPin size={16} color="#000" /> Rekomendasi Titik COD</h3>
        {points.length > 0 ? (
          <ul className="cod-list">
            {points.map((p) => (
              <li key={p.location_id}><MapPin size={14} color="#757575" />{p.nama_titik_temu}</li>
            ))}
          </ul>
        ) : (
          <p className="detail-desc">Titik COD akan ditentukan bersama penjual lewat chat.</p>
        )}
      </main>

      {notice && <div className="toast" role="status">{notice}</div>}

      <div className="detail-bar">
        <button className="report-btn" aria-label="Laporkan produk" disabled={isOwner}
          onClick={() => setReportOpen(true)}>
          <Flag size={20} color="#be123c" />
        </button>
        <button className="btn" disabled={isOwner || sold || opening} onClick={startChat}>
          {opening ? 'Membuka…' : chatLabel}
        </button>
      </div>
        <ReportModal open={reportOpen} targetType="product" targetId={product.product_id}
        onClose={() => setReportOpen(false)} onDone={setNotice} />
    </div>
  )
}