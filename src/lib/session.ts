import type { AuthUser } from './api/types'

const K = { email: 'jl_pending_email', token: 'jl_token', user: 'jl_user' }

export const pendingEmail = {
  set: (v: string) => sessionStorage.setItem(K.email, v),
  get: () => sessionStorage.getItem(K.email),
  clear: () => sessionStorage.removeItem(K.email),
}

export const authSession = {
  save(token: string, user: AuthUser) {
    sessionStorage.setItem(K.token, token)
    sessionStorage.setItem(K.user, JSON.stringify(user))
  },
  token: () => sessionStorage.getItem(K.token),
  user(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem(K.user)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  },
  clear() {
    sessionStorage.removeItem(K.token)
    sessionStorage.removeItem(K.user)
  },
}

const T = { expires: 'jl_otp_expires', resend: 'jl_otp_resend' }

export const otpTimer = {
  // Panggil saat OTP baru dikirim (setelah register sukses atau resend sukses).
  start() {
    const now = Date.now()
    sessionStorage.setItem(T.expires, String(now + 5 * 60 * 1000)) // kedaluwarsa 5 menit
    sessionStorage.setItem(T.resend, String(now + 60 * 1000)) // kirim ulang nonaktif 60 detik
  },
  get() {
    const e = Number(sessionStorage.getItem(T.expires))
    const r = Number(sessionStorage.getItem(T.resend))
    return { expiresAt: e || null, resendAt: r || null }
  },
  setResendAt(ts: number) { sessionStorage.setItem(T.resend, String(ts)) },
  expireNow() { sessionStorage.setItem(T.expires, String(Date.now())) },
  clear() {
    sessionStorage.removeItem(T.expires)
    sessionStorage.removeItem(T.resend)
  },
}