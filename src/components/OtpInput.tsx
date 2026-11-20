import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface Props {
  digits: string[] // panjang 6, tiap elemen '' atau satu angka
  onChange: (d: string[]) => void
  disabled?: boolean
  invalid?: boolean
}

export default function OtpInput({ digits, onChange, disabled, invalid }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { refs.current[0]?.focus() }, [])

  const focusAt = (i: number) => refs.current[Math.min(Math.max(i, 0), 5)]?.focus()

  // Isi angka mulai dari indeks tertentu (dipakai ketik, paste, dan autofill).
  function fill(start: number, raw: string) {
    const nums = raw.replace(/\D/g, '').slice(0, 6 - start).split('')
    if (!nums.length) return
    const next = [...digits]
    nums.forEach((n, k) => { next[start + k] = n })
    onChange(next)
    focusAt(start + nums.length >= 6 ? 5 : start + nums.length)
  }

  function onInput(i: number, value: string) {
    if (value === '') {
      const next = [...digits]
      next[i] = ''
      onChange(next)
      return
    }
    fill(i, value)
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      const next = [...digits]
      next[i - 1] = ''
      onChange(next)
      focusAt(i - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); focusAt(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); focusAt(i + 1)
    }
  }

  function onPaste(i: number, e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    fill(i, e.clipboardData.getData('text'))
  }

  return (
    <div className="otp-row" role="group" aria-label="Kode OTP 6 digit">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          className="otp-box"
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={6} // longgar agar autofill/paste tidak terpotong sebelum diproses
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => onPaste(i, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
}