import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Clock, Search, X } from 'react-feather'
import { CATEGORIES, listProducts, type Product } from '../lib/api/products'
import { recentSearches } from '../lib/recentSearches'
import { useDebounce } from '../hooks/useDebounce'

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (i < 0) return <>{text}</>
  return <>{text.slice(0, i)}<strong>{text.slice(i, i + q.length)}</strong>{text.slice(i + q.length)}</>
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [recent, setRecent] = useState(recentSearches.get())
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const term = query.trim()
  const debounced = useDebounce(term, 300)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Saran produk: best-effort, error diabaikan agar tidak mengganggu pengetikan.
  useEffect(() => {
    if (!debounced) { setSuggestions([]); return }
    let cancelled = false
    listProducts({ q: debounced, limit: 5 })
      .then((d) => { if (!cancelled) setSuggestions(d.items ?? []) })
      .catch(() => { if (!cancelled) setSuggestions([]) })
    return () => { cancelled = true }
  }, [debounced])

  function submit(t: string) {
    const v = t.trim()
    if (!v) return
    recentSearches.add(v)
    navigate(`/search/results?q=${encodeURIComponent(v)}`)
  }
  const goCategory = (c: string) => navigate(`/search/results?kategori=${encodeURIComponent(c)}`)

  function removeRecent(t: string) {
    recentSearches.remove(t)
    setRecent(recentSearches.get())
  }

  const catMatches = term ? CATEGORIES.filter((c) => c.toLowerCase().includes(term.toLowerCase())) : []

  return (
    <div className="app-shell">
      <header className="search-header">
        <button className="icon-plain" aria-label="Kembali" onClick={() => navigate('/katalog')}>
          <ArrowLeft size={24} color="#110E0F" />
        </button>
        <form className="search-form" role="search" onSubmit={(e: FormEvent) => { e.preventDefault(); submit(query) }}>
          <input ref={inputRef} className="search-input" type="search" enterKeyHint="search"
            aria-label="Cari produk" placeholder="Cari produk..." value={query}
            onChange={(e) => setQuery(e.target.value)} />
        </form>
        <button className="cancel-link" onClick={() => navigate('/katalog')}>Batal</button>
      </header>

      {!term ? (
        <div className="search-body">
          {recent.length > 0 && (
            <>
              <h2 className="section-title">Pencarian Terakhir</h2>
              <ul className="recent-list">
                {recent.map((t) => (
                  <li key={t} className="recent-row">
                    <button className="row-main" onClick={() => submit(t)}>
                      <Clock size={18} color="#110E0F" /> {t}
                    </button>
                    <button className="row-x" aria-label={`Hapus ${t}`} onClick={() => removeRecent(t)}>
                      <X size={16} color="#110E0F" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2 className="section-title">Kategori Populer</h2>
          <div className="chip-row">
            {CATEGORIES.map((c) => <button key={c} className="chip" onClick={() => goCategory(c)}>{c}</button>)}
          </div>
        </div>
      ) : (
        <ul className="suggest-list" aria-label="Saran pencarian">
          {suggestions.map((p) => (
            <li key={p.product_id}>
              <button className="suggest-row" onClick={() => submit(p.judul_produk)}>
                <Search size={18} color="#110E0F" />
                <span className="grow"><Highlight text={p.judul_produk} q={term} /></span>
                <small>Produk</small>
              </button>
            </li>
          ))}
          {catMatches.map((c) => (
            <li key={c}>
              <button className="suggest-row" onClick={() => goCategory(c)}>
                <Search size={18} color="#110E0F" />
                <span className="grow"><Highlight text={c} q={term} /></span>
                <small>Kategori</small>
              </button>
            </li>
          ))}
          {suggestions.length === 0 && catMatches.length === 0 && (
            <li>
              <button className="suggest-row" onClick={() => submit(term)}>
                <Search size={18} color="#110E0F" />
                <span className="grow">Cari &quot;{term}&quot;</span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}