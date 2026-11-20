import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, Menu, Search } from 'react-feather'
import BottomNav from '../components/BottomNav'
import CategoryDrawer from '../components/CategoryDrawer'
import ProductTile from '../components/ProductTile'
import Button from '../components/Button'
import { useProductList } from '../hooks/useProductList'
import { useLogoutConfirm } from '../hooks/useLogoutConfirm'

export default function CatalogPage() {
  const navigate = useNavigate()
  const confirmLogout = useLogoutConfirm()
  const [params, setParams] = useSearchParams()
  const kategori = params.get('kategori') ?? ''
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { items, loading, loadingMore, error, hasMore, loadMore } =
    useProductList({ kategori: kategori || undefined, limit: 20 })

  function pickCategory(c: string | null) {
    setParams(c ? { kategori: c } : {}, { replace: true })
    setDrawerOpen(false)
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <button className="icon-plain" aria-label="Buka kategori" onClick={() => setDrawerOpen(true)}>
          <Menu size={28} strokeWidth={3} color="#110E0F" />
        </button>
        <button className="search-pill" onClick={() => navigate('/search')}>
          <span>Cari Barang...</span>
          <Search size={16} color="#110E0F" />
        </button>
        <button className="icon-plain" aria-label="Notifikasi">
          <Bell size={26} color="#110E0F" />
        </button>
      </header>

      <main className="app-main">
        {kategori && (
          <p className="active-filter">
            Kategori: <strong>{kategori}</strong>{' '}
            <button className="link-btn" onClick={() => pickCategory(null)}>Hapus</button>
          </p>
        )}

        {loading && (
          <div className="catalog-grid">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
          </div>
        )}
        {!loading && error && <p className="field-error" role="alert">{error}</p>}
        {!loading && !error && items.length === 0 && <p className="empty">Belum ada produk.</p>}
        {!loading && !error && items.length > 0 && (
          <div className="catalog-grid">
            {items.map((p) => <ProductTile key={p.product_id} product={p} />)}
          </div>
        )}
        {hasMore && (
          <div style={{ marginTop: 16 }}>
            <Button variant="outline" loading={loadingMore} onClick={loadMore}>Muat lebih banyak</Button>
          </div>
        )}
      </main>

      <BottomNav active="search" onProfile={confirmLogout} />
      <CategoryDrawer open={drawerOpen} selected={kategori} onSelect={pickCategory} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}