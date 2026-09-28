'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { refresh } from 'next/cache'
import { q } from '@/lib/db'
import { areaById } from '@/lib/geo'
import { oneLine } from '@/lib/format'
import { clearSessionCookie, getUser } from '@/lib/session'

export async function finishIntro(areaId: string) {
  const jar = await cookies()
  const area = areaById(areaId)
  jar.set('ch_seen', '1', { path: '/', maxAge: 60 * 60 * 24 * 365 * 2, sameSite: 'lax' })
  jar.set('ch_area', area.id, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  const u = await getUser()
  if (u) await q(`update users set area = $2 where id = $1`, [u.id, area.id])
  refresh()
}

export async function updateProfile(_: unknown, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const name = oneLine(formData.get('name'), 60)
  if (name.length < 2) return { ok: false, error: 'Ismingizni yozing' }
  const area = areaById(String(formData.get('area') || u.area)).id
  await q(`update users set name = $2, area = $3 where id = $1`, [u.id, name, area])
  const jar = await cookies()
  jar.set('ch_area', area, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  refresh()
  return { ok: true }
}

export async function setNotify(key: 'price' | 'messages' | 'bookings' | 'follows', on: boolean): Promise<{ ok: boolean }> {
  const u = await getUser()
  if (!u || !['price', 'messages', 'bookings', 'follows'].includes(key)) return { ok: false }
  await q(`update users set notify = notify || jsonb_build_object($2::text, $3::boolean) where id = $1`, [u.id, key, on])
  return { ok: true }
}

export async function markAllRead() {
  const u = await getUser()
  if (!u) return
  await q(`update notifications set read = true where user_id = $1 and not read`, [u.id])
  refresh()
}

export async function deleteAccount(formData: FormData) {
  const u = await getUser()
  if (!u) redirect('/')
  if (String(formData.get('confirm') || '').trim().toLowerCase() !== 'o‘chirish' && String(formData.get('confirm') || '').trim().toLowerCase() !== "o'chirish") {
    redirect('/profil/sozlamalar?xato=tasdiq')
  }
  // Biznes e’lonlari yashiriladi, foydalanuvchi ma’lumotlari o‘chiriladi.
  await q(`update listings set status = 'deleted' where business_id in (select id from businesses where owner_id = $1)`, [u.id])
  await q(`update businesses set status = 'deleted', owner_id = null where owner_id = $1`, [u.id])
  await q(`delete from users where id = $1`, [u.id])
  await clearSessionCookie()
  redirect('/?hisob=ochirildi')
}
