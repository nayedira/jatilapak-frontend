import { useEffect, useState } from 'react'

export function useCountdown(target: number | null) {
  const [left, setLeft] = useState(0)

  useEffect(() => {
    const calc = () => (target ? Math.max(0, Math.ceil((target - Date.now()) / 1000)) : 0)
    setLeft(calc())
    if (!target) return
    const id = setInterval(() => setLeft(calc()), 1000)
    return () => clearInterval(id)
  }, [target])

  return left
}

export const formatMMSS = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`