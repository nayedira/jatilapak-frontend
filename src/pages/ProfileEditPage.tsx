import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, EyeOff, Lock, User } from 'react-feather'
import Button from '../components/Button'
import { getProfile, updateProfile, uploadImage, validateImage, type UserProfile } from '../lib/api/profile'
import { ApiError } from '../lib/api/client'
import { authSession } from '../lib/session'

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const cached = authSession.user()
  const fileRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [bio, setBio] = useState('')
  const [kontak, setKontak] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((p) => { if (cancelled) return; setProfile(p); setBio(p.bio ?? ''); setKontak(p.kontak_darurat ?? '') })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.httpStatus === 401) { authSession.clear(); navigate('/login', { replace: true }); return }
        setError(err instanceof ApiError ? err.message : 'Gagal memuat profil.')
      })
    return () => { cancelled = true }
  }, [navigate])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const bad = validateImage(f)
    if (bad) { setError(bad); return }
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function save() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      let photoUrl = profile?.foto_profil_url ?? null
      if (file) photoUrl = (await uploadImage(file, 'profile')).url
      await updateProfile({ foto_profil_url: photoUrl, bio: bio.trim() || null, kontak_darurat: kontak.trim() || null })
      navigate('/profil', { replace: true, state: { notice: 'Profil berhasil diperbarui.' } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan profil. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const shown = preview || profile?.foto_profil_url

  return (
    <div className="app-shell">
      <main className="edit-main">
        <button className="icon-plain" aria-label="Kembali" onClick={() => navigate('/profil')}><ArrowLeft size={24} color="#110E0F" /></button>

        <div className="edit-avatar-wrap">
          <div className="prof-avatar big">
            {shown ? <img src={shown} alt="Foto profil" /> : <User size={56} color="#C1082E" fill="#C1082E" />}
          </div>
          <button className="cam-btn" aria-label="Ganti foto profil" onClick={() => fileRef.current?.click()}>
            <Camera size={16} color="#110E0F" />
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onPick} />
        </div>

        <h1 className="edit-title">Informasi Akun</h1>
        <p className="edit-sub">Perbarui informasi profil mahasiswa Anda</p>

        <div className="edit-field">
          <label htmlFor="nama">Nama Lengkap</label>
          <div className="edit-input locked"><input id="nama" readOnly value={profile?.nama_lengkap ?? cached?.nama_lengkap ?? ''} /><Lock size={18} color="#C1082E" /></div>
        </div>
        <div className="edit-field">
          <label htmlFor="npm">NPM Mahasiswa</label>
          <div className="edit-input locked"><input id="npm" readOnly value={profile?.npm ?? cached?.npm ?? ''} /><Lock size={18} color="#C1082E" /></div>
        </div>
        <div className="edit-field">
          <label htmlFor="email">Email Kampus Unpad</label>
          <div className="edit-input locked"><input id="email" readOnly value={profile?.email_kampus ?? cached?.email_kampus ?? ''} /><Lock size={18} color="#C1082E" /></div>
        </div>

        <div className="edit-field">
          <label htmlFor="bio">Deskripsi Singkat</label>
          <textarea id="bio" className="edit-textarea" maxLength={500} placeholder="Ceritakan sedikit tentang kamu"
            value={bio} onChange={(e) => setBio(e.target.value)} />
          <small>{bio.length}/500</small>
        </div>
        <div className="edit-field">
          <label htmlFor="kontak">Kontak Darurat</label>
          <div className="edit-input"><input id="kontak" maxLength={30} inputMode="tel" placeholder="Nomor yang bisa dihubungi"
            value={kontak} onChange={(e) => setKontak(e.target.value)} /></div>
        </div>

        <div className="edit-field">
          <label htmlFor="pw">Kata Sandi Baru</label>
          <div className="edit-input locked"><input id="pw" disabled placeholder="Masukkan Password Baru" /><EyeOff size={18} color="#C1082E" /></div>
          <small>Ubah kata sandi belum tersedia.</small>
        </div>

        {error && <p className="field-error" role="alert">{error}</p>}

        <div className="edit-actions">
          <Button variant="outline" type="button" onClick={() => navigate('/profil')} disabled={busy}>Batal</Button>
          <Button type="button" loading={busy} onClick={save}>Simpan</Button>
        </div>
      </main>
    </div>
  )
}