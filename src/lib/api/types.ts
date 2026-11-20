export interface ApiEnvelope<T = unknown> {
  status: string
  response_code: number
  code?: string // hanya ada pada error
  message: string
  data?: T
  error?: unknown // jangan pernah ditampilkan
}

export interface RegisterPayload {
  nama_lengkap: string
  npm: string
  email_kampus: string
  password: string
  program_studi: string
  fakultas: string
  accept_terms: boolean
}
export interface RegisterData {
  user_id: string
  status: 'pending_otp'
}

export interface VerifyOtpPayload {
  email_kampus: string
  otp: string
}
export interface VerifyOtpData {
  status: 'verified'
}

export interface ResendOtpPayload {
  email_kampus: string
}

export interface LoginPayload {
  email_kampus: string
  password: string
}

export interface AuthUser {
  user_id: string
  nama_lengkap: string
  npm: string
  email_kampus: string
  program_studi: string
  fakultas: string
  role: string
  status_verifikasi: string
  tanggal_registrasi: string
}
export interface LoginData {
  token: string
  user: AuthUser
}