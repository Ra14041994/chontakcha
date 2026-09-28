import { q } from './db'
import { tkDate } from './format'

export type EventType = 'view' | 'call' | 'route' | 'chat' | 'save' | 'share'

export async function logEvent(businessId: string, listingId: string | null, type: EventType, userId?: string | null) {
  try {
    await q(`insert into events (business_id, listing_id, type, user_id, day) values ($1, $2, $3, $4, $5)`, [
      businessId,
      listingId,
      type,
      userId || null,
      tkDate(),
    ])
    if (type === 'view' && listingId) await q(`update listings set views = views + 1 where id = $1`, [listingId])
  } catch {
    // statistika asosiy ishni to‘xtatmasin
  }
}
