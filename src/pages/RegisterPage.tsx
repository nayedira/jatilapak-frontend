import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextField from '../components/TextField'
import SelectField from '../components/SelectField'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { register } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { pendingEmail, otpTimer } from '../lib/session'
import { FAKULTAS, prodiFor } from '../data/akademik'
import {
  validateEmail, validateNpm, validatePassword,
  validateConfirm, validateRequired,
} from '../lib/validation'

type Field =
  | 'nama_lengkap' | 'npm' | 'email_kampus' | 'program_studi'
  | 'fakultas' | 'password' | 'confirm' | 'accept_terms'

type Errors = Partial<Record<Field, string>>

const BY_CODE: Record<string, [Field, string]> = {
  EMAIL_DOMAIN_INVALID: ['email_kampus', 'Gunakan email kampus @mail.unpad.ac.id'],
  EMAIL_TAKEN: ['email_kampus', 'Email sudah terdaftar'],
  NPM_INVALID: ['npm', 'NPM harus tepat 12 digit angka'],
  NPM_TAKEN: ['npm', 'NPM sudah terdaftar'],
  PASSWORD_INVALID: ['password', 'Kata sandi 8–72 karakter'],
  TERMS_REQUIRED: ['accept_terms', 'Anda harus menyetujui Syarat & Ketentuan'],
}

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nama_lengkap: '', npm: '', email_kampus: '', program_studi: '',
    fakultas: '', password: '', confirm: '',
  })
  const [accept, setAccept] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k as Field]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  // Ganti fakultas: pilihan prodi ikut di-reset.
  const onFakultas = (v: string) => {
    setForm((f) => ({ ...f, fakultas: v, program_studi: '' }))
    setErrors((e) => ({ ...e, fakultas: undefined, program_studi: undefined }))
  }

  function validate(): Errors {
    return {
      nama_lengkap: validateRequired('Nama lengkap')(form.nama_lengkap),
      npm: validateNpm(form.npm),
      email_kampus: validateEmail(form.email_kampus),
      program_studi: validateRequired('Program studi')(form.program_studi),
      fakultas: validateRequired('Fakultas')(form.fakultas),
      password: validatePassword(form.password),
      confirm: validateConfirm(form.password, form.confirm),
      accept_terms: accept ? undefined : 'Anda harus menyetujui Syarat & Ketentuan',
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setFormError('')

    const v = validate()
    setErrors(v)
    if (Object.values(v).some(Boolean)) return

    setLoading(true)
    try {
      const email = form.email_kampus.trim().toLowerCase()
      await register({
        nama_lengkap: form.nama_lengkap.trim(),
        npm: form.npm,
        email_kampus: email,
        password: form.password,
        program_studi: form.program_studi,
        fakultas: form.fakultas,
        accept_terms: accept,
      })
      pendingEmail.set(email) // hanya email, tidak pernah password
      otpTimer.start()
      navigate('/verify-otp')
    } catch (err) {
      const hit = err instanceof ApiError && err.code ? BY_CODE[err.code] : undefined
      if (hit) setErrors((x) => ({ ...x, [hit[0]]: hit[1] }))
      else setFormError(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout logo="md" onClose={() => navigate('/', { state: { skipIntro: true } })}>
      <form className="auth-card compact" onSubmit={onSubmit} noValidate>
        <h1 className="auth-title">Register</h1>

        {formError && <Alert kind="error">{formError}</Alert>}

        <TextField label="Nama" required autoComplete="name"
          value={form.nama_lengkap} onChange={set('nama_lengkap')} error={errors.nama_lengkap} />

        <TextField label="NPM" required inputMode="numeric" maxLength={12}
          value={form.npm} onChange={(v) => set('npm')(v.replace(/\D/g, ''))} error={errors.npm} />

        <SelectField label="Kampus" required placeholder="Pilih Kampus"
          options={FAKULTAS} value={form.fakultas} onChange={onFakultas} error={errors.fakultas} />

        <SelectField label="Program Studi" required placeholder="Pilih Program Studi"
          options={prodiFor(form.fakultas)} disabled={!form.fakultas}
          value={form.program_studi} onChange={set('program_studi')} error={errors.program_studi} />

        <TextField label="Email" required type="email" autoComplete="email"
          hint="Domain @mail.unpad.ac.id" placeholder="nama@mail.unpad.ac.id"
          value={form.email_kampus} onChange={set('email_kampus')} error={errors.email_kampus} />

        <TextField label="Kata Sandi" required type="password" autoComplete="new-password"
          value={form.password} onChange={set('password')} error={errors.password} />

        <TextField label="Konfirmasi Kata Sandi" required type="password" autoComplete="new-password"
          value={form.confirm} onChange={set('confirm')} error={errors.confirm} />

        <Button type="submit" loading={loading}>Daftar</Button>

        <label className="checkbox">
          <input type="checkbox" checked={accept}
            onChange={(e) => {
              setAccept(e.target.checked)
              if (e.target.checked) setErrors((x) => ({ ...x, accept_terms: undefined }))
            }} />
          <span>
            Dengan mendaftar, saya menyetujui{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Syarat &amp; Ketentuan</a> yang berlaku.
          </span>
        </label>
        <div className="field-error" aria-live="polite">{errors.accept_terms}</div>
      </form>

      <p className="auth-footer">
        Sudah memiliki akun? <Link className="auth-link" to="/login">Masuk</Link>
      </p>
    </AuthLayout>
  )
}