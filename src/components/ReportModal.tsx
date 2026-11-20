import { useEffect, useState } from 'react'
import { Flag, X } from 'react-feather'
import { ApiError } from '../lib/api/client'
import { createReport, REPORT_REASONS, type ReportReason } from '../lib/api/chat'
import Button from './Button'

interface Props {
  open: boolean
  targetType: 'user' | 'product'
  targetId: string
  onClose: () => void
  onDone: (message: string) => void
}

export default function ReportModal({ open, targetType, targetId, onClose, onDone }: Props) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (open) { setReason(''); setText(''); setError('') } }, [open])

  async function submit() {
    if (!reason || busy) return
    setBusy(true)
    setError('')
    try {
      // Kontrak mewajibkan deskripsi (min 1 karakter); desain menyebutnya opsional.
      await createReport(targetType, targetId, reason, text.trim() || reason)
      onClose()
      onDone('Laporanmu sudah dikirim ke tim moderasi.')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengirim laporan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null
  return (
    <div className="layer">
      <div className="layer-overlay" onClick={onClose} />
      <section className="modal" role="dialog" aria-modal="true" aria-label="Laporkan">
        <div className="modal-head top">
          <span className="badge-sq"><Flag size={20} color="#fff" /></span>
          <div style={{ flex: 1 }}>
            <h2 className="modal-title">Laporkan</h2>
            <p className="modal-sub">Laporanmu bersifat rahasia dan akan ditinjau tim keamanan kampus.</p>
          </div>
          <button className="close-dot" aria-label="Tutup" onClick={onClose}><X size={16} color="#fff" strokeWidth={2.5} /></button>
        </div>

        <h3 className="modal-h3">Pilih alasan</h3>
        <div className="reason-row" role="radiogroup" aria-label="Alasan laporan">
          {REPORT_REASONS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={reason === r}
              className={`reason${reason === r ? ' on' : ''}`} onClick={() => setReason(r)}>
              <span className="check" aria-hidden="true">{reason === r ? '✓' : ''}</span>
              {r}
            </button>
          ))}
        </div>

        <div className="textarea-box short">
          <textarea placeholder="Jelaskan lebih lanjut (opsional)" maxLength={300}
            value={text} onChange={(e) => setText(e.target.value)} aria-label="Detail laporan" />
          <span>{text.length}/300</span>
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <Button variant="outline" type="button" onClick={onClose}>Batalkan</Button>
          <Button type="button" disabled={!reason} loading={busy} onClick={submit}>Kirim Laporan</Button>
        </div>
      </section>
    </div>
  )
}