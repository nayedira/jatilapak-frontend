import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bookmark, ChevronRight, Edit2, HelpCircle, LogOut, Package, Star, User } from 'react-feather'
import BottomNav from '../components/BottomNav'
import { getProfile, listMyProducts, type UserProfile } from '../lib/api/profile'
import { ApiError } from '../lib/api/client'
import { authSession } from '../lib/session'
import { useLogoutConfirm } from '../hooks/useLogoutConfirm'

export default function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const confirmLogout = useLogoutConfirm()
  const cached = authSession.user()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [counts, setCounts] = useState<{ active: number; sold: number } | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState((location.state as { notice?: string } | null)?.notice ?? '')

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((p) => { if (!cancelled) setProfile(p) })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.httpStatus === 401) {
          authSession.clear()
          navigate('/login', { replace: true })
          return
        }
        setError(err instanceof ApiError ? err.message : 'Gagal memuat profil.')
      })
    // Jumlah listing diambil dari meta.total (limit 1), profil tidak menyertakannya.
    Promise.all([listMyProducts({ status: 'Available', limit: 1 }), listMyProducts({ status: 'Sold', limit: 1 })])
      .then(([a, s]) => { if (!cancelled) setCounts({ active: a.meta?.total ?? 0, sold: s.meta?.total ?? 0 }) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [navigate])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(t)
  }, [notice])

  const name = profile?.nama_lengkap ?? cached?.nama_lengkap ?? 'Mahasiswa'
  const avg = profile?.average_rating ?? null
  const total = profile?.total_reviews ?? 0
  const stars = avg === null ? 0 : Math.round(avg)

  return (
    <div className="app-shell">
      <main className="prof-main">
        {error && <p className="field-error" role="alert" style={{ textAlign: 'center' }}>{error}</p>}

        <div className="prof-avatar">
          {profile?.foto_profil_url ? <img src={profile.foto_profil_url} alt="" /> : <User size={44} color="#C1082E" fill="#C1082E" />}
        </div>
        <h1 className="prof-name">{name}</h1>
        <p className="prof-rating">
          {avg === null ? (
            <span>Belum ada ulasan</span>
          ) : (
            <>
              <span className="stars" role="img" aria-label={`Rating ${avg.toFixed(1)} dari 5`}>
                {'★'.repeat(stars)}<span className="off">{'★'.repeat(5 - stars)}</span>
              </span>{' '}
              {avg.toFixed(1)} ({total} ulasan)
            </>
          )}
        </p>

        <Link to="/profil/ubah" className="prof-edit-btn"><Edit2 size={14} color="#110E0F" /> Ubah Profil</Link>

        <section className="prof-card gray">
          <dl className="prof-dl">
            <div><dt>NAMA</dt><dd>{name}</dd></div>
            <div><dt>NPM</dt><dd>{profile?.npm ?? cached?.npm ?? '-'}</dd></div>
            <div><dt>EMAIL</dt><dd>{profile?.email_kampus ?? cached?.email_kampus ?? '-'}</dd></div>
            <div><dt>SANDI</dt><dd className="dots">• • • • • • •</dd></div>
          </dl>
        </section>

        <section className="prof-card">
          <h2 className="prof-h2">INFORMASI AKUN &amp; JUALAN</h2>
          <div className="metrics">
            <div className="metric"><strong>{counts?.active ?? '–'}</strong><span>Listing Aktif</span></div>
            <div className="metric"><strong>{counts?.sold ?? '–'}</strong><span>Terjual</span></div>
          </div>
        </section>

        <nav className="prof-menu" aria-label="Menu profil">
          <Link to="/profil/lapak" className="menu-item">
            <span className="mi-icon"><Package size={16} color="#110E0F" /></span>
            <span className="mi-text"><strong>Listing Produk Saya</strong><small>Kelola produk &amp; tambah jualan baru</small></span>
            {(counts?.active ?? 0) > 0 && <span className="red-dot" aria-hidden="true" />}
            <ChevronRight size={16} color="#110E0F" />
          </Link>
          <Link to="/profil/ulasan" className="menu-item">
            <span className="mi-icon"><Star size={16} color="#110E0F" /></span>
            <span className="mi-text"><strong>Evaluasi &amp; Review</strong><small>Penilaian dari pembeli</small></span>
            <ChevronRight size={16} color="#110E0F" />
          </Link>
          <button className="menu-item" onClick={() => setNotice('Fitur bookmark akan segera hadir.')}>
            <span className="mi-icon"><Bookmark size={16} color="#110E0F" /></span>
            <span className="mi-text"><strong>Bookmark &amp; Favorit Saya</strong><small>Daftar produk yang tersimpan</small></span>
            <ChevronRight size={16} color="#110E0F" />
          </button>
          <Link to="/bantuan" className="menu-item">
            <span className="mi-icon"><HelpCircle size={16} color="#110E0F" /></span>
            <span className="mi-text"><strong>Pusat Bantuan</strong><small>Panduan aman transaksi JatiLapak</small></span>
            <ChevronRight size={16} color="#110E0F" />
          </Link>
        </nav>

        <button className="prof-logout" onClick={confirmLogout}><LogOut size={16} color="#fff" /> Keluar Akun</button>
      </main>

      {notice && <div className="toast" role="status">{notice}</div>}
      <BottomNav active="profile" />
    </div>
  )
}