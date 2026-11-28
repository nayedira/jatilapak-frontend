import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Mail, MessageSquare, Search, Shield } from 'react-feather'
import { FAQ, SUPPORT_EMAIL, SUPPORT_HOURS, SUPPORT_WA } from '../data/help'

export default function HelpPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return FAQ.filter((f) => !t || f.q.toLowerCase().includes(t) || f.a.toLowerCase().includes(t))
  }, [q])

  return (
    <div className="app-shell">
      <header className="detail-header">
        <button className="icon-plain" aria-label="Kembali" onClick={() => navigate('/profil')}><ArrowLeft size={24} color="#1b1b1b" /></button>
        <h1>Pusat Bantuan</h1>
        <span />
      </header>

      <main className="help-main">
        <section className="help-hero">
          <h2>Halo Kamu!</h2>
          <p>Ada yang bisa kami bantu seputar transaksi &amp; COD aman di JatiLapak?</p>
          <div className="help-search">
            <Search size={16} color="#6b6b6b" />
            <input aria-label="Cari bantuan" placeholder="Cari titik COD, verifikasi SSO, tips aman..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </section>

        <section className="help-safe">
          <span className="safe-badge"><Shield size={18} color="#fff" /></span>
          <div>
            <strong>Selalu Utamakan Safe COD Zone</strong>
            <small>Gunakan titik pantau kampus: Gerlam, Bale Santika, &amp; Perpus.</small>
          </div>
        </section>

        <div className="faq-head"><h2>Pertanyaan Sering Diajukan</h2><small>{FAQ.length} Tanya Jawab</small></div>
        <ul className="faq-list">
          {shown.length === 0 && <li className="empty">Tidak ada hasil untuk “{q}”.</li>}
          {shown.map((f, i) => (
            <li key={f.q}>
              <button className="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span>{f.q}</span>
                <ChevronDown size={18} color="#110E0F" style={{ transform: open === i ? 'rotate(180deg)' : undefined }} />
              </button>
              {open === i && <p className="faq-a">{f.a}</p>}
            </li>
          ))}
        </ul>

        <section className="help-contact">
          {SUPPORT_WA ? (
            <a className="wa-btn" href={`https://wa.me/${SUPPORT_WA}`} target="_blank" rel="noopener noreferrer">
              <MessageSquare size={16} /> Chat CS WhatsApp (Fast Respon)
            </a>
          ) : (
            <span className="wa-btn disabled" aria-disabled="true"><MessageSquare size={16} /> Chat CS WhatsApp (belum diatur)</span>
          )}
          <a className="mail-btn" href={`mailto:${SUPPORT_EMAIL}`}><Mail size={16} /> Email: {SUPPORT_EMAIL}</a>
          <p className="hours"><span className="green-dot" aria-hidden="true" /> {SUPPORT_HOURS}</p>
        </section>
      </main>
    </div>
  )
}