import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'outline'
  size?: 'md' | 'lg'
  loading?: boolean
}

export default function Button({ variant = 'primary', size = 'md', loading, disabled, children, ...rest }: Props) {
  const cls = ['btn', variant !== 'primary' && variant, size === 'lg' && 'lg'].filter(Boolean).join(' ')
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? 'Memproses…' : children}
    </button>
  )
}