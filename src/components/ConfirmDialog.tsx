import { useEffect } from 'react'

interface Props {
  open: boolean
  message: string
  confirmLabel?: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({ open, message, confirmLabel = 'Hapus', busy, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null
  return (
    <div className="layer">
      <div className="layer-overlay" onClick={busy ? undefined : onCancel} />
      <section className="modal small" role="alertdialog" aria-modal="true" aria-label={message}>
        <p className="confirm-text">{message}</p>
        <div className="confirm-actions">
          <button className="btn-mini dark" onClick={onCancel} disabled={busy}>Batal</button>
          <button className="btn-mini" onClick={onConfirm} disabled={busy}>{busy ? 'Menghapus…' : confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}