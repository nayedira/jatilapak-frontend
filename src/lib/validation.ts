export const validateEmail = (v: string) => {
  if (!v.trim()) return 'Email wajib diisi'
  if (!v.trim().toLowerCase().endsWith('@mail.unpad.ac.id'))
    return 'Gunakan email kampus @mail.unpad.ac.id'
}

export const validateNpm = (v: string) => {
  if (!v) return 'NPM wajib diisi'
  if (!/^\d{12}$/.test(v)) return 'NPM harus tepat 12 digit angka'
}

export const validatePassword = (v: string) => {
  if (!v) return 'Kata sandi wajib diisi'
  if (v.length < 8 || v.length > 72) return 'Kata sandi minimal 8 karakter'
}

export const validateConfirm = (pw: string, v: string) => {
  if (!v) return 'Konfirmasi kata sandi wajib diisi'
  if (v !== pw) return 'Konfirmasi tidak cocok'
}

export const validateRequired = (label: string) => (v: string) =>
  v.trim() ? undefined : `${label} wajib diisi`