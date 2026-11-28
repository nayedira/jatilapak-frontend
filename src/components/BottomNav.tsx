import { useNavigate } from 'react-router-dom'
import { Home, Search, MessageCircle, User } from 'react-feather'

type Tab = 'home' | 'search' | 'chat' | 'profile'
interface Props { active: Tab }

export default function BottomNav({ active }: Props) {
  const navigate = useNavigate()
  const tone = (k: Tab) => (active === k ? '#000' : '#969696')
  const weight = (k: Tab) => (active === k ? 3 : 2)
  const cur = (k: Tab) => (active === k ? 'page' : undefined)

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      <button className="nav-btn" aria-label="Beranda" aria-current={cur('home')} onClick={() => navigate('/home')}>
        <Home size={24} color={tone('home')} strokeWidth={weight('home')} />
      </button>
      <button className="nav-btn" aria-label="Cari" aria-current={cur('search')} onClick={() => navigate('/katalog')}>
        <Search size={24} color={tone('search')} strokeWidth={weight('search')} />
      </button>
      <button className="nav-btn" aria-label="Pesan" aria-current={cur('chat')} onClick={() => navigate('/pesan')}>
        <MessageCircle size={24} color={tone('chat')} strokeWidth={weight('chat')} />
      </button>
      <button className="nav-btn" aria-label="Profil" aria-current={cur('profile')} onClick={() => navigate('/profil')}>
        <User size={24} color={tone('profile')} strokeWidth={weight('profile')} />
      </button>
    </nav>
  )
}