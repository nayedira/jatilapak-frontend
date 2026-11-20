import type { ReactNode } from 'react'
import { ArrowLeft, X } from 'react-feather'

interface Props {
  children: ReactNode
  logo?: 'lg' | 'md' | 'none'
  width?: 'card' | 'wide'
  onClose?: () => void // tombol ✕ merah (Masuk/Register)
  onBack?: () => void // panah kembali (OTP)
}

export default function AuthLayout({ children, logo = 'md', width = 'card', onClose, onBack }: Props) {
  return (
    <main className="auth-page">
      <div className="auth-frame">
        {onClose && (
          <button className="close-fab" aria-label="Tutup" onClick={onClose}>
            <X size={22} color="#fff" strokeWidth={3} />
          </button>
        )}
        {onBack && (
          <button className="back-btn" aria-label="Kembali" onClick={onBack}>
            <ArrowLeft size={28} color="#1b1b1b" />
          </button>
        )}
        <div className={`auth-container ${width}`}>
          {logo !== 'none' && <img className={`logo ${logo}`} src="/logo.png" alt="JatiLapak" />}
          {children}
        </div>
      </div>
    </main>
  )
}