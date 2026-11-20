import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import ProductCard from '../components/ProductCard'
import { Bell, MapPin } from 'react-feather'
import { listProducts, listMeetingPoints, type Product, type MeetingPoint } from '../lib/api/products'
import { ApiError } from '../lib/api/client'
import { authSession } from '../lib/session'

export default function HomePage() {
  const navigate = useNavigate()
  const user = authSession.user()

  const [products, setProducts] = useState<Product[]>([])
  const [point, setPoint] = useState<MeetingPoint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function logout() {
    authSession.clear()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [prod, mp] = await Promise.all([listProducts(), listMeetingPoints().catch(() => null)])
        if (cancelled) return
        setProducts(prod.items ?? [])
        const pts = Array.isArray(mp) ? mp : mp?.items
        setPoint(pts?.[0] ?? null)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.httpStatus === 401) { logout(); return } // token kedaluwarsa
        setError(err instanceof ApiError ? err.message : 'Gagal memuat produk. Coba lagi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app-shell">
      <header className="app-header">
        <img className="logo" src="/logo.png" alt="JatiLapak" />
        <button className="icon-btn" aria-label="Notifikasi"><Bell size={18} color="#110E0F" /></button>
      </header>

      <main className="app-main">
        <h1 className="greet">Selamat datang{user ? `, ${user.nama_lengkap.split(' ')[0]}` : ''}</h1>

        {point && (
          <section className="cod-card" aria-label="Titik COD">
            <div className="cod-row">
              <div className="cod-icon"><MapPin size={18} color="#0D9488" /></div>
              <div>
                <div className="cod-title">Titik COD dipilih</div>
                <div className="cod-sub">
                  {point.nama_titik_temu}{point.pin_point_notes ? ` · ${point.pin_point_notes}` : ''}
                </div>
              </div>
            </div>
            <div className="cod-note">Sekitar kampus · radius 600 m</div>
          </section>
        )}

        <div className="map-preview" role="img" aria-label="Peta sekitar kampus">
          <div className="map-pin"><MapPin size={16} color="#6f6f6f" /></div>
          <div className="map-chip">Sekitar kampus · radius 600 m</div>
        </div>

        <h2 className="section-title">Rekomendasi</h2>

        {loading && <div className="product-list"><div className="skeleton" /><div className="skeleton" /></div>}
        {!loading && error && <p className="field-error" role="alert">{error}</p>}
        {!loading && !error && products.length === 0 && <p className="empty">Belum ada produk.</p>}
        {!loading && !error && products.length > 0 && (
          <div className="product-list">
            {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
          </div>
        )}
      </main>

      <BottomNav active="home" onProfile={logout} />
    </div>
  )
}