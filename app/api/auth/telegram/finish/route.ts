import { NextResponse } from 'next/server'
import { one, q } from '@/lib/db'
import { SESSION_COOKIE, sessionCookieOptions, sessionValue } from '@/lib/session'
import { safeNext } from '@/lib/url'

export const dynamic = 'force-dynamic'

/** Botdagi “Saytga qaytish” tugmasi: shu brauzerda kirishni yakunlaydi (bir martalik). */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const t = url.searchParams.get('t') || ''
  const base = url.origin
  if (!/^[a-f0-9]{16,64}$/.test(t)) return NextResponse.redirect(base + '/kirish?xato=havola')
  const row = await one<{ user_id: string | null; next_path: string | null }>(
    `select user_id, next_path from login_tokens where token = $1 and status = 'confirmed' and not linked and created_at > now() - interval '15 minutes'`,
    [t],
  )
  if (!row?.user_id) return NextResponse.redirect(base + '/kirish?xato=havola')
  const upd = await q(`update login_tokens set linked = true where token = $1 and not linked returning token`, [t])
  if (!upd.length) return NextResponse.redirect(base + '/kirish?xato=havola')
  const res = NextResponse.redirect(base + safeNext(row.next_path))
  res.cookies.set(SESSION_COOKIE, sessionValue(row.user_id), sessionCookieOptions())
  res.cookies.set('ch_lt', '', { path: '/', maxAge: 0 })
  return res
}
