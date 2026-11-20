import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextField from '../components/TextField'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { login } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { authSession, pendingEmail, otpTimer } from '../lib/session'
import { validateEmail } from '../lib/validation'

const GENERIC_ERROR = 'Email atau kata sandi salah.'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const justVerified = (location.state as { verified?: boolean } | null)?.verified === true

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [forgotInfo, setForgotInfo] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setFormError('')

    const v = {
      email: validateEmail(email),
      // Saat login cukup cek wajib diisi; aturan 8–72 hanya relevan saat register.
      password: password ? undefined : 'Kata sandi wajib diisi',
    }
    setErrors(v)
    if (v.email || v.password) return

    setLoading(true)
    const clean = email.trim().toLowerCase()
    try {
      const data = await login({ email_kampus: clean, password })
      authSession.save(data.token, data.user)
      navigate('/home', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 403) {
        if (err.code === 'NOT_VERIFIED') {
          pendingEmail.set(clean)
          otpTimer.clear()
          navigate('/verify-otp')
          return
        }
        setFormError('Akun kamu diblokir. Silakan hubungi admin JatiLapak.')
      } else if (err instanceof ApiError && err.httpStatus === 401) {
        setFormError(GENERIC_ERROR) // generik: tidak menyebut mana yang salah
      } else if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Terjadi kesalahan. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout logo="lg" onClose={() => navigate('/', { state: { skipIntro: true } })}>
      <form className="auth-card roomy" onSubmit={onSubmit} noValidate>
        <h1 className="auth-title">Masuk</h1>

        {justVerified && !formError && <Alert kind="success">Verifikasi berhasil! Silakan masuk.</Alert>}
        {formError && <Alert kind="error">{formError}</Alert>}

        <TextField label="Email" type="email" autoComplete="email" required
          value={email} onChange={setEmail} error={errors.email} />

        <TextField label="Kata Sandi" type="password" autoComplete="current-password" required
          value={password} onChange={setPassword} error={errors.password} />

        <Button type="submit" loading={loading}>Masuk</Button>

        <button type="button" className="text-link" onClick={() => setForgotInfo(true)}>
          Lupa Kata Sandi?
        </button>
        {forgotInfo && (
          <p className="muted-note" role="status">
            Fitur lupa kata sandi belum tersedia. Silakan hubungi admin JatiLapak.
          </p>
        )}
      </form>

      <p className="auth-footer">
        Belum memiliki akun? <Link className="auth-link" to="/register">Daftar</Link>
      </p>
    </AuthLayout>
  )
}