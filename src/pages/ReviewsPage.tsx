import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'react-feather'
import Button from '../components/Button'
import { getReviews, type Review } from '../lib/api/profile'
import type { PageMeta } from '../lib/api/products'
import { ApiError } from '../lib/api/client'
import { authSession } from '../lib/session'

export default function ReviewsPage() {
  const navigate = useNavigate()
  const me = authSession.user()?.user_id
  const [items, setItems] = useState<Review[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [avg, setAvg] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!me) return
    let cancelled = false
    getReviews(me, 1)
      .then((d) => { if (cancelled) return; setItems(d.items ?? []); setMeta(d.meta ?? null); setAvg(d.average_rating); setTotal(d.total_reviews) })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.httpStatus === 401) { authSession.clear(); navigate('/login', { replace: true }); return }
        setError(err instanceof ApiError ? err.message : 'Gagal memuat ulasan.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [me, navigate])

  async function loadMore() {
    if (!me || !meta) return
    setMore(true)
    try {
      const d = await getReviews(me, meta.page + 1)
      setItems((p) => [...p, ...(d.items ?? [])])
      setMeta(d.meta)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat ulasan.')
    } finally {
      setMore(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="detail-header">
        <button className="icon-plain" aria-label="Kembali" onClick={() => navigate('/profil')}><ArrowLeft size={24} color="#1b1b1b" /></button>
        <h1>Evaluasi &amp; Review</h1>
        <span />
      </header>
      <main className="detail-main" style={{ paddingBottom: 32 }}>
        {loading && <div className="skeleton" style={{ height: 80 }} />}
        {error && <p className="field-error" role="alert">{error}</p>}
        {!loading && !error && (
          <>
            <div className="prof-card gray" style={{ textAlign: 'center', marginBottom: 16 }}>
              <strong style={{ fontSize: '1.6rem' }}>{avg === null ? '–' : avg.toFixed(1)}</strong>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>{total} ulasan</p>
            </div>
            {items.length === 0 && <p className="empty">Belum ada ulasan.</p>}
            <ul className="review-list">
              {items.map((r) => (
                <li key={r.review_id}>
                  <span className="stars" role="img" aria-label={`${r.skor_rating} dari 5`}>
                    {'★'.repeat(r.skor_rating)}<span className="off">{'★'.repeat(5 - r.skor_rating)}</span>
                  </span>
                  <p>{r.teks_ulasan}</p>
                  <small>{new Date(r.waktu_ulasan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
                </li>
              ))}
            </ul>
            {meta && meta.page < meta.total_page && (
              <Button variant="outline" loading={more} onClick={loadMore}>Muat lebih banyak</Button>
            )}
          </>
        )}
      </main>
    </div>
  )
}