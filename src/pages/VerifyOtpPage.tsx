import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import OtpInput from '../components/OtpInput'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { verifyOtp, resendOtp } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { pendingEmail, otpTimer } from '../lib/session'
import { useCountdown, formatMMSS } from '../hooks/useCountdown'

const EMPTY = ['', '', '', '', '', '']

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const email = pendingEmail.get()

  const [digits, setDigits] = useState<string[]>(EMPTY)
  const [timers, setTimers] = useState(otpTimer.get())
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [locked, setLocked] = useState(false) // terlalu banyak percobaan: wajib kirim ulang
  const [otpError, setOtpError] = useState('')
  const [info, setInfo] = useState('')

  const expiresIn = useCountdown(timers.expiresAt)
  const resendIn = useCountdown(timers.resendAt)
  const expired = expiresIn === 0
  const code = digits.join('')

  // Tanpa email, tidak ada yang bisa diverifikasi.
  useEffect(() => {
    if (!email) navigate('/register', { replace: true })
  }, [email, navigate])

  if (!email) return null

  const syncTimers = () => setTimers(otpTimer.get())
  const canVerify = code.length === 6 && !expired && !locked && !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canVerify) return // tidak ada auto-submit; hanya lewat tombol/Enter
    setOtpError('')
    setInfo('')
    setLoading(true)
    try {
      await verifyOtp({ email_kampus: email!, otp: code })
      pendingEmail.clear()
      otpTimer.clear()
      navigate('/login', { state: { verified: true }, replace: true })
    } catch (err) {
      setDigits(EMPTY)
      if (err instanceof ApiError) {
        if (err.code === 'OTP_EXPIRED') {
          otpTimer.expireNow()
          syncTimers()
          setOtpError('Kode OTP sudah kedaluwarsa. Kirim ulang untuk mendapat kode baru.')
        } else if (err.code === 'OTP_ATTEMPTS_EXCEEDED') {
          setLocked(true)
          setOtpError('Terlalu banyak percobaan. Kirim ulang kode untuk melanjutkan.')
        } else {
          setOtpError(err.message)
        }
      } else {
        setOtpError('Terjadi kesalahan. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    if (resendIn > 0 || resending) return
    setOtpError('')
    setInfo('')
    setResending(true)
    try {
      await resendOtp({ email_kampus: email! })
      otpTimer.start()
      syncTimers()
      setDigits(EMPTY)
      setLocked(false)
      setInfo('Kode OTP baru telah dikirim. Cek email kampus kamu.')
        } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 409) {
        // Akun sudah terverifikasi: tidak perlu OTP lagi
        pendingEmail.clear()
        otpTimer.clear()
        navigate('/login', { state: { verified: true }, replace: true })
        return
      }
      if (err instanceof ApiError && err.httpStatus === 429) {
        setInfo('Tunggu beberapa saat sebelum kirim ulang kode.')
      } 
    } finally {
      setResending(false)
    }
  }

    return (
    <AuthLayout logo="none" width="wide" onBack={() => navigate('/register')}>
      <form onSubmit={onSubmit} noValidate>
        <h1 className="otp-title">Verifikasi Kode OTP</h1>
        <p className="otp-desc">
          Masukkan kode OTP yang telah dikirim melalui email <strong>{email}</strong>
        </p>

        {info && <Alert kind="success">{info}</Alert>}

        <OtpInput
          digits={digits}
          onChange={(d) => { setDigits(d); if (otpError) setOtpError('') }}
          disabled={loading || expired || locked}
          invalid={!!otpError}
        />
        <div className="field-error" aria-live="polite">{otpError}</div>

        <p className="otp-meta">
          <strong>Tidak menerima OTP?</strong>{' '}
          <button type="button" className="link-btn" onClick={onResend} disabled={resendIn > 0 || resending}>
            {resending ? 'Mengirim…' : 'Kirim ulang'}
          </button>
          {resendIn > 0 && <> (<span className="timer">{formatMMSS(resendIn)}</span>)</>}
          <br />
          {expired
            ? 'Kode OTP sudah kedaluwarsa.'
            : <>Kode berlaku <span className="timer">{formatMMSS(expiresIn)}</span></>}
        </p>

        <Button type="submit" loading={loading} disabled={!canVerify}>Verifikasi</Button>
      </form>
    </AuthLayout>
  )
}