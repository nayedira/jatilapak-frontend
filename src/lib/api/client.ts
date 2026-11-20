import type { ApiEnvelope } from './types'
import { mockRequest } from './mock'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string
const PREFIX = (import.meta.env.VITE_API_PREFIX as string | undefined) ?? '/api/v1'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export class ApiError extends Error {
  httpStatus: number
  code?: string
  retryAfter?: number

  constructor(httpStatus: number, message: string, opts: { code?: string; retryAfter?: number } = {}) {
    super(message)
    this.httpStatus = httpStatus
    this.code = opts.code
    this.retryAfter = opts.retryAfter
  }
}

export interface RawResponse {
  httpStatus: number
  body: ApiEnvelope | null
  retryAfter?: number
}

function handle<T>({ httpStatus, body, retryAfter }: RawResponse): T {
  const ok = httpStatus >= 200 && httpStatus < 300
  if (ok) return body?.data as T

  // `body.error` sengaja diabaikan: detail internal, tidak untuk pengguna.
  throw new ApiError(httpStatus, body?.message || 'Terjadi kesalahan. Coba lagi.', {
    code: body?.code,
    retryAfter,
  })
}

// `path` relatif terhadap prefix, contoh: '/auth/login'
export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<T> {
  if (USE_MOCK) return handle<T>(await mockRequest(method, path, body))

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${PREFIX}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.')
  }

  let json: ApiEnvelope | null = null
  try { json = await res.json() } catch { /* bukan JSON */ }

  const ra = Number(res.headers.get('Retry-After'))
  return handle<T>({ httpStatus: res.status, body: json, retryAfter: ra > 0 ? ra : undefined })
}