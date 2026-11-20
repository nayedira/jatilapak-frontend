import { Check } from 'react-feather'

interface Option { value: string; label: string }
interface Props { value: string; options: Option[]; onPick: (v: string) => void }

export default function OptionList({ value, options, onPick }: Props) {
  return (
    <div role="radiogroup">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} className="option" onClick={() => onPick(o.value)}>
          {o.label}
          {value === o.value && <Check size={18} color="#C1082E" />}
        </button>
      ))}
    </div>
  )
}