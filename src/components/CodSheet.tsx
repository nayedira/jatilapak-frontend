import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, MapPin, Search, X } from 'react-feather'
import { listMeetingPoints, type MeetingPoint } from '../lib/api/products'
import { ApiError } from '../lib/api/client'
import Button from './Button'

interface Props {
  open: boolean
  busy: boolean
  onClose: () => void
  onConfirm: (pointId: string) => void
}

export default function CodSheet({ open, busy, onClose, onConfirm }: Props) {
  const [points, setPoints] = useState<MeetingPoint[]>([])
  const [selected, setSelected] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError('')
    listMeetingPoints()
      .then((m) => {
        if (cancelled) return
        const list = Array.isArray(m) ? m : m.items ?? []
        setPoints(list)
        setSelected((s) => s || list[0]?.location_id || '')
      })
      .catch((e) => { if (!cancelled) setError(e instanceof ApiError ? e.message : 'Gagal memuat titik temu.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const shown = useMemo(
    () => points.filter((p) => p.nama_titik_temu.toLowerCase().includes(q.trim().toLowerCase())),
    [points, q],
  )
  const chosen = points.find((p) => p.location_id === selected)
  const mapsUrl = chosen
    ? `https://www.google.com/maps/search/?api=1&query=${chosen.latitude},${chosen.longitude}`
    : undefined

  if (!open) return null
  return (
    <div className="layer">
      <div className="layer-overlay" onClick={onClose} />
      <section className="sheet tall" role="dialog" aria-modal="true" aria-label="Pilih titik temu COD">
        <div className="sheet-grab" aria-hidden="true" />
        <div className="sheet-head">
          <div>
            <h2 className="sheet-title big">Pilih Titik Temu COD</h2>
            <p className="sheet-sub">Pilih area ramai dan mudah ditemukan</p>
          </div>
          <button className="close-dot" aria-label="Tutup" onClick={onClose}><X size={18} color="#fff" strokeWidth={2.5} /></button>
        </div>

        <div className="pill-search">
          <input placeholder="cari lokasi" aria-label="Cari lokasi" value={q} onChange={(e) => setQ(e.target.value)} />
          <Search size={16} color="#110E0F" />
        </div>

        <div className="map-preview" role="img" aria-label="Peta sekitar kampus" style={{ marginBottom: 0 }}>
          <div className="map-pin red"><MapPin size={16} color="#fff" /></div>
          <div className="map-chip red">Sekitar kampus · radius 600 m</div>
        </div>

        <div className="cod-options" role="radiogroup" aria-label="Titik temu">
          {loading && <div className="skeleton" style={{ height: 64 }} />}
          {error && <p className="field-error" role="alert">{error}</p>}
          {!loading && !error && shown.length === 0 && <p className="empty">Lokasi tidak ditemukan.</p>}
          {shown.map((p) => (
            <button key={p.location_id} role="radio" aria-checked={selected === p.location_id}
              className="cod-option" onClick={() => setSelected(p.location_id)}>
              <span className="avatar"><MapPin size={20} color="#110E0F" /></span>
              <span className="cod-option-text">
                <strong>{p.nama_titik_temu}</strong>
                {p.pin_point_notes && <small>{p.pin_point_notes}</small>}
              </span>
              <span className={`radio${selected === p.location_id ? ' on' : ''}`} aria-hidden="true" />
            </button>
          ))}
        </div>

        <Button disabled={!selected} loading={busy} onClick={() => onConfirm(selected)}>Konfirmasi Titik</Button>
        {mapsUrl && (
          <a className="gmaps-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} color="#110E0F" /> Buka di Google Maps
          </a>
        )}
      </section>
    </div>
  )
}