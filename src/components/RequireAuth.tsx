import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { authSession } from '../lib/session'

export default function RequireAuth({ children }: { children: ReactNode }) {
  return authSession.token() ? <>{children}</> : <Navigate to="/login" replace />
}