/**
 * Vercel Blob ulanishini aniqlash.
 * Yangi ulanishlarda Vercel OIDC ishlatadi: loyihaga faqat BLOB_STORE_ID qo‘shiladi,
 * token esa har so‘rovda avtomatik beriladi. Eski usul — BLOB_READ_WRITE_TOKEN
 * (yoki ulashda maxsus prefiks tanlangan bo‘lsa, PREFIKS_READ_WRITE_TOKEN).
 */

function prefixedToken(): string | undefined {
  for (const [k, v] of Object.entries(process.env)) {
    if (v && k.endsWith('READ_WRITE_TOKEN') && v.startsWith('vercel_blob_rw_')) return v
  }
  return undefined
}

export type BlobMode = 'oidc' | 'token' | null

export function blobMode(): BlobMode {
  if (process.env.BLOB_STORE_ID) return 'oidc'
  if (process.env.BLOB_READ_WRITE_TOKEN || prefixedToken()) return 'token'
  return null
}

/** SDK o‘zi topa olmaydigan (prefiksli) token bo‘lsa — uni aniq uzatamiz. */
export function blobAuth(): { token?: string } {
  if (process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN) return {}
  const t = prefixedToken()
  return t ? { token: t } : {}
}

export function blobLabel(): string {
  const m = blobMode()
  if (m === 'oidc') return 'Vercel Blob ✓ (OIDC)'
  if (m === 'token') return 'Vercel Blob ✓ (token)'
  return process.env.VERCEL ? 'Ulanmagan — Vercel → Storage → Blob → Connect Project' : 'Lokal papka (.data/uploads)'
}
