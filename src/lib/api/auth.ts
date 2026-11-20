import { request } from './client'
import type {
  RegisterPayload, RegisterData,
  VerifyOtpPayload, VerifyOtpData,
  ResendOtpPayload,
  LoginPayload, LoginData,
} from './types'


export const register = (p: RegisterPayload) => request<RegisterData>('POST', '/auth/register', p)
export const verifyOtp = (p: VerifyOtpPayload) => request<VerifyOtpData>('POST', '/auth/verify-otp', p)
export const resendOtp = (p: ResendOtpPayload) => request<unknown>('POST', '/auth/resend-otp', p)
export const login = (p: LoginPayload) => request<LoginData>('POST', '/auth/login', p)