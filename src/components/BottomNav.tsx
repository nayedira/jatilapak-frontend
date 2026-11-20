import { useNavigate } from 'react-router-dom'
import { Home, Search, MessageCircle, User } from 'react-feather'

interface Props { active: 'home' | 'search'; onProfile: () => void }

export default function BottomNav({ active, onProfile }: Props) {
  const navigate = useNavigate()
  const tone = (k: Props['active']) => (active === k ? '#000' : '#969696')
  const weight = (k: Props['active']) => (active === k ? 3 : 2)

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      <button className="nav-btn" aria-label="Beranda" aria-current={active === 'home' ? 'page' : undefined}
        onClick={() => navigate('/home')}>
        <Home size={24} color={tone('home')} strokeWidth={weight('home')} />
      </button>
      <button className="nav-btn" aria-label="Cari" aria-current={active === 'search' ? 'page' : undefined}
        onClick={() => navigate('/katalog')}>
        <Search size={24} color={tone('search')} strokeWidth={weight('search')} />
      </button>
      {/* Halaman pesan belum dibuat di tahap ini */}
      <button className="nav-btn" aria-label="Pesan" disabled>
        <MessageCircle size={24} color="#969696" />
      </button>
      <button className="nav-btn" aria-label="Profil" onClick={onProfile}>
        <User size={24} color="#969696" />
      </button>
    </nav>
  )
}