import { cookies } from 'next/headers'
import { one, q } from '@/lib/db'
import { SESSION_COOKIE, sessionCookieOptions, sessionValue } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const jar = await cookies()
  const token = jar.get('ch_lt')?.value
  if (!token) return Response.json({ status: 'none' })
  const row = await one<{ status: string; user_id: string | null; polled: boolean; next_path: string | null }>(
    `select status, user_id, polled, next_path from login_tokens where token = $1 and created_at > now() - interval '15 minutes'`,
    [token],
  )
  if (!row) {
    jar.delete('ch_lt')
    return Response.json({ status: 'expired' })
  }
  if (row.status === 'confirmed' && row.user_id && !row.polled) {
    const upd = await q(`update login_tokens set polled = true where token = $1 and not polled returning token`, [token])
    if (!upd.length) return Response.json({ status: 'used' })
    jar.set(SESSION_COOKIE, sessionValue(row.user_id), sessionCookieOptions())
    jar.delete('ch_lt')
    return Response.json({ status: 'ok', next: row.next_path || '/' })
  }
  return Response.json({ status: row.status })
}
