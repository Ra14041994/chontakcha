import type { Metadata } from 'next'
import { one, q } from '@/lib/db'
import { requireBusiness } from '@/lib/business'
import { addDays, dayLong, money, tkDate } from '@/lib/format'
import { Shell, TopBack } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { PromoForm } from '@/components/client/PromoForm'
import { DeletePromo } from '@/components/client/SellerBits'

export const metadata: Metadata = { title: 'Aksiya va yangiliklar', robots: { index: false } }

export default async function PromotionsPage() {
  const { b } = await requireBusiness('/biznes/aksiyalar')
  const [listings, promos, f] = await Promise.all([
    q<{ id: string; title: string; price: number; unit: string; photo: string | null }>(`select id, title, price, unit, photos->>0 as photo from listings where business_id = $1 and status = 'active' order by created_at desc`, [b.id]),
    q<{ id: string; body: string; until: string | null; reach: number; created_at: Date; title: string | null; photo: string | null }>(
      `select p.id, p.body, p.until, p.reach, p.created_at, l.title, l.photos->>0 as photo from promotions p left join listings l on l.id = p.listing_id where p.business_id = $1 order by p.created_at desc limit 30`,
      [b.id],
    ),
    one<{ n: number }>(`select count(*)::int as n from follows where business_id = $1`, [b.id]),
  ])
  const today = tkDate()
  const opts = [
    { value: addDays(today, 2), label: `${dayLong(addDays(today, 2))}gacha (3 kun)` },
    { value: addDays(today, 6), label: `${dayLong(addDays(today, 6))}gacha (1 hafta)` },
    { value: addDays(today, 13), label: `${dayLong(addDays(today, 13))}gacha (2 hafta)` },
    { value: addDays(today, 29), label: `${dayLong(addDays(today, 29))}gacha (1 oy)` },
  ]
  return (
    <Shell top={<TopBack fallback="/biznes" />} nav="seller" sheet="narrow2">
      <div className="inner">
        <div className="page-h">
          <h1>Aksiya va yangiliklar</h1>
        </div>
        <PromoForm listings={listings.map((l) => ({ id: l.id, title: l.title, price: `${money(l.price)} ${l.unit}`, photo: l.photo }))} followers={f?.n ?? 0} untilOptions={opts} />
        <p className="hint">Aksiya biznes sahifangizda va e’lonlaringizda ko‘rinadi, kuzatuvchilarga bildirishnoma boradi.</p>
        {promos.length > 0 && (
          <>
            <div className="list-title">Oldingi xabarlar</div>
            <div className="list">
              {promos.map((p) => {
                const ended = p.until && p.until < today
                return (
                  <div key={p.id} className="row">
                    {p.photo ? <img src={p.photo} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} /> : <span className="itile"><Icon name="megaphone" /></span>}
                    <span className="grow">
                      <span className="t" style={{ display: 'block' }}>
                        {p.body}
                      </span>
                      <span className="s">
                        {p.until ? `${dayLong(p.until)}gacha` : 'Muddatsiz'} · {p.reach} kishiga yuborildi{ended ? ' · tugagan' : ''}
                      </span>
                    </span>
                    <DeletePromo id={p.id} />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </Shell>
  )
}
