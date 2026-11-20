import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Search } from 'react-feather'
import ProductTile from '../components/ProductTile'
import BottomSheet from '../components/BottomSheet'
import OptionList from '../components/OptionList'
import TextField from '../components/TextField'
import Button from '../components/Button'
import { CATEGORIES, type Condition } from '../lib/api/products'
import { useProductList } from '../hooks/useProductList'

type SheetKey = 'kategori' | 'harga' | 'kondisi' | 'sort' | null

const KONDISI = [
  { value: '', label: 'Semua' },
  { value: 'Used', label: 'Bekas' },
  { value: 'New', label: 'Baru' },
]
const SORT = [
  { value: '', label: 'Terbaru' },
  { value: 'harga', label: 'Harga terendah' },
  { value: '-harga', label: 'Harga tertinggi' },
]
const KATEGORI = [{ value: '', label: 'Semua' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]
const nf = new Intl.NumberFormat('id-ID')
const digits = (v: string) => v.replace(/\D/g, '')

function SortIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#110E0F" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M18.75 20.9997L21.75 23.9994L24.75 20.9997M21.75 23.9994V12.0006M17.25 15.0003L14.25 12.0006L11.25 15.0003M14.25 12.0006V23.9994" />
    </svg>
  )
}

function PriceForm({ min, max, onApply }: { min: string; max: string; onApply: (min: string, max: string) => void }) {
  const [a, setA] = useState(min)
  const [b, setB] = useState(max)
  const err = a && b && Number(a) > Number(b) ? 'Harga minimum tidak boleh lebih besar dari maksimum' : ''
  return (
    <>
      <div className="price-fields">
        <TextField label="Minimum (Rp)" inputMode="numeric" placeholder="0" value={a} onChange={(v) => setA(digits(v))} />
        <TextField label="Maksimum (Rp)" inputMode="numeric" placeholder="Tanpa batas" value={b} onChange={(v) => setB(digits(v))} />
      </div>
      <div className="field-error" aria-live="polite">{err}</div>
      <div className="sheet-actions">
        <Button type="button" variant="outline" onClick={() => onApply('', '')}>Reset</Button>
        <Button type="button" disabled={!!err} onClick={() => onApply(a, b)}>Terapkan</Button>
      </div>
    </>
  )
}

export default function SearchResultsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const [sheet, setSheet] = useState<SheetKey>(null)

  const q = params.get('q') ?? ''
  const kategori = params.get('kategori') ?? ''
  const kondisi = params.get('kondisi') ?? ''
  const minPrice = params.get('min_price') ?? ''
  const maxPrice = params.get('max_price') ?? ''
  const sort = params.get('sort') ?? ''

  const { items, meta, loading, loadingMore, error, hasMore, loadMore } = useProductList({
    q: q || undefined,
    kategori: kategori || undefined,
    kondisi: (kondisi || undefined) as Condition | undefined,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    sort: sort || undefined,
    limit: 20,
  })

  function setFilter(patch: Record<string, string>) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
    setSheet(null)
  }

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/katalog'))
  const label = q || kategori
  const total = meta?.total ?? 0
  const priceActive = !!(minPrice || maxPrice)
  const priceLabel = priceActive
    ? `${minPrice ? 'Rp' + nf.format(Number(minPrice)) : 'Rp0'} – ${maxPrice ? 'Rp' + nf.format(Number(maxPrice)) : '∞'}`
    : 'Harga'
  const kondisiLabel = KONDISI.find((k) => k.value === kondisi)?.label
  const isEmpty = !loading && !error && items.length === 0

  return (
    <div className="app-shell">
      <header className="search-header results">
        <button className="icon-plain" aria-label="Kembali" onClick={goBack}>
          <ArrowLeft size={24} color="#110E0F" />
        </button>
        <button className="search-field-static" aria-label="Ubah pencarian"
          onClick={() => navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')}>
          <Search size={16} color="#110E0F" />
          <span>{label || 'Cari produk...'}</span>
        </button>
      </header>

      <div className="filter-row">
        <button className={`chip${kategori ? ' active' : ''}`} onClick={() => setSheet('kategori')}>
          {kategori || 'Kategori'} <ChevronDown size={14} />
        </button>
        <button className={`chip${priceActive ? ' active' : ''}`} onClick={() => setSheet('harga')}>
          {priceLabel} <ChevronDown size={14} />
        </button>
        <button className={`chip${kondisi ? ' active' : ''}`} onClick={() => setSheet('kondisi')}>
          {kondisi ? kondisiLabel : 'Kondisi'} <ChevronDown size={14} />
        </button>
        <button className="sort-btn" aria-label="Urutkan" onClick={() => setSheet('sort')}><SortIcon /></button>
      </div>

      {!loading && !error && (
        <div className={`result-count${isEmpty ? ' empty' : ''}`} aria-live="polite">
          {total} hasil{label ? ` untuk '${label}'` : ''}
        </div>
      )}

      {loading && (
        <div className="result-grid">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 170 }} />)}
        </div>
      )}
      {!loading && error && <p className="field-error" role="alert" style={{ padding: '0 20px' }}>{error}</p>}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="result-grid">
            {items.map((p) => <ProductTile key={p.product_id} product={p} variant="result" />)}
          </div>
          {hasMore && (
            <div style={{ padding: '0 20px 32px' }}>
              <Button variant="outline" loading={loadingMore} onClick={loadMore}>Muat lebih banyak</Button>
            </div>
          )}
        </>
      )}

      {isEmpty && (
        <>
          <div className="empty-state">
            <div className="empty-illus"><Search size={48} color="#110E0F" strokeWidth={1.8} /><b>?</b></div>
            <h2 className="section-title" style={{ margin: 0 }}>Produk tidak ditemukan</h2>
            <p className="empty-desc">Coba kata kunci lain atau jelajahi kategori populer di bawah</p>
          </div>
          <div className="popular">
            <h2 className="section-title">Kategori Populer</h2>
            <div className="chip-row">
              {CATEGORIES.map((c) => (
                <button key={c} className="chip solid"
                  onClick={() => navigate(`/search/results?kategori=${encodeURIComponent(c)}`)}>{c}</button>
              ))}
            </div>
          </div>
        </>
      )}

      <BottomSheet open={sheet === 'kategori'} title="Kategori" onClose={() => setSheet(null)}>
        <OptionList value={kategori} options={KATEGORI} onPick={(v) => setFilter({ kategori: v })} />
      </BottomSheet>
      <BottomSheet open={sheet === 'kondisi'} title="Kondisi" onClose={() => setSheet(null)}>
        <OptionList value={kondisi} options={KONDISI} onPick={(v) => setFilter({ kondisi: v })} />
      </BottomSheet>
      <BottomSheet open={sheet === 'sort'} title="Urutkan" onClose={() => setSheet(null)}>
        <OptionList value={sort} options={SORT} onPick={(v) => setFilter({ sort: v })} />
      </BottomSheet>
      <BottomSheet open={sheet === 'harga'} title="Rentang harga" onClose={() => setSheet(null)}>
        <PriceForm min={minPrice} max={maxPrice} onApply={(a, b) => setFilter({ min_price: a, max_price: b })} />
      </BottomSheet>
    </div>
  )
}