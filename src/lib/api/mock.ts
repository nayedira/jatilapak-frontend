import type { ApiEnvelope } from './types'
import type { RawResponse } from './client'
import { queryMockProducts, getMockProduct } from './mockProducts'
import { mockChatRoute, MOCK_POINTS } from './mockChat'

const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms))

function res(httpStatus: number, message: string, opts: { data?: unknown; code?: string; retryAfter?: number } = {}): RawResponse {
  const body: ApiEnvelope = {
    status: httpStatus < 300 ? 'Success' : 'Error',
    response_code: httpStatus,
    message,
    data: opts.data,
    code: opts.code,
  }
  return { httpStatus, body, retryAfter: opts.retryAfter }
}

type B = Record<string, string | boolean>

export async function mockRequest(method: string, path: string, raw: unknown): Promise<RawResponse> {
  await wait()
  const b = (raw ?? {}) as B
  const email = String(b.email_kampus ?? '')
  const chat = mockChatRoute(method, path, raw)
  if (chat) return res(chat.status, chat.message, { data: chat.data, code: chat.code })

  const detail = path.match(/^\/products\/([^/?]+)/)
  if (method === 'GET' && detail) {
    const d = getMockProduct(detail[1])
    return d ? res(200, 'OK', { data: d }) : res(404, 'Produk tidak ditemukan', { code: 'NOT_FOUND' })
  }

  if (method === 'GET' && /^\/users\/[^/]+\/reviews/.test(path))
    return res(200, 'OK', {
      data: { average_rating: 4.5, total_reviews: 7, items: [], meta: { page: 1, limit: 1, total: 7, total_page: 7 } },
    })

  if (method === 'GET' && path.startsWith('/products'))
    return res(200, 'OK', { data: queryMockProducts(path) })

  if (method === 'GET' && path === '/meeting-points')
    return res(200, 'OK', { data: { items: MOCK_POINTS } })

  switch (path) {
    case '/auth/register': {
      if (!email.endsWith('@mail.unpad.ac.id')) return res(400, 'Pendaftaran wajib email resmi Unpad', { code: 'EMAIL_DOMAIN_INVALID' })
      if (email.startsWith('duplikat@')) return res(409, 'Email sudah terdaftar', { code: 'EMAIL_TAKEN' })
      if (b.npm === '000000000000') return res(409, 'NPM sudah terdaftar', { code: 'NPM_TAKEN' })
      return res(201, 'Registrasi berhasil, cek email untuk OTP', { data: { user_id: 'mock-user-1', status: 'pending_otp' } })
    }
    case '/auth/verify-otp': {
      const otp = String(b.otp ?? '')
      if (otp === '123456') return res(200, 'Verifikasi berhasil', { data: { status: 'verified' } })
      if (otp === '000000') return res(400, 'Kode OTP kedaluwarsa', { code: 'OTP_EXPIRED' })
      if (otp === '999999') return res(429, 'Percobaan OTP habis', { code: 'OTP_ATTEMPTS_EXCEEDED' })
      return res(401, 'Kode OTP tidak cocok, silakan coba lagi', { code: 'OTP_INVALID' })
    }
    case '/auth/resend-otp': {
      if (email.startsWith('cooldown@')) return res(429, 'Tunggu sebelum kirim ulang', { code: 'RESEND_COOLDOWN', retryAfter: 60 })
      return res(200, 'Jika email terdaftar, OTP baru telah dikirim')
    }
    case '/auth/login': {
      if (email.startsWith('belum@')) return res(403, 'Akun belum diverifikasi', { code: 'NOT_VERIFIED' })
      if (email.startsWith('blokir@')) return res(403, 'Akun diblokir', { code: 'BLOCKED' })
      if (email.startsWith('salah@') || b.password !== 'password123')
        return res(401, 'Email atau kata sandi salah', { code: 'INVALID_CREDENTIALS' })
      return res(200, 'Login berhasil', {
        data: {
          token: 'mock-token-abc',
          user: {
            user_id: 'mock-user-1', nama_lengkap: 'Mahasiswa Mock', npm: '140810240001',
            email_kampus: email, program_studi: 'Teknik Informatika', fakultas: 'FMIPA',
            role: 'user', status_verifikasi: 'verified', tanggal_registrasi: '2026-11-01T00:00:00Z',
          },
        },
      })
    }
  }
  return res(404, 'Endpoint tidak ditemukan', { code: 'NOT_FOUND' })
}