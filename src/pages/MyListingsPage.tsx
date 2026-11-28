import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, ArrowLeft, ArrowRight, Check, Edit, Image as ImageIcon, Plus, Trash2 } from 'react-feather'
import ConfirmDialog from '../components/ConfirmDialog'
import ListingFormModal from '../components/ListingFormModal'
import { deleteProduct, listMyProducts } from '../lib/api/profile'
import type { PageMeta, Product } from '../lib/api/products'
import { ApiError } from '../lib/api/client'
import { authSession } from '../lib/session'

const PAGE_SIZE = 5
type Filter = 'all' | 'Available' | 'Sold'
const nf = new Intl.NumberFormat('id-ID')

function pageWindow(cur: number, total: number) {
  const n = 5
  const end = Math.min(total, Math.max(1, cur - 2) + n - 1)
  const start = Math.max(1, end - n + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function MyListingsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Product[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    listMyProducts({ status: filter === 'all' ? undefined : filter, page, limit: PAGE_SIZE })
      .then((d) => { if (cancelled) return; setItems(d.items); setMeta(d.meta ?? null); setSelected(new Set()) })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.httpStatus === 401) { authSession.clear(); navigate('/login', { replace: true }); return }
        setError(err instanceof ApiError ? err.message : 'Gagal memuat listing. Coba lagi.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filter, page, reloadKey, navigate])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(t)
  }, [notice])

  const total = meta?.total ?? 0
  const totalPages = meta?.total_page ?? 1
  const allSelected = items.length > 0 && selected.size === items.length

  const toggle = (id: string) =>
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  function changeFilter(f: Filter) { setFilter(f); setPage(1) }
  function openEdit(p: Product) { setEditing(p); setFormOpen(true) }
  function openCreate() { setEditing(null); setFormOpen(true) }

  async function doDelete() {
    const ids = [...selected]
    setDeleting(true)
    const results = await Promise.allSettled(ids.map((id) => deleteProduct(id)))
    const failed = results.filter((r) => r.status === 'rejected').length
    setDeleting(false)
    setConfirm(false)
    setNotice(failed ? `${ids.length - failed} listing dihapus, ${failed} gagal.` : `${ids.length} listing dihapus.`)
    const remaining = total - (ids.length - failed)
    const lastPage = Math.max(1, Math.ceil(remaining / PAGE_SIZE))
    if (page > lastPage) setPage(lastPage)
    setReloadKey((k) => k + 1)
  }

  return (
    <div className="lapak-shell">
      <header className="lapak-head">
        <button className="icon-plain" aria-label="Kembali" onClick={() => navigate('/profil')}><ArrowLeft size={24} color="#110E0F" /></button>
        <h1><Archive size={24} color="#110E0F" /> Kelola Lapak</h1>
        <span />
      </header>

      <div className="lapak-filters" role="tablist">
        {([['all', 'Semua'], ['Available', 'Tersedia'], ['Sold', 'Terjual']] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={filter === k} className={`tag${filter === k ? ' on' : ''}`} onClick={() => changeFilter(k)}>
            {filter === k && k === 'all' && <Check size={16} color="#fff" strokeWidth={3} />}{label}
          </button>
        ))}
      </div>

      <div className="lapak-toolbar">
        <span>{loading ? '…' : total} Produk</span>
        <div>
          <button className="link-btn plain" onClick={openCreate}><Plus size={14} /> Tambah</button>
          <button className="link-btn plain" aria-pressed={selecting}
            onClick={() => { setSelecting((s) => !s); setSelected(new Set()) }}>
            Kelola <Edit size={18} color="#110E0F" />
          </button>
        </div>
      </div>

      {selecting && items.length > 0 && (
        <label className="select-all">
          <input type="checkbox" checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((p) => p.product_id)))} />
          Pilih semua
        </label>
      )}

      <ul className="lapak-list">
        {loading && <li><div className="skeleton" style={{ height: 64 }} /></li>}
        {!loading && error && <li className="field-error" role="alert">{error}</li>}
        {!loading && !error && items.length === 0 && <li className="empty">Belum ada listing di sini.</li>}
        {!loading && items.map((p) => {
          const photo = p.fotos?.find((f) => f.is_primary) ?? p.fotos?.[0]
          const sold = p.status_stok === 'Sold'
          return (
            <li key={p.product_id} className="lapak-row">
              {selecting && (
                <input type="checkbox" className="lapak-check" aria-label={`Pilih ${p.judul_produk}`}
                  checked={selected.has(p.product_id)} onChange={() => toggle(p.product_id)} />
              )}
              <button className="lapak-main" onClick={() => (selecting ? toggle(p.product_id) : openEdit(p))}>
                <span className="lapak-thumb">{photo ? <img src={photo.url} alt="" /> : <ImageIcon size={24} color="#110E0F" />}</span>
                <span className="lapak-text">
                  <strong>{p.judul_produk}</strong>
                  <span>{p.deskripsi_produk}</span>
                  <b>Rp {nf.format(p.harga)}</b>
                </span>
                <span className={`status-pill${sold ? ' off' : ''}`}>{sold ? 'Terjual' : 'Tersedia'}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="lapak-foot">
        {selecting && (
          <div className="select-bar">
            <span>{selected.size} listing dipilih</span>
            <button className="del-btn" disabled={selected.size === 0} onClick={() => setConfirm(true)}>
              <Trash2 size={18} color="#C1082E" /> Hapus List
            </button>
          </div>
        )}
        <nav className="pager" aria-label="Halaman">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ArrowLeft size={16} /> Previous</button>
          <span>
            {pageWindow(page, totalPages).map((n) => (
              <button key={n} aria-current={n === page ? 'page' : undefined} className={n === page ? 'cur' : ''} onClick={() => setPage(n)}>{n}</button>
            ))}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <ArrowRight size={16} /></button>
        </nav>
      </div>

      {notice && <div className="toast" role="status">{notice}</div>}

      <ConfirmDialog open={confirm} busy={deleting} message={`Apakah Anda yakin untuk menghapus ${selected.size} item List?`}
        onCancel={() => setConfirm(false)} onConfirm={doDelete} />
      <ListingFormModal open={formOpen} product={editing} onClose={() => setFormOpen(false)}
        onSaved={(msg) => { setFormOpen(false); setNotice(msg); setReloadKey((k) => k + 1) }} />
    </div>
  )
}