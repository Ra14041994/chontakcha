import { q } from './db'
import { addDays, tkDate } from './format'

export type Stats7 = {
  views: number
  calls: number
  routes: number
  chats: number
  prev: { views: number; calls: number; routes: number; chats: number }
  days: { day: string; views: number }[]
}

export async function stats7(businessId: string): Promise<Stats7> {
  const today = tkDate()
  const from = addDays(today, -13)
  const rows = await q<{ type: string; day: string; n: number }>(
    `select type, day, count(*)::int as n from events where business_id = $1 and day >= $2 group by type, day`,
    [businessId, from],
  )
  const cur = { views: 0, calls: 0, routes: 0, chats: 0 }
  const prev = { views: 0, calls: 0, routes: 0, chats: 0 }
  const key: Record<string, keyof typeof cur> = { view: 'views', call: 'calls', route: 'routes', chat: 'chats' }
  const start = addDays(today, -6)
  const byDay: Record<string, number> = {}
  for (const r of rows) {
    const k = key[r.type]
    if (!k) continue
    if (r.day >= start) cur[k] += r.n
    else prev[k] += r.n
    if (r.type === 'view' && r.day >= start) byDay[r.day] = (byDay[r.day] || 0) + r.n
  }
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i)
    return { day: d, views: byDay[d] || 0 }
  })
  return { ...cur, prev, days }
}

export async function topListings(businessId: string) {
  const since = addDays(tkDate(), -6)
  return q<{ id: string; title: string; photo: string | null; views: number; saves: number; created_at: Date }>(
    `select l.id, l.title, l.photos->>0 as photo, l.created_at,
            (select count(*)::int from events e where e.listing_id = l.id and e.type = 'view' and e.day >= $2) as views,
            (select count(*)::int from favorites f where f.listing_id = l.id) as saves
     from listings l where l.business_id = $1 and l.status = 'active'
     order by views desc, l.created_at desc limit 3`,
    [businessId, since],
  )
}

export async function sellerTodo(businessId: string) {
  const r = await q<{ bookings: number; reviews: number; msgs: number; active: number; stale: number; oldest: Date | null }>(
    `select (select count(*)::int from bookings where business_id = $1 and status = 'pending') as bookings,
            (select count(*)::int from reviews where business_id = $1 and reply is null) as reviews,
            (select coalesce(sum(seller_unread), 0)::int from conversations where business_id = $1) as msgs,
            (select count(*)::int from listings where business_id = $1 and status = 'active') as active,
            (select count(*)::int from listings where business_id = $1 and status = 'active' and price_checked_at < now() - interval '3 days') as stale,
            (select min(price_checked_at) from listings where business_id = $1 and status = 'active') as oldest`,
    [businessId],
  )
  return r[0]
}
