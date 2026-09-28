'use server'
import { after } from 'next/server'
import { refresh } from 'next/cache'
import { one, q } from '@/lib/db'
import { newId } from '@/lib/ids'
import { getUser } from '@/lib/session'
import { cancelBookingCore, createBookingCore } from '@/lib/bookings'
import { REVIEW_TAGS } from '@/lib/categories'
import { clampText } from '@/lib/format'
import { notify } from '@/lib/notify'
import { photoAllowed } from '@/lib/seller-types'

export async function createBooking(input: { listingId: string; day: string; start: number; hours: number; room: string | null; note: string }) {
  const u = await getUser()
  if (!u) return { ok: false as const, error: 'Avval kiring' }
  return createBookingCore(u.id, { ...input, note: clampText(input.note, 300) })
}

export async function cancelBooking(id: string): Promise<{ ok: boolean; error?: string }> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const r = await cancelBookingCore(u.id, id)
  refresh()
  return r
}

export async function submitReview(input: { listingId: string; bookingId?: string | null; rating: number; tags: string[]; body: string; photo: string | null }): Promise<{ ok: boolean; error?: string }> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const l = await one<{ id: string; business_id: string; owner_id: string | null; title: string; is_sample: boolean }>(
    `select l.id, l.business_id, b.owner_id, l.title, l.is_sample from listings l join businesses b on b.id = l.business_id where l.id = $1 and l.status <> 'deleted'`,
    [input.listingId],
  )
  if (!l) return { ok: false, error: 'E’lon topilmadi' }
  if (l.is_sample) return { ok: false, error: 'Namuna e’longa baho qo‘yib bo‘lmaydi' }
  if (l.owner_id === u.id) return { ok: false, error: 'O‘z e’loningizga baho qo‘ya olmaysiz' }
  const rating = Math.min(5, Math.max(1, Math.round(Number(input.rating) || 0)))
  if (!input.rating) return { ok: false, error: 'Yulduzchani tanlang' }
  const tags = (input.tags || []).filter((t) => REVIEW_TAGS.includes(t)).slice(0, 6)
  const body = clampText(input.body, 1000)
  const photo = input.photo && photoAllowed(input.photo) ? input.photo : null
  const existing = await one<{ id: string }>(`select id from reviews where user_id = $1 and listing_id = $2`, [u.id, l.id])
  if (existing) {
    await q(`update reviews set rating = $2, tags = $3::jsonb, body = $4, photo_url = coalesce($5, photo_url), created_at = now() where id = $1`, [existing.id, rating, JSON.stringify(tags), body, photo])
  } else {
    await q(
      `insert into reviews (id, listing_id, business_id, user_id, booking_id, rating, tags, body, photo_url) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
      [newId(), l.id, l.business_id, u.id, input.bookingId || null, rating, JSON.stringify(tags), body, photo],
    )
  }
  if (l.owner_id) {
    const owner = l.owner_id
    after(() => notify(owner, { type: 'review', title: `Yangi baho: ${'★'.repeat(rating)}`, body: `${l.title}${body ? ' — “' + body.slice(0, 100) + '”' : ''}`, link: '/biznes/izohlar' }))
  }
  return { ok: true }
}
