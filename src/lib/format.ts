const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const diffDays = (iso: string) => Math.round((dayStart(new Date()) - dayStart(new Date(iso))) / 86400000)

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

export function fmtListTime(iso: string) {
  const d = diffDays(iso)
  if (d <= 0) return fmtTime(iso)
  if (d === 1) return 'Kemarin'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export function fmtDayLabel(iso: string) {
  const d = diffDays(iso)
  if (d <= 0) return 'Hari ini'
  if (d === 1) return 'Kemarin'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const sameDay = (a: string, b: string) => dayStart(new Date(a)) === dayStart(new Date(b))

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'