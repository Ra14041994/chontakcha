import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { one, q } from './db'
import { areaById, validLatLng } from './geo'

export const SESSION_COOKIE = 'ch_s'
const MAX_AGE = 60 * 60 * 24 * 180

export type User = {
  id: string
  phone: string | null
  tg_id: string | null
  tg_username: string | null
  name: string
  area: string
  notify: { price?: boolean; messages?: boolean; bookings?: boolean; follows?: boolean }
  is_admin: boolean
  blocked: boolean
  created_at: Date
  last_seen: Date | null
}

function secret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET
  const seed = process.env.TELEGRAM_BOT_TOKEN || process.env.DATABASE_URL || process.env.POSTGRES_URL || 'chontakcha-local-dev'
  return createHash('sha256').update('chontakcha-session:' + seed).digest('hex')
}

export function signValue(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyValue<T = any>(value: string | undefined | null): T | null {
  if (!value) return null
  const i = value.lastIndexOf('.')
  if (i < 1) return null
  const body = value.slice(0, i)
  const sig = value.slice(i + 1)
  const expect = createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expect)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T
  } catch {
    return null
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE,
  }
}

export function sessionValue(userId: string): string {
  return signValue({ u: userId, t: Date.now() })
}

/** Joriy foydalanuvchi (so‘rov davomida bir marta o‘qiladi). */
export const getUser = cache(async (): Promise<User | null> => {
  const jar = await cookies()
  const p = verifyValue<{ u: string; t: number }>(jar.get(SESSION_COOKIE)?.value)
  if (!p?.u) return null
  const u = await one<User>(`select * from users where id = $1`, [p.u])
  if (!u || u.blocked) return null
  const last = u.last_seen ? new Date(u.last_seen).getTime() : 0
  if (Date.now() - last > 5 * 60 * 1000) {
    q(`update users set last_seen = now() where id = $1`, [u.id]).catch(() => {})
  }
  return u
})

export async function requireUser(next: string): Promise<User> {
  const u = await getUser()
  if (!u) redirect('/kirish?next=' + encodeURIComponent(next))
  return u
}

export async function setSessionCookie(userId: string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, sessionValue(userId), sessionCookieOptions())
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export type Viewer = {
  user: User | null
  areaId: string
  areaLabel: string
  areaName: string
  lat: number
  lng: number
  precise: boolean
  seenIntro: boolean
}

/** Foydalanuvchi, hudud va joylashuv (masofani hisoblash uchun). */
export const getViewer = cache(async (): Promise<Viewer> => {
  const jar = await cookies()
  const user = await getUser()
  const area = areaById(jar.get('ch_area')?.value || user?.area)
  let lat = area.lat
  let lng = area.lng
  let precise = false
  const loc = jar.get('ch_loc')?.value
  if (loc) {
    const [a, b] = decodeURIComponent(loc).split(',').map(Number)
    if (validLatLng(a, b) && Math.abs(a - area.lat) < 1.5 && Math.abs(b - area.lng) < 1.5) {
      lat = a
      lng = b
      precise = true
    }
  }
  return {
    user,
    areaId: area.id,
    areaLabel: area.label,
    areaName: area.name,
    lat,
    lng,
    precise,
    seenIntro: jar.has('ch_seen') || Boolean(user),
  }
})

export function adminPhones(): string[] {
  return String(process.env.ADMIN_PHONES || '')
    .split(/[,\s]+/)
    .map((p) => p.replace(/[^\d+]/g, ''))
    .map((p) => (p.startsWith('+') ? p : p ? '+' + p : ''))
    .filter(Boolean)
}
