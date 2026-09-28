import { headers } from 'next/headers'

/** Saytning doimiy manzili (Telegram webhook va xabarlardagi havolalar uchun). */
export function appUrl(): string {
  const env = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
  if (env) return env.replace(/\/+$/, '')
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL
  }
  if (process.env.VERCEL_BRANCH_URL) return 'https://' + process.env.VERCEL_BRANCH_URL
  if (process.env.VERCEL_URL) return 'https://' + process.env.VERCEL_URL
  return 'http://localhost:' + (process.env.PORT || '3000')
}

/** Joriy so‘rov manzili (foydalanuvchi qaysi domen orqali kirgan bo‘lsa). */
export async function requestOrigin(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host')
    if (host) {
      const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
      return `${proto}://${host}`
    }
  } catch {}
  return appUrl()
}

export function absUrl(pathOrUrl: string | null | undefined, origin = appUrl()): string | undefined {
  if (!pathOrUrl) return undefined
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  return origin + (pathOrUrl.startsWith('/') ? '' : '/') + pathOrUrl
}

/** Faqat sayt ichidagi xavfsiz yo‘l (ochiq yo‘naltirishdan himoya). */
export function safeNext(next: unknown, fallback = '/'): string {
  const s = String(next || '')
  if (!s.startsWith('/') || s.startsWith('//') || s.startsWith('/\\')) return fallback
  return s.slice(0, 300)
}
