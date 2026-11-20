import { useEffect } from 'react'
import { Star } from 'react-feather'
import { CATEGORIES } from '../lib/api/products'

interface Props {
  open: boolean
  selected: string
  onSelect: (c: string | null) => void
  onClose: () => void
}

export default function CategoryDrawer({ open, selected, onSelect, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="layer">
      <div className="layer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Kategori">
        <div className="drawer-head">
          <span>Cari berdasarkan</span>
          <strong>Kategori</strong>
        </div>
        <button className="drawer-item" aria-current={selected === '' ? 'true' : undefined} onClick={() => onSelect(null)}>
          <Star size={20} color="#110E0F" strokeWidth={2} /> Semua
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} className="drawer-item" aria-current={selected === c ? 'true' : undefined} onClick={() => onSelect(c)}>
            <Star size={20} color="#110E0F" strokeWidth={2} /> {c}
          </button>
        ))}
      </aside>
    </div>
  )
}