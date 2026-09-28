import { one, q } from './db'
import { addDays, dayLong, dayWord, money, pad2, tk, tkDate } from './format'
import { newId } from './ids'
import { notify } from './notify'
import { businessVisible } from './listings'

export type BookingCfg = { start: number; end: number; rooms: string[] }

export function cfgOf(raw: unknown): BookingCfg {
  const c = (raw || {}) as Partial<BookingCfg>
  const start = Math.min(23, Math.max(0, Number(c.start ?? 9)))
  const end = Math.min(24, Math.max(start + 1, Number(c.end ?? 21)))
  const rooms = Array.isArray(c.rooms) ? c.rooms.map((r) => String(r).slice(0, 40)).filter(Boolean).slice(0, 8) : []
  return { start, end, rooms }
}

export function hourLabel(h: number) {
  return `${pad2(h % 24)}:00`
}

export function rangeLabel(start: number, hours: number) {
  return `${hourLabel(start)}–${hourLabel(start + hours)}`
}

/** Band qilingan soatlar: { [room]: Set<hour> } */
export async function busyHours(listingId: string, day: string): Promise<Record<string, number[]>> {
  const rows = await q<{ room: string | null; start_hour: number; hours: number }>(
    `select room, start_hour, hours from bookings where listing_id = $1 and day = $2 and status in ('pending', 'confirmed')`,
    [listingId, day],
  )
  const out: Record<string, number[]> = {}
  for (const r of rows) {
    const key = r.room || ''
    out[key] = out[key] || []
    for (let h = r.start_hour; h < r.start_hour + r.hours; h++) out[key].push(h)
  }
  return out
}

export function bookingPrice(price: number, unit: string, hours: number) {
  return unit.includes('/soat') ? price * hours : price
}

export async function createBookingCore(
  userId: string,
  input: { listingId: string; day: string; start: number; hours: number; room: string | null; note: string },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const l = await one<{
    id: string; title: string; price: number; unit: string; booking: boolean; booking_cfg: unknown; is_sample: boolean; status: string
    business_id: string; owner_id: string | null; b_status: string; b_sample: boolean; sub_until: Date | null; biz_name: string
  }>(
    `select l.id, l.title, l.price, l.unit, l.booking, l.booking_cfg, l.is_sample, l.status, l.business_id,
            b.owner_id, b.status as b_status, b.is_sample as b_sample, b.sub_until, b.name as biz_name
     from listings l join businesses b on b.id = l.business_id where l.id = $1`,
    [input.listingId],
  )
  if (!l || l.status !== 'active' || !l.booking) return { ok: false, error: 'Bu xizmatni band qilib bo‘lmaydi' }
  if (l.is_sample || l.b_sample) return { ok: false, error: 'Namuna e’lonni band qilib bo‘lmaydi' }
  if (!businessVisible({ is_sample: l.b_sample, status: l.b_status, sub_until: l.sub_until })) return { ok: false, error: 'Biznes hozircha faol emas' }
  if (l.owner_id === userId) return { ok: false, error: 'O‘z xizmatingizni band qila olmaysiz' }
  const cfg = cfgOf(l.booking_cfg)
  const today = tkDate()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.day) || input.day < today || input.day > addDays(today, 14)) return { ok: false, error: 'Sanani tanlang' }
  const hours = Math.min(6, Math.max(1, Math.floor(input.hours)))
  const start = Math.floor(input.start)
  if (start < cfg.start || start + hours > cfg.end) return { ok: false, error: 'Vaqt ish vaqtiga to‘g‘ri kelmaydi' }
  if (input.day === today && start <= tk().getUTCHours()) return { ok: false, error: 'Bu vaqt o‘tib ketgan' }
  const room = cfg.rooms.length ? (cfg.rooms.includes(String(input.room)) ? String(input.room) : cfg.rooms[0]) : null
  const busy = await busyHours(l.id, input.day)
  const taken = busy[room || ''] || []
  for (let h = start; h < start + hours; h++) if (taken.includes(h)) return { ok: false, error: 'Bu vaqt band. Boshqa vaqtni tanlang' }
  const dup = await one(`select 1 from bookings where user_id = $1 and listing_id = $2 and day = $3 and status = 'pending'`, [userId, l.id, input.day])
  if (dup) return { ok: false, error: 'Shu kunga so‘rovingiz bor — sotuvchi javobini kuting' }
  const id = newId()
  const price = bookingPrice(l.price, l.unit, hours)
  await q(
    `insert into bookings (id, listing_id, business_id, user_id, day, start_hour, hours, room, note, price, status)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')`,
    [id, l.id, l.business_id, userId, input.day, start, hours, room, input.note.slice(0, 300), price],
  )
  if (l.owner_id) {
    const buyer = await one<{ name: string }>(`select name from users where id = $1`, [userId])
    await notify(
      l.owner_id,
      {
        type: 'booking_new',
        title: 'Yangi band so‘rovi',
        body: `${buyer?.name || 'Xaridor'}: ${l.title} · ${dayWord(input.day)}, ${dayLong(input.day)} · ${rangeLabel(start, hours)}${room ? ' · ' + room : ''}${input.note ? '\n“' + input.note.slice(0, 120) + '”' : ''}`,
        link: '/biznes/bandlar',
      },
      {
        pref: 'bookings',
        buttons: [[{ text: '✅ Tasdiqlash', callback_data: `bk:${id}:ok` }, { text: '❌ Rad etish', callback_data: `bk:${id}:no` }]],
      },
    )
  }
  return { ok: true, id }
}

export async function decideBookingCore(actorId: string, bookingId: string, accept: boolean): Promise<{ ok: boolean; error?: string }> {
  const b = await one<{ id: string; status: string; user_id: string; owner_id: string | null; title: string; day: string; start_hour: number; hours: number; biz_name: string; room: string | null }>(
    `select k.id, k.status, k.user_id, b.owner_id, l.title, k.day, k.start_hour, k.hours, b.name as biz_name, k.room
     from bookings k join businesses b on b.id = k.business_id join listings l on l.id = k.listing_id where k.id = $1`,
    [bookingId],
  )
  if (!b || b.owner_id !== actorId) return { ok: false, error: 'Band topilmadi' }
  if (b.status !== 'pending') return { ok: false, error: 'Bu so‘rovga allaqachon javob berilgan' }
  await q(`update bookings set status = $2 where id = $1`, [bookingId, accept ? 'confirmed' : 'rejected'])
  await notify(
    b.user_id,
    {
      type: accept ? 'booking_ok' : 'booking_no',
      title: accept ? 'Band tasdiqlandi' : 'Band rad etildi',
      body: `${b.biz_name}: ${b.title} · ${dayWord(b.day)}, ${rangeLabel(b.start_hour, b.hours)}${b.room ? ' · ' + b.room : ''}`,
      link: '/bandlarim',
    },
    { pref: 'bookings' },
  )
  return { ok: true }
}

export async function cancelBookingCore(userId: string, bookingId: string): Promise<{ ok: boolean; error?: string }> {
  const b = await one<{ id: string; status: string; user_id: string; owner_id: string | null; title: string; day: string; start_hour: number; hours: number; buyer: string }>(
    `select k.id, k.status, k.user_id, b.owner_id, l.title, k.day, k.start_hour, k.hours, u.name as buyer
     from bookings k join businesses b on b.id = k.business_id join listings l on l.id = k.listing_id join users u on u.id = k.user_id where k.id = $1`,
    [bookingId],
  )
  if (!b || b.user_id !== userId) return { ok: false, error: 'Band topilmadi' }
  if (!['pending', 'confirmed'].includes(b.status)) return { ok: false, error: 'Bu bandni bekor qilib bo‘lmaydi' }
  await q(`update bookings set status = 'cancelled' where id = $1`, [bookingId])
  if (b.owner_id) {
    await notify(
      b.owner_id,
      { type: 'booking_cancel', title: 'Band bekor qilindi', body: `${b.buyer || 'Xaridor'}: ${b.title} · ${dayWord(b.day)}, ${rangeLabel(b.start_hour, b.hours)}`, link: '/biznes/bandlar' },
      { pref: 'bookings' },
    )
  }
  return { ok: true }
}

export function bookingPriceText(price: number, unit: string) {
  return `${money(price)} so‘m${unit.includes('dan') ? 'dan' : ''}`
}
