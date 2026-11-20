import { useId, useState, type InputHTMLAttributes } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
}

export default function TextField({ label, value, onChange, error, hint, type = 'text', required, ...rest }: Props) {
  const id = useId()
  const errId = `${id}-err`
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}{required && <span className="req"> *</span>}</span>
        {hint && <span className="hint">{hint}</span>}
      </label>
      <div className="input-wrap">
        <input
          id={id}
          className={`input${isPassword ? ' has-toggle' : ''}`}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          {...rest}
        />
        {isPassword && (
          <button type="button" className="toggle-pw" onClick={() => setShow((s) => !s)}>
            {show ? 'Sembunyi' : 'Lihat'}
          </button>
        )}
      </div>
      <div id={errId} className="field-error" aria-live="polite">{error}</div>
    </div>
  )
}