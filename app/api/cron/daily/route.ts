import { q } from '@/lib/db'
import { notify } from '@/lib/notify'
import { dateLong, money } from '@/lib/format'
import { SUB_PRICE } from '@/lib/categories'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Har kuni: obuna eslatmalari, eski narx eslatmasi, eski tokenlarni tozalash. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('unauthorized', { status: 401 })
  const out: Record<string, number> = {}

  // 1) Obuna tugashiga 3 kun qolganda
  const soon = await q<{ id: string; owner_id: string; name: string; sub_until: Date }>(
    `select id, owner_id, name, sub_until from businesses
     where owner_id is not null and not is_sample and status = 'active'
       and sub_until between now() + interval '2 days' and now() + interval '3 days'`,
  )
  for (const b of soon) {
    await notify(b.owner_id, { type: 'subscription', title: 'Obuna tugashiga 3 kun qoldi', body: `${b.name}: ${dateLong(b.sub_until)}gacha. Keyingi oy — ${money(SUB_PRICE)} so‘m.`, link: '/biznes/obuna' })
  }
  out.soon = soon.length

  // 2) Obuna bugun tugagan (muhlat boshlandi)
  const ended = await q<{ id: string; owner_id: string; name: string }>(
    `select id, owner_id, name from businesses where owner_id is not null and not is_sample and status = 'active'
       and sub_until between now() - interval '1 day' and now()`,
  )
  for (const b of ended) {
    await notify(b.owner_id, { type: 'subscription', title: 'Obuna tugadi — 3 kunlik muhlat', body: `${b.name}: 3 kundan keyin e’lonlaringiz qidiruvda ko‘rinmay qoladi. To‘lov qilsangiz, darhol davom etadi.`, link: '/biznes/obuna' })
  }
  out.ended = ended.length

  // 3) Muhlat tugab, e’lonlar yashirildi
  const hidden = await q<{ id: string; owner_id: string; name: string }>(
    `select id, owner_id, name from businesses where owner_id is not null and not is_sample and status = 'active'
       and sub_until + interval '3 days' between now() - interval '1 day' and now()`,
  )
  for (const b of hidden) {
    await notify(b.owner_id, { type: 'subscription', title: 'E’lonlaringiz yashirildi', body: `${b.name}: obuna muddati tugadi. To‘lovdan keyin e’lonlar darhol qaytadi.`, link: '/biznes/obuna' })
  }
  out.hidden = hidden.length

  // 4) Narxlari 3 kundan beri tasdiqlanmagan (haftasiga bir marta — dushanba)
  const wd = new Date(Date.now() + 5 * 3600e3).getUTCDay()
  if (wd === 1) {
    const stale = await q<{ owner_id: string; n: number }>(
      `select b.owner_id, count(*)::int as n from listings l join businesses b on b.id = l.business_id
       where l.status = 'active' and not l.is_sample and b.owner_id is not null and l.price_checked_at < now() - interval '3 days'
       group by b.owner_id`,
    )
    for (const s of stale) {
      await notify(s.owner_id, { type: 'subscription', title: 'Narxlar hali to‘g‘rimi?', body: `${s.n} ta e’lon narxi 3 kundan beri tasdiqlanmagan. Bir tugma bilan tasdiqlang.`, link: '/biznes/narxlar' })
    }
    out.stale = stale.length
  }

  // 5) Tozalash
  await q(`delete from login_tokens where created_at < now() - interval '2 days'`)
  await q(`update bookings set status = 'done' where status = 'confirmed' and day < to_char(now() + interval '5 hours' - interval '1 day', 'YYYY-MM-DD')`)
  await q(`delete from notifications where created_at < now() - interval '120 days'`)
  return Response.json({ ok: true, ...out })
}
