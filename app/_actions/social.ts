'use server'
import { one, q } from '@/lib/db'
import { logEvent } from '@/lib/events'
import { getUser } from '@/lib/session'
import { REPORT_REASONS } from '@/lib/categories'

type R = { ok: boolean; error?: string }

export async function toggleFavorite(listingId: string, on: boolean): Promise<R> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const l = await one<{ business_id: string }>(`select business_id from listings where id = $1 and status <> 'deleted'`, [String(listingId)])
  if (!l) return { ok: false, error: 'E’lon topilmadi' }
  if (on) {
    const r = await q(`insert into favorites (user_id, listing_id) values ($1, $2) on conflict do nothing returning listing_id`, [u.id, listingId])
    if (r.length) await logEvent(l.business_id, listingId, 'save', u.id)
  } else {
    await q(`delete from favorites where user_id = $1 and listing_id = $2`, [u.id, listingId])
  }
  return { ok: true }
}

export async function toggleFollow(businessId: string, on: boolean): Promise<R> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const b = await one<{ owner_id: string | null }>(`select owner_id from businesses where id = $1`, [String(businessId)])
  if (!b) return { ok: false, error: 'Biznes topilmadi' }
  if (b.owner_id === u.id) return { ok: false, error: 'O‘z biznesingizni kuzata olmaysiz' }
  if (on) await q(`insert into follows (user_id, business_id) values ($1, $2) on conflict do nothing`, [u.id, businessId])
  else await q(`delete from follows where user_id = $1 and business_id = $2`, [u.id, businessId])
  return { ok: true }
}

export async function reportListing(listingId: string, reason: string, note: string): Promise<R> {
  const u = await getUser()
  const l = await one<{ business_id: string }>(`select business_id from listings where id = $1`, [String(listingId)])
  if (!l) return { ok: false, error: 'E’lon topilmadi' }
  const why = REPORT_REASONS.includes(reason) ? reason : 'Boshqa'
  const text = (why + (note ? ': ' + String(note) : '')).slice(0, 500)
  if (u) {
    const dup = await one(`select 1 from reports where listing_id = $1 and user_id = $2 and not resolved`, [listingId, u.id])
    if (dup) return { ok: true }
  }
  await q(`insert into reports (listing_id, business_id, user_id, reason) values ($1, $2, $3, $4)`, [listingId, l.business_id, u?.id || null, text])
  return { ok: true }
}

export async function trackEvent(type: 'call' | 'route' | 'share', listingId: string | null, businessId: string | null): Promise<void> {
  const u = await getUser()
  let biz = businessId
  if (!biz && listingId) {
    const l = await one<{ business_id: string }>(`select business_id from listings where id = $1`, [String(listingId)])
    biz = l?.business_id || null
  }
  if (!biz) return
  await logEvent(biz, listingId, type, u?.id)
}
