import { useEffect, useState } from 'react'
import { Package, Star, X } from 'react-feather'
import { ApiError } from '../lib/api/client'
import Button from './Button'

interface Props {
  open: boolean
  productName: string
  counterpartName: string
  onClose: () => void
  onSubmit: (score: number, text: string) => Promise<void> // melempar error jika gagal
}

export default function ReviewModal({ open, productName, counterpartName, onClose, onSubmit }: Props) {
  const [score, setScore] = useState(0)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (open) { setScore(0); setText(''); setError('') } }, [open])

  async function submit() {
    if (!score || busy) return
    setBusy(true)
    setError('')
    try {
      await onSubmit(score, text.trim())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengirim ulasan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null
  return (
    <div className="layer">
      <div className="layer-overlay" onClick={onClose} />
      <section className="modal" role="dialog" aria-modal="true" aria-label="Beri ulasan transaksi">
        <div className="modal-head">
          <h2 className="modal-title">Beri Ulasan Transaksi</h2>
          <button className="close-dot" aria-label="Tutup" onClick={onClose}><X size={16} color="#fff" strokeWidth={2.5} /></button>
        </div>

        <div className="txn-row">
          <div className="txn-thumb"><Package size={24} color="#110E0F" /></div>
          <div>
            <p className="txn-name">{productName}</p>
            <p className="txn-who">{counterpartName}</p>
          </div>
        </div>
        <hr className="red-rule" />

        <div className="stars-input" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={score === n} aria-label={`${n} bintang`} onClick={() => setScore(n)}>
              <Star size={38} color={n <= score ? '#C1082E' : '#110E0F'} fill={n <= score ? '#C1082E' : 'none'} />
            </button>
          ))}
        </div>
        <p className="hint-center">Ketuk bintang untuk memberi nilai</p>

        <div className="textarea-box">
          <textarea placeholder="Ceritakan pengalaman transaksimu (opsional)..." maxLength={250}
            value={text} onChange={(e) => setText(e.target.value)} aria-label="Ulasan" />
          <span>{text.length}/250</span>
        </div>
        <p className="hint-left">Ulasan akan ditinjau sistem untuk mencegah kata tidak pantas</p>
        {error && <p className="field-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <Button variant="outline" type="button" onClick={onClose}>Nanti Saja</Button>
          <Button type="button" disabled={!score} loading={busy} onClick={submit}>Kirim Ulasan</Button>
        </div>
      </section>
    </div>
  )
}