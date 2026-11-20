import { useNavigate } from 'react-router-dom'
import { authSession } from '../lib/session'

export function useLogoutConfirm() {
  const navigate = useNavigate()
  return () => {
    if (window.confirm('Keluar dari akun?')) {
      authSession.clear()
      navigate('/login', { replace: true })
    }
  }
}