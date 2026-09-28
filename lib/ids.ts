const ALPHA = '0123456789abcdefghijklmnopqrstuvwxyz'

/** Qisqa tasodifiy ID (URL uchun qulay). */
export function newId(len = 10): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let s = ''
  for (let i = 0; i < len; i++) s += ALPHA[bytes[i] % 36]
  return s
}

/** Uzun maxfiy token (login, havolalar uchun). */
export function newToken(bytes = 18): string {
  const b = new Uint8Array(bytes)
  crypto.getRandomValues(b)
  let s = ''
  for (const x of b) s += x.toString(16).padStart(2, '0')
  return s
}
