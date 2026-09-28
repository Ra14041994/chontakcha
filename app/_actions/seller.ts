'use server'
import { after } from 'next/server'
import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { one, q } from '@/lib/db'
import { newId } from '@/lib/ids'
import { getUser } from '@/lib/session'
import { CATEGORIES, UNITS, MAX_PHOTOS, BUSINESS_TYPES } from '@/lib/categories'
import { AREAS, validLatLng, haversineKm } from '@/lib/geo'
import { clampText, money, normalizePhone, oneLine } from '@/lib/format'
import { normText, searchBlob } from '@/lib/text'
import { notify, notifyMany } from '@/lib/notify'
import { decideBookingCore } from '@/lib/bookings'
import { photoAllowed, type BusinessInput, type ListingInput, type SaveResult } from '@/lib/seller-types'

type Biz = { id: string; name: string; owner_id: string; lat: number; lng: number; address: string; area: string; delivery: boolean; delivery_fee: number | null; delivery_eta: string | null; delivery_area: string | null; sub_until: Date | null; status: string }

async function ownBusiness(userId: string): Promise<Biz | null> {
  return one<Biz>(`select * from businesses where owner_id = $1 and status <> 'deleted' limit 1`, [userId])
}

const COLORS = ['#153759', '#2E5E4E', '#234685', '#5C7194', '#177550', '#6B4E16', '#251A46', '#705071', '#816855', '#2B3A55', '#8A4B2A', '#255A8C']

function validTime(t: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t)
}

function cleanBusiness(b: BusinessInput, fallbackPhone: string | null): { ok: true; v: Omit<BusinessInput, 'phone'> & { phone: string | null } } | { ok: false; error: string; field?: string } {
  const name = oneLine(b.name, 60)
  if (name.length < 2) return { ok: false, error: 'Biznes nomini yozing', field: 'name' }
  const category = oneLine(b.category, 60) || BUSINESS_TYPES[0]
  const phone = normalizePhone(b.phone) || (b.phone ? null : fallbackPhone)
  if (b.phone && !normalizePhone(b.phone)) return { ok: false, error: 'Telefon raqami noto‘g‘ri (masalan: 90 123 45 67)', field: 'phone' }
  const address = oneLine(b.address, 120)
  if (address.length < 3) return { ok: false, error: 'Manzilni yozing', field: 'address' }
  const area = AREAS.find((a) => a.id === b.area) || AREAS[0]
  let lat = Number(b.lat)
  let lng = Number(b.lng)
  if (!validLatLng(lat, lng) || haversineKm(lat, lng, area.lat, area.lng) > 150) {
    lat = area.lat
    lng = area.lng
  }
  const open_time = validTime(b.open_time) ? b.open_time : '09:00'
  const close_time = validTime(b.close_time) ? b.close_time : '21:00'
  const days = [...new Set(String(b.days || '').replace(/[^1-7]/g, '').split(''))].sort().join('') || '1234567'
  const logo = b.logo_url && photoAllowed(b.logo_url) ? b.logo_url : null
  return {
    ok: true,
    v: {
      name,
      category,
      phone,
      address,
      lat,
      lng,
      area: area.id,
      open_time,
      close_time,
      days,
      about: clampText(b.about, 600),
      logo_url: logo,
      delivery: Boolean(b.delivery),
      delivery_fee: b.delivery ? Math.max(0, Math.round(Number(b.delivery_fee) || 0)) : null,
      delivery_eta: oneLine(b.delivery_eta, 40),
      delivery_area: oneLine(b.delivery_area, 60),
    },
  }
}

function cleanListing(i: ListingInput): { ok: true; v: ListingInput } | { ok: false; error: string; field?: string } {
  const title = oneLine(i.title, 80)
  if (title.length < 3) return { ok: false, error: 'Nomini yozing (kamida 3 harf)', field: 'title' }
  const kind = i.kind === 'service' ? 'service' : 'product'
  const category = CATEGORIES.find((c) => c.id === i.category)?.id
  if (!category) return { ok: false, error: 'Kategoriyani tanlang', field: 'category' }
  const price = Math.round(Number(i.price) || 0)
  if (price <= 0) return { ok: false, error: 'Narxni yozing', field: 'price' }
  if (price > 1e11) return { ok: false, error: 'Narx juda katta', field: 'price' }
  const unit = UNITS.includes(i.unit) ? i.unit : 'so‘m'
  const photos = (Array.isArray(i.photos) ? i.photos : []).filter((p) => typeof p === 'string' && photoAllowed(p)).slice(0, MAX_PHOTOS)
  if (!photos.length) return { ok: false, error: 'Kamida bitta rasm qo‘shing', field: 'photos' }
  const specs = (Array.isArray(i.specs) ? i.specs : [])
    .map((s) => ({ k: oneLine(s?.k, 30), v: oneLine(s?.v, 60) }))
    .filter((s) => s.k && s.v)
    .slice(0, 10)
  const bs = Math.min(23, Math.max(0, Math.floor(Number(i.booking_start) || 9)))
  const be = Math.min(24, Math.max(bs + 1, Math.floor(Number(i.booking_end) || 21)))
  return {
    ok: true,
    v: {
      id: i.id,
      kind,
      photos,
      title,
      category,
      condition: kind === 'service' ? null : i.condition === 'used' ? 'used' : 'new',
      price,
      unit,
      description: clampText(i.description, 1500),
      specs,
      available: i.available !== false,
      delivery: kind === 'product' && Boolean(i.delivery),
      delivery_fee: kind === 'product' && i.delivery ? Math.max(0, Math.round(Number(i.delivery_fee) || 0)) : null,
      delivery_eta: kind === 'product' && i.delivery ? oneLine(i.delivery_eta, 40) : '',
      delivery_area: kind === 'product' && i.delivery ? oneLine(i.delivery_area, 60) : '',
      booking: kind === 'service' && Boolean(i.booking),
      booking_start: bs,
      booking_end: be,
      rooms: String(i.rooms || '')
        .split(',')
        .map((r) => oneLine(r, 30))
        .filter(Boolean)
        .slice(0, 8)
        .join(', '),
    },
  }
}

export async function saveListing(input: ListingInput, bizInput: BusinessInput | null, publish: boolean): Promise<SaveResult> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const lv = cleanListing(input)
  if (!lv.ok) return lv
  const l = lv.v
  let b = await ownBusiness(u.id)
  let newBusiness = false
  if (!b) {
    if (!bizInput) return { ok: false, error: 'Biznes ma’lumotlarini kiriting', field: 'biz' }
    const bv = cleanBusiness(bizInput, u.phone)
    if (!bv.ok) return bv
    const x = bv.v
    const id = newId()
    try {
      await q(
        `insert into businesses (id, owner_id, name, category, phone, address, area, lat, lng, open_time, close_time, days, about, logo_url, color,
                                 delivery, delivery_fee, delivery_eta, delivery_area, sub_until)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19, now() + interval '30 days')`,
        [id, u.id, x.name, x.category, x.phone, x.address, x.area, x.lat, x.lng, x.open_time, x.close_time, x.days, x.about, x.logo_url, COLORS[Math.floor(Math.random() * COLORS.length)], x.delivery, x.delivery_fee, x.delivery_eta || null, x.delivery_area || null],
      )
    } catch {
      return { ok: false, error: 'Biznes yaratilmadi. Qayta urinib ko‘ring.' }
    }
    b = await ownBusiness(u.id)
    if (!b) return { ok: false, error: 'Biznes yaratilmadi' }
    newBusiness = true
    after(() =>
      notify(u.id, {
        type: 'subscription',
        title: 'Bepul oy boshlandi',
        body: 'Cho‘ntakcha Business: 30 kun bepul. Tugashidan 3 kun oldin eslatamiz.',
        link: '/biznes/obuna',
      }),
    )
  }
  const status = publish ? 'active' : 'draft'
  const bookingCfg = l.booking ? JSON.stringify({ start: l.booking_start, end: l.booking_end, rooms: l.rooms ? l.rooms.split(', ') : [] }) : null
  const search = searchBlob([l.title, b.name, l.description, CATEGORIES.find((c) => c.id === l.category)?.name])
  const deliveryFee = l.delivery ? l.delivery_fee ?? b.delivery_fee : null

  if (l.id) {
    const old = await one<{ id: string; price: number; business_id: string; status: string; title: string }>(
      `select id, price, business_id, status, title from listings where id = $1 and status <> 'deleted'`,
      [l.id],
    )
    if (!old || old.business_id !== b.id) return { ok: false, error: 'E’lon topilmadi' }
    const dropped = l.price < old.price
    await q(
      `update listings set kind=$2, title=$3, norm_title=$4, search_text=$5, category=$6, condition=$7,
              price_old = case when $8::float8 < price then price when $8::float8 > price then null else price_old end,
              price=$8, unit=$9, description=$10, specs=$11::jsonb, photos=$12::jsonb, available=$13, delivery=$14, delivery_fee=$15,
              delivery_eta=$16, delivery_area=$17, booking=$18, booking_cfg=$19::jsonb, status=$20, price_checked_at=now(), updated_at=now()
       where id=$1`,
      [l.id, l.kind, l.title, normText(l.title), search, l.category, l.condition, l.price, l.unit, l.description, JSON.stringify(l.specs), JSON.stringify(l.photos), l.available, l.delivery, deliveryFee, l.delivery_eta || null, l.delivery_area || null, l.booking, bookingCfg, publish ? 'active' : old.status === 'active' ? 'active' : 'draft'],
    )
    if (dropped && publish) {
      const lid = l.id
      after(() => notifyPriceDrop(lid, l.title, b!.name, old.price, l.price, l.photos[0]))
    }
    return { ok: true, id: l.id, created: false, newBusiness }
  }

  const id = newId()
  await q(
    `insert into listings (id, business_id, kind, title, norm_title, search_text, category, condition, price, unit, description, specs, photos,
                           available, delivery, delivery_fee, delivery_eta, delivery_area, booking, booking_cfg, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18,$19,$20::jsonb,$21)`,
    [id, b.id, l.kind, l.title, normText(l.title), search, l.category, l.condition, l.price, l.unit, l.description, JSON.stringify(l.specs), JSON.stringify(l.photos), l.available, l.delivery, deliveryFee, l.delivery_eta || null, l.delivery_area || null, l.booking, bookingCfg, status],
  )
  if (publish) {
    const bizId = b.id
    const bizName = b.name
    after(async () => {
      const fs = await q<{ user_id: string }>(`select user_id from follows where business_id = $1`, [bizId])
      if (fs.length)
        await notifyMany(
          fs.map((f) => f.user_id),
          { type: 'new_listing', title: `${bizName}: yangi e’lon`, body: `${l.title} — ${money(l.price)} ${l.unit}`, link: `/e/${id}`, image: l.photos[0] },
          { pref: 'follows' },
        )
    })
  }
  return { ok: true, id, created: true, newBusiness }
}

async function notifyPriceDrop(listingId: string, title: string, bizName: string, oldPrice: number, newPrice: number, photo?: string) {
  const fav = await q<{ user_id: string }>(`select user_id from favorites where listing_id = $1`, [listingId])
  if (!fav.length) return
  await notifyMany(
    fav.map((f) => f.user_id),
    {
      type: 'price_drop',
      title: 'Narx tushdi',
      body: `${title} ${bizName}’da ${money(newPrice)} so‘m bo‘ldi (−${money(oldPrice - newPrice)})`,
      link: `/e/${listingId}`,
      image: photo,
    },
    { pref: 'price' },
  )
}

export async function saveBusiness(input: BusinessInput): Promise<{ ok: boolean; error?: string; field?: string }> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const b = await ownBusiness(u.id)
  if (!b) return { ok: false, error: 'Biznes topilmadi' }
  const bv = cleanBusiness(input, u.phone)
  if (!bv.ok) return bv
  const x = bv.v
  await q(
    `update businesses set name=$2, category=$3, phone=$4, address=$5, area=$6, lat=$7, lng=$8, open_time=$9, close_time=$10, days=$11, about=$12,
            logo_url=$13, delivery=$14, delivery_fee=$15, delivery_eta=$16, delivery_area=$17 where id=$1`,
    [b.id, x.name, x.category, x.phone, x.address, x.area, x.lat, x.lng, x.open_time, x.close_time, x.days, x.about, x.logo_url, x.delivery, x.delivery_fee, x.delivery_eta || null, x.delivery_area || null],
  )
  if (x.name !== b.name) {
    // qidiruv matnini yangilash
    const ls = await q<{ id: string; title: string; description: string; category: string }>(`select id, title, description, category from listings where business_id = $1`, [b.id])
    for (const l of ls) {
      await q(`update listings set search_text = $2 where id = $1`, [l.id, searchBlob([l.title, x.name, l.description, CATEGORIES.find((c) => c.id === l.category)?.name])])
    }
  }
  return { ok: true }
}

async function ownListing(userId: string, listingId: string) {
  return one<{ id: string; business_id: string; status: string; available: boolean }>(
    `select l.id, l.business_id, l.status, l.available from listings l join businesses b on b.id = l.business_id where l.id = $1 and b.owner_id = $2 and l.status <> 'deleted'`,
    [listingId, userId],
  )
}

export async function listingAction(listingId: string, action: 'sold' | 'available' | 'hide' | 'publish' | 'delete' | 'confirm'): Promise<{ ok: boolean; error?: string }> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const l = await ownListing(u.id, listingId)
  if (!l) return { ok: false, error: 'E’lon topilmadi' }
  const sql: Record<typeof action, string> = {
    sold: `update listings set available = false, updated_at = now() where id = $1`,
    available: `update listings set available = true, price_checked_at = now(), updated_at = now() where id = $1`,
    hide: `update listings set status = 'draft', updated_at = now() where id = $1`,
    publish: `update listings set status = 'active', price_checked_at = now(), updated_at = now() where id = $1`,
    delete: `update listings set status = 'deleted', updated_at = now() where id = $1`,
    confirm: `update listings set price_checked_at = now() where id = $1`,
  }
  await q(sql[action], [listingId])
  refresh()
  return { ok: true }
}

export async function confirmAllPrices(): Promise<{ ok: boolean; n?: number }> {
  const u = await getUser()
  if (!u) return { ok: false }
  const b = await ownBusiness(u.id)
  if (!b) return { ok: false }
  const r = await q(`update listings set price_checked_at = now() where business_id = $1 and status = 'active' returning id`, [b.id])
  refresh()
  return { ok: true, n: r.length }
}

export async function savePrices(updates: { id: string; price: number }[]): Promise<{ ok: boolean; error?: string; changed?: number }> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const b = await ownBusiness(u.id)
  if (!b) return { ok: false, error: 'Biznes topilmadi' }
  let changed = 0
  for (const up of updates.slice(0, 300)) {
    const price = Math.round(Number(up.price) || 0)
    if (price <= 0) continue
    const old = await one<{ price: number; title: string; photos: string[] }>(`select price, title, photos from listings where id = $1 and business_id = $2 and status <> 'deleted'`, [up.id, b.id])
    if (!old || old.price === price) continue
    await q(
      `update listings set price_old = case when $2::float8 < price then price else null end, price = $2, price_checked_at = now(), updated_at = now() where id = $1`,
      [up.id, price],
    )
    changed++
    if (price < old.price) {
      const id = up.id
      after(() => notifyPriceDrop(id, old.title, b.name, old.price, price, old.photos?.[0]))
    }
  }
  await q(`update listings set price_checked_at = now() where business_id = $1 and status = 'active'`, [b.id])
  refresh()
  return { ok: true, changed }
}

export async function setSubPrefs(autoRenew: boolean, method: string | null): Promise<{ ok: boolean }> {
  const u = await getUser()
  if (!u) return { ok: false }
  const b = await ownBusiness(u.id)
  if (!b) return { ok: false }
  const m = ['click', 'payme', 'uzum', 'karta'].includes(String(method)) ? method : null
  await q(`update businesses set auto_renew = $2, pay_method = coalesce($3, pay_method) where id = $1`, [b.id, autoRenew, m])
  return { ok: true }
}

export async function createPromotion(_: unknown, fd: FormData): Promise<{ ok: boolean; error?: string; reach?: number }> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const b = await ownBusiness(u.id)
  if (!b) return { ok: false, error: 'Biznes topilmadi' }
  const body = oneLine(fd.get('body'), 160)
  if (body.length < 5) return { ok: false, error: 'Xabar matnini yozing' }
  const recent = await one<{ n: number }>(`select count(*)::int as n from promotions where business_id = $1 and created_at > now() - interval '1 day'`, [b.id])
  if ((recent?.n ?? 0) >= 2) return { ok: false, error: 'Bir kunda ko‘pi bilan 2 ta xabar yuborish mumkin' }
  const listingId = String(fd.get('listing') || '') || null
  if (listingId) {
    const l = await one(`select 1 from listings where id = $1 and business_id = $2`, [listingId, b.id])
    if (!l) return { ok: false, error: 'E’lon topilmadi' }
  }
  const until = /^\d{4}-\d{2}-\d{2}$/.test(String(fd.get('until') || '')) ? String(fd.get('until')) : null
  const fs = await q<{ user_id: string }>(`select user_id from follows where business_id = $1`, [b.id])
  const id = newId()
  await q(`insert into promotions (id, business_id, body, listing_id, until, reach) values ($1, $2, $3, $4, $5, $6)`, [id, b.id, body, listingId, until, fs.length])
  if (fs.length) {
    after(() =>
      notifyMany(
        fs.map((f) => f.user_id),
        { type: 'promo', title: b.name, body, link: listingId ? `/e/${listingId}` : `/b/${b.id}` },
        { pref: 'follows' },
      ),
    )
  }
  refresh()
  return { ok: true, reach: fs.length }
}

export async function deletePromotion(id: string) {
  const u = await getUser()
  if (!u) return
  await q(`delete from promotions where id = $1 and business_id in (select id from businesses where owner_id = $2)`, [id, u.id])
  refresh()
}

export async function replyReview(reviewId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const r = await one<{ id: string; user_id: string; owner_id: string; biz_name: string; listing_id: string | null }>(
    `select r.id, r.user_id, b.owner_id, b.name as biz_name, r.listing_id from reviews r join businesses b on b.id = r.business_id where r.id = $1`,
    [reviewId],
  )
  if (!r || r.owner_id !== u.id) return { ok: false, error: 'Izoh topilmadi' }
  const body = clampText(text, 600)
  if (body.length < 2) return { ok: false, error: 'Javob yozing' }
  await q(`update reviews set reply = $2, replied_at = now() where id = $1`, [reviewId, body])
  after(() => notify(r.user_id, { type: 'review_reply', title: `${r.biz_name} izohingizga javob berdi`, body: body.slice(0, 140), link: r.listing_id ? `/e/${r.listing_id}#izohlar` : '/' }))
  refresh()
  return { ok: true }
}

export async function decideBooking(bookingId: string, accept: boolean): Promise<{ ok: boolean; error?: string }> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const r = await decideBookingCore(u.id, bookingId, accept)
  refresh()
  return r
}

export async function goSeller() {
  redirect('/biznes')
}

export async function requestPayment(method: string): Promise<{ ok: boolean; error?: string }> {
  const u = await getUser()
  if (!u) return { ok: false, error: 'Avval kiring' }
  const b = await ownBusiness(u.id)
  if (!b) return { ok: false, error: 'Biznes topilmadi' }
  const recent = await one(`select 1 from notifications where type = 'admin' and link = $1 and created_at > now() - interval '6 hours' limit 1`, [`/admin?b=${b.id}`])
  if (recent) return { ok: true }
  const admins = await q<{ id: string }>(`select id from users where is_admin and not blocked`)
  const m = ({ click: 'Click', payme: 'Payme', uzum: 'Uzum Bank', karta: 'Karta' } as Record<string, string>)[method] || method
  await notifyMany(
    admins.map((a) => a.id),
    { type: 'admin', title: 'Obuna to‘lovi so‘rovi', body: `${b.name} · ${m} · ${money(17000)} so‘m · ${u.phone || ''}`, link: `/admin?b=${b.id}` },
  )
  return { ok: true }
}
