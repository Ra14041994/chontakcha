import { q, one } from './db'
import { distSql } from './geo'
import { openState, type OpenState } from './hours'
import { tokens } from './text'

/** Xaridorga ko‘rinadigan e’lon sharti (obuna + 3 kunlik muhlat, namunalar doim ko‘rinadi). */
export const VISIBLE = `l.status = 'active' and b.status = 'active' and (b.is_sample or (b.sub_until is not null and b.sub_until + interval '3 days' >= now()))`
const BIZ_TEXT = `translate(lower(b.name || ' ' || b.category), '‘’ʻʼ''\`-', '')`
export const BIZ_VISIBLE = `b.status = 'active' and (b.is_sample or (b.sub_until is not null and b.sub_until + interval '3 days' >= now()))`

export type Card = {
  id: string
  title: string
  norm_title: string
  kind: 'product' | 'service'
  category: string
  condition: string | null
  price: number
  price_old: number | null
  unit: string
  photo: string | null
  available: boolean
  delivery: boolean
  delivery_fee: number | null
  booking: boolean
  is_sample: boolean
  created_at: Date
  price_checked_at: Date
  biz_id: string
  biz_name: string
  biz_color: string
  biz_logo: string | null
  address: string
  lat: number
  lng: number
  open_time: string
  close_time: string
  days: string
  dist: number
  gcount: number
  gmin: number
  cheapest: boolean
  best: boolean
  fav: boolean
  rating: number | null
  reviews: number
  openState: OpenState
}

export class P {
  values: unknown[]
  constructor(initial: unknown[] = []) {
    this.values = [...initial]
  }
  add(v: unknown): string {
    this.values.push(v)
    return '$' + this.values.length
  }
}

export type CardQuery = {
  lat: number
  lng: number
  userId?: string | null
  q?: string
  kind?: string
  category?: string
  maxKm?: number
  minPrice?: number
  maxPrice?: number
  minRating?: number
  availableOnly?: boolean
  delivery?: boolean
  openNow?: boolean
  businessId?: string
  normTitle?: string
  unit?: string
  excludeId?: string
  ids?: string[]
  onlyGroups?: boolean
  sort?: string
  limit?: number
  offset?: number
}

export async function cards(o: CardQuery): Promise<Card[]> {
  const p = new P([o.lat, o.lng, o.userId || null])
  const where: string[] = ['true']
  const toks = tokens(o.q)
  for (const t of toks) where.push(`g.search_text like ${p.add('%' + t + '%')}`)
  if (o.kind === 'product' || o.kind === 'service') where.push(`g.kind = ${p.add(o.kind)}`)
  if (o.category) where.push(`g.category = ${p.add(o.category)}`)
  if (o.maxKm && o.maxKm > 0) where.push(`g.dist <= ${p.add(o.maxKm)}`)
  if (o.minPrice && o.minPrice > 0) where.push(`g.price >= ${p.add(o.minPrice)}`)
  if (o.maxPrice && o.maxPrice > 0) where.push(`g.price <= ${p.add(o.maxPrice)}`)
  if (o.minRating && o.minRating > 0) where.push(`coalesce(rv.rating, 0) >= ${p.add(o.minRating)}`)
  if (o.availableOnly) where.push(`g.available`)
  if (o.delivery) where.push(`g.delivery`)
  if (o.businessId) where.push(`g.biz_id = ${p.add(o.businessId)}`)
  if (o.normTitle) where.push(`g.norm_title = ${p.add(o.normTitle)}`)
  if (o.unit) where.push(`g.unit = ${p.add(o.unit)}`)
  if (o.excludeId) where.push(`g.id <> ${p.add(o.excludeId)}`)
  if (o.ids) where.push(o.ids.length ? `g.id in (${o.ids.map((id) => p.add(id)).join(',')})` : 'false')
  if (o.onlyGroups) where.push(`g.gcount > 1 and g.price = g.gmin`)

  let order: string
  switch (o.sort) {
    case 'arzon':
      order = 'g.price asc, g.dist asc'
      break
    case 'yaqin':
      order = 'g.dist asc'
      break
    case 'yangi':
      order = 'g.created_at desc'
      break
    case 'reyting':
      order = 'rv.rating desc nulls last, g.dist asc'
      break
    default:
      order = toks[0]
        ? `(case when g.norm_title like ${p.add(toks[0] + '%')} then 0 else 1 end), g.norm_title, g.unit, g.price * (1 + 0.03 * g.dist)`
        : `g.dist asc, g.created_at desc`
  }
  const limit = Math.min(Math.max(o.limit ?? 24, 1), 400)
  const offset = Math.max(o.offset ?? 0, 0)

  const rows = await q<Card>(
    `with vis as (
       select l.id, l.title, l.norm_title, l.search_text, l.kind, l.category, l.condition, l.price, l.price_old, l.unit,
              l.photos->>0 as photo, l.available, l.delivery, l.delivery_fee, l.booking, l.is_sample, l.created_at, l.price_checked_at,
              b.id as biz_id, b.name as biz_name, b.color as biz_color, b.logo_url as biz_logo, b.address, b.lat, b.lng,
              b.open_time, b.close_time, b.days, ${distSql('$1', '$2')} as dist
       from listings l join businesses b on b.id = l.business_id
       where ${VISIBLE}
     ), g as (
       select vis.*,
              count(*) over (partition by norm_title, unit)::int as gcount,
              min(price) over (partition by norm_title, unit) as gmin,
              min(price * (1 + 0.03 * dist)) over (partition by norm_title, unit) as gbest
       from vis
     )
     select g.id, g.title, g.norm_title, g.kind, g.category, g.condition, g.price, g.price_old, g.unit, g.photo, g.available,
            g.delivery, g.delivery_fee, g.booking, g.is_sample, g.created_at, g.price_checked_at, g.biz_id, g.biz_name, g.biz_color,
            g.biz_logo, g.address, g.lat, g.lng, g.open_time, g.close_time, g.days, g.dist, g.gcount, g.gmin,
            (g.gcount > 1 and g.price = g.gmin) as cheapest,
            (g.gcount > 1 and g.price > g.gmin and g.price * (1 + 0.03 * g.dist) = g.gbest) as best,
            exists (select 1 from favorites f where f.user_id = $3 and f.listing_id = g.id) as fav,
            rv.rating, coalesce(rv.n, 0) as reviews
     from g
     left join (select business_id, avg(rating)::float8 as rating, count(*)::int as n from reviews group by business_id) rv
       on rv.business_id = g.biz_id
     where ${where.join(' and ')}
     order by ${order}
     limit ${o.openNow ? 400 : limit} offset ${o.openNow ? 0 : offset}`,
    p.values,
  )
  const now = new Date()
  let out = rows.map((r) => ({ ...r, openState: openState(r, now) }))
  if (o.openNow) out = out.filter((c) => c.openState.open).slice(offset, offset + limit)
  return out
}

export type BizCard = {
  id: string
  name: string
  category: string
  color: string
  logo_url: string | null
  address: string
  lat: number
  lng: number
  open_time: string
  close_time: string
  days: string
  delivery: boolean
  is_sample: boolean
  dist: number
  rating: number | null
  reviews: number
  listings: number
  followers: number
  following: boolean
  openState: OpenState
}

export async function bizCards(o: { lat: number; lng: number; userId?: string | null; q?: string; ids?: string[]; limit?: number; maxKm?: number; nameOnly?: boolean }): Promise<BizCard[]> {
  const p = new P([o.lat, o.lng, o.userId || null])
  const where: string[] = [BIZ_VISIBLE]
  for (const t of tokens(o.q)) {
    const ph = p.add('%' + t + '%')
    where.push(
      o.nameOnly
        ? `(${BIZ_TEXT} like ${ph})`
        : `(${BIZ_TEXT} like ${ph} or exists (select 1 from listings l2 where l2.business_id = b.id and l2.status = 'active' and l2.search_text like ${ph}))`,
    )
  }
  if (o.ids) where.push(o.ids.length ? `b.id in (${o.ids.map((id) => p.add(id)).join(',')})` : 'false')
  if (o.maxKm && o.maxKm > 0) where.push(`${distSql('$1', '$2')} <= ${p.add(o.maxKm)}`)
  const rows = await q<BizCard>(
    `select b.id, b.name, b.category, b.color, b.logo_url, b.address, b.lat, b.lng, b.open_time, b.close_time, b.days, b.delivery, b.is_sample,
            ${distSql('$1', '$2')} as dist, rv.rating, coalesce(rv.n, 0) as reviews,
            (select count(*)::int from listings l where l.business_id = b.id and l.status = 'active') as listings,
            (select count(*)::int from follows f where f.business_id = b.id) as followers,
            exists (select 1 from follows f where f.business_id = b.id and f.user_id = $3) as following
     from businesses b
     left join (select business_id, avg(rating)::float8 as rating, count(*)::int as n from reviews group by business_id) rv on rv.business_id = b.id
     where ${where.join(' and ')}
       and exists (select 1 from listings l where l.business_id = b.id and l.status = 'active')
     order by dist asc
     limit ${Math.min(o.limit ?? 12, 200)}`,
    p.values,
  )
  const now = new Date()
  return rows.map((r) => ({ ...r, openState: openState(r, now) }))
}

export type ListingFull = {
  id: string
  business_id: string
  kind: 'product' | 'service'
  title: string
  norm_title: string
  category: string
  condition: string | null
  price: number
  price_old: number | null
  unit: string
  description: string
  specs: { k: string; v: string }[]
  photos: string[]
  available: boolean
  delivery: boolean
  delivery_fee: number | null
  delivery_eta: string | null
  delivery_area: string | null
  booking: boolean
  booking_cfg: { start: number; end: number; rooms: string[] } | null
  status: string
  is_sample: boolean
  views: number
  price_checked_at: Date
  created_at: Date
  updated_at: Date
}

export type BusinessFull = {
  id: string
  owner_id: string | null
  name: string
  category: string
  phone: string | null
  address: string
  area: string
  lat: number
  lng: number
  open_time: string
  close_time: string
  days: string
  about: string
  logo_url: string | null
  color: string
  delivery: boolean
  delivery_fee: number | null
  delivery_eta: string | null
  delivery_area: string | null
  is_sample: boolean
  status: string
  sub_until: Date | null
  auto_renew: boolean
  pay_method: string | null
  created_at: Date
}

export async function getListing(id: string): Promise<ListingFull | null> {
  return one<ListingFull>(`select * from listings where id = $1 and status <> 'deleted'`, [id])
}

export async function getBusiness(id: string): Promise<BusinessFull | null> {
  return one<BusinessFull>(`select * from businesses where id = $1`, [id])
}

export function businessVisible(b: Pick<BusinessFull, 'is_sample' | 'status' | 'sub_until'>): boolean {
  if (b.status !== 'active') return false
  if (b.is_sample) return true
  if (!b.sub_until) return false
  return new Date(b.sub_until).getTime() + 3 * 86400000 >= Date.now()
}

export async function bizRating(businessId: string): Promise<{ rating: number | null; n: number }> {
  const r = await one<{ rating: number | null; n: number }>(
    `select avg(rating)::float8 as rating, count(*)::int as n from reviews where business_id = $1`,
    [businessId],
  )
  return { rating: r?.rating ?? null, n: r?.n ?? 0 }
}

/** Uy sahifasi va boshqa joylarda: bir xil mahsulot guruhlari (2+ taklif) — eng arzoni. */
export async function cheapestGroups(o: { lat: number; lng: number; userId?: string | null; limit?: number }): Promise<Card[]> {
  const rows = await cards({ ...o, onlyGroups: true, sort: 'yaqin', limit: 60 })
  const seen = new Set<string>()
  const out: Card[] = []
  for (const r of rows) {
    const key = r.norm_title + '|' + r.unit
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out.slice(0, o.limit ?? 10)
}
