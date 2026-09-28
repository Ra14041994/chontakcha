'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { one, q } from '@/lib/db'
import { newId, newToken } from '@/lib/ids'
import { adminPhones, clearSessionCookie, setSessionCookie } from '@/lib/session'
import { botUsername, ensureWebhook, telegramEnabled } from '@/lib/telegram'
import { appUrl, safeNext } from '@/lib/url'

export async function startTelegramLogin(next: string): Promise<{ ok: true; link: string; app: string } | { ok: false; error: string }> {
  if (!telegramEnabled()) return { ok: false, error: 'Telegram bot hali ulanmagan. Administrator TELEGRAM_BOT_TOKEN ni qo‘shishi kerak.' }
  if (process.env.VERCEL_ENV === 'production' || process.env.APP_URL) {
    const w = await ensureWebhook(appUrl())
    if (!w.ok) console.error('webhook', w.error)
  }
  const username = await botUsername()
  if (!username) return { ok: false, error: 'Telegram bot bilan bog‘lanib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.' }
  const token = newToken(12)
  await q(`insert into login_tokens (token, next_path) values ($1, $2)`, [token, safeNext(next)])
  const jar = await cookies()
  jar.set('ch_lt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 900 })
  q(`delete from login_tokens where created_at < now() - interval '1 day'`).catch(() => {})
  return { ok: true, link: `https://t.me/${username}?start=${token}`, app: `tg://resolve?domain=${username}&start=${token}` }
}

export async function logout() {
  await clearSessionCookie()
  redirect('/')
}

export async function demoAllowed(): Promise<boolean> {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_LOGIN === '1'
}

/** Faqat lokal sinov uchun: Telegramsiz kirish. Productionda o‘chiq. */
export async function demoLogin(formData: FormData) {
  if (!(await demoAllowed())) redirect('/kirish')
  const name = String(formData.get('name') || 'Sinov foydalanuvchi').slice(0, 60)
  const phone = String(formData.get('phone') || '').replace(/[^\d+]/g, '') || null
  const next = safeNext(formData.get('next'))
  let user = phone ? await one<{ id: string }>(`select id from users where phone = $1`, [phone]) : null
  if (!user) {
    const id = newId()
    const isAdmin = Boolean(phone && adminPhones().includes(phone)) || formData.get('admin') === 'on'
    await q(`insert into users (id, phone, name, is_admin) values ($1, $2, $3, $4)`, [id, phone, name, isAdmin])
    user = { id }
  }
  await setSessionCookie(user.id)
  redirect(next)
}
