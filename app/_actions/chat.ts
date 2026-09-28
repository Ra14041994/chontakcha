'use server'
import { redirect } from 'next/navigation'
import { one } from '@/lib/db'
import { logEvent } from '@/lib/events'
import { newId } from '@/lib/ids'
import { getUser } from '@/lib/session'

export async function openChat(listingId: string | null, businessId: string | null) {
  const u = await getUser()
  const back = listingId ? `/e/${listingId}` : `/b/${businessId}`
  if (!u) redirect('/kirish?next=' + encodeURIComponent(back))
  let bizId = businessId
  if (listingId) {
    const l = await one<{ business_id: string; is_sample: boolean }>(`select business_id, is_sample from listings where id = $1`, [listingId])
    if (!l) redirect('/')
    if (l.is_sample) redirect(back)
    bizId = l.business_id
  }
  const b = await one<{ id: string; owner_id: string | null; is_sample: boolean }>(`select id, owner_id, is_sample from businesses where id = $1`, [bizId])
  if (!b || b.is_sample || !b.owner_id) redirect(back)
  if (b.owner_id === u.id) redirect('/xabarlar?rol=sotuvchi')
  const conv = await one<{ id: string; created: boolean }>(
    `insert into conversations (id, business_id, buyer_id, listing_id) values ($1, $2, $3, $4)
     on conflict (business_id, buyer_id) do update set listing_id = coalesce(excluded.listing_id, conversations.listing_id)
     returning id, (xmax = 0) as created`,
    [newId(), b.id, u.id, listingId],
  )
  if (conv?.created) await logEvent(b.id, listingId, 'chat', u.id)
  redirect(`/xabarlar/${conv!.id}`)
}

/** Sotuvchi band qilgan xaridor bilan suhbatni ochadi. */
export async function openChatWithBuyer(bookingId: string) {
  const u = await getUser()
  if (!u) redirect('/kirish?next=/biznes/bandlar')
  const k = await one<{ business_id: string; user_id: string; listing_id: string; owner_id: string }>(
    `select k.business_id, k.user_id, k.listing_id, b.owner_id from bookings k join businesses b on b.id = k.business_id where k.id = $1`,
    [bookingId],
  )
  if (!k || k.owner_id !== u.id) redirect('/biznes/bandlar')
  const conv = await one<{ id: string }>(
    `insert into conversations (id, business_id, buyer_id, listing_id) values ($1, $2, $3, $4)
     on conflict (business_id, buyer_id) do update set listing_id = excluded.listing_id returning id`,
    [newId(), k.business_id, k.user_id, k.listing_id],
  )
  redirect(`/xabarlar/${conv!.id}`)
}
