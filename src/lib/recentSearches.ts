const KEY = 'jl_recent_searches'
const MAX = 8

function read(): string[] {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(r) ? r.filter((x) => typeof x === 'string') : []
  } catch { return [] }
}
function write(list: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* abaikan */ }
}

export const recentSearches = {
  get: read,
  add(term: string) {
    const t = term.trim()
    if (!t) return
    write([t, ...read().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX))
  },
  remove(term: string) { write(read().filter((x) => x !== term)) },
}