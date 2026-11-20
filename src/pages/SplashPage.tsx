import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'react-feather'
import Button from '../components/Button'
import { authSession } from '../lib/session'

// Posisi kolase mengikuti desain (lebar 402), dijangkar kiri/kanan agar rapi di layar lain.
const PHOTOS = [
  { name: '1', style: { left: -51, top: -112, width: 240, height: 320 } },
  { name: '2', style: { right: -46, top: -195, width: 288, height: 192 } },
  { name: '3', style: { right: -37, top: 9, width: 224, height: 288 } },
]

const DESIGN_PANEL_H = 553 // tinggi panel pada desain (kondisi popup)
const MAX_SHIFT = 190 // seberapa jauh kolase turun saat panel penuh
const SNAP_DISTANCE = 60 // jarak tarik minimal untuk berpindah kondisi

export default function SplashPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Dari tombol ✕ di Masuk/Register: langsung ke kondisi popup, tanpa splash.
  const skipIntro = (location.state as { skipIntro?: boolean } | null)?.skipIntro === true

  const [intro, setIntro] = useState(!skipIntro)
  const [collapsed, setCollapsed] = useState(skipIntro) // true = panel naik, tombol terlihat
  const [drag, setDrag] = useState<number | null>(null)
  const [dims, setDims] = useState({ full: 0, collapsed: 0 })

  const shellRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (authSession.token()) { navigate('/home', { replace: true }); return }
    if (!intro) return
    const t = setTimeout(() => setIntro(false), 1500)
    return () => clearTimeout(t)
  }, [intro, navigate])

  // Ukur tinggi layar dan tinggi blok tombol; tinggi panel popup = sisa layar.
  useLayoutEffect(() => {
    if (intro) return
    const shell = shellRef.current
    const actions = actionsRef.current
    if (!shell || !actions) return
    const measure = () => {
      const full = shell.clientHeight
      setDims({ full, collapsed: Math.max(full - actions.offsetHeight, 0) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(shell)
    ro.observe(actions)
    return () => ro.disconnect()
  }, [intro])

  if (intro) {
    return (
      <div className="splash">
        <img className="logo" src="/logo.png" alt="JatiLapak" />
      </div>
    )
  }

  const ready = dims.full > 0
  const base = collapsed ? dims.collapsed : dims.full
  const h = drag === null ? base : Math.min(dims.full, Math.max(dims.collapsed, base + drag))
  const shift = Math.min(h - DESIGN_PANEL_H, MAX_SHIFT)
  const range = dims.full - dims.collapsed
  const p = ready && range > 0 ? (h - dims.collapsed) / range : 1 // 0 = popup, 1 = penuh

  function onDown(e: RPointerEvent<HTMLElement>) {
    startY.current = e.clientY
    moved.current = false
  }
  function onMove(e: RPointerEvent<HTMLElement>) {
    if (startY.current === null) return
    const dy = e.clientY - startY.current
    if (!moved.current) {
      if (Math.abs(dy) < 8) return
      moved.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setDrag(dy)
  }
  function onUp(e: RPointerEvent<HTMLElement>) {
    if (startY.current === null) return
    const dy = e.clientY - startY.current
    startY.current = null
    if (moved.current) {
      if (collapsed && dy > SNAP_DISTANCE) setCollapsed(false) // tarik ke bawah: kembali
      else if (!collapsed && dy < -SNAP_DISTANCE) setCollapsed(true) // tarik ke atas: buka tombol
    }
    setDrag(null)
  }
  function onCancel() {
    startY.current = null
    setDrag(null)
  }

  return (
    <div className="onboard" ref={shellRef}>
      <section
        className={`onboard-panel${drag !== null ? ' dragging' : ''}`}
        style={{ height: ready ? h : '100%' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <div className="onboard-collage" aria-hidden="true" style={{ transform: `translateY(${ready ? shift : MAX_SHIFT}px)` }}>
          {PHOTOS.map((ph) => (
            <div key={ph.name} className="polaroid" style={ph.style}>
              <img src={`/onboarding/${ph.name}.jpg`} alt="" draggable={false}
                onError={(e) => { e.currentTarget.style.display = 'none' }} />
            </div>
          ))}
        </div>

        <div className="onboard-title">
          <p className="onboard-brand">JatiLapak</p>
          <h1>Jual gampang,<br />beli hemat,<br />COD Aja!</h1>
        </div>

        <button className="onboard-next" aria-label="Lanjut"
          style={{ opacity: p, pointerEvents: p > 0.5 ? 'auto' : 'none' }}
          tabIndex={collapsed ? -1 : 0}
          onClick={() => setCollapsed(true)}>
          <ChevronDown size={26} color="#fff" strokeWidth={2.5} />
        </button>

        <button className="grabber" aria-label="Tarik ke bawah untuk kembali"
          style={{ opacity: 1 - p, pointerEvents: p < 0.5 ? 'auto' : 'none' }}
          tabIndex={collapsed ? 0 : -1}
          onClick={() => setCollapsed(false)}>
          <span />
        </button>
      </section>

      <div className={`onboard-actions${collapsed ? '' : ' is-hidden'}`} ref={actionsRef}>
        <p className="onboard-desc">Masuk atau Daftar akun baru<br />dengan verifikasi akun kampus</p>
        <Button size="lg" onClick={() => navigate('/register')}>Daftar</Button>
        <Button size="lg" variant="dark" onClick={() => navigate('/login')}>Masuk</Button>
        <a href="#" className="onboard-link" onClick={(e) => e.preventDefault()}>Syarat &amp; Ketentuan</a>
      </div>
    </div>
  )
}