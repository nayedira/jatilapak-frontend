import { useId } from 'react'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
  error?: string
  required?: boolean
  disabled?: boolean
}

export default function SelectField({ label, value, onChange, options, placeholder, error, required, disabled }: Props) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}{required && <span className="req"> *</span>}</span>
      </label>
      <select
        id={id}
        className="input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <div id={errId} className="field-error" aria-live="polite">{error}</div>
    </div>
  )
}