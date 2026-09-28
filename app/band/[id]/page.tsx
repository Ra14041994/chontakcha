import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getListing, getBusiness, businessVisible } from '@/lib/listings'
import { requireUser } from '@/lib/session'
import { busyHours, cfgOf } from '@/lib/bookings'
import { addDays, DAY_MID, isoWeekday, money, tk, tkDate } from '@/lib/format'
import { Shell, TopBack } from '@/components/shell'
import { Note } from '@/components/ui'
import { BookingForm } from '@/components/client/BookingForm'

export const metadata: Metadata = { title: 'Band qilish', robots: { index: false } }

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await requireUser(`/band/${id}`)
  const l = await getListing(id)
  if (!l || !l.booking || l.status !== 'active') notFound()
  const b = await getBusiness(l.business_id)
  if (!b || !businessVisible(b)) notFound()
  const cfg = cfgOf(l.booking_cfg)
  const today = tkDate()
  const keys = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const busy = await Promise.all(keys.map((k) => busyHours(l.id, k)))
  const days = keys.map((k, i) => ({
    key: k,
    top: i === 0 ? 'Bugun' : i === 1 ? 'Ertaga' : DAY_MID[isoWeekday(k) - 1],
    num: Number(k.slice(8, 10)),
    busy: busy[i],
  }))
  const blocked = l.is_sample || b.is_sample || b.owner_id === u.id
  return (
    <Shell top={<TopBack fallback={`/e/${l.id}`} />} nav={null} sheet="nonav narrow2">
      <div className="inner">
        <h1 className="mb16">Band qilish</h1>
        <Link href={`/e/${l.id}`} className="card flex gap12 center">
          {l.photos[0] && <img src={l.photos[0]} alt="" style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover' }} />}
          <span className="grow">
            <b style={{ display: 'block' }}>{l.title}</b>
            <span className="small muted">{b.name}</span>
            <span className="xb" style={{ display: 'block', fontSize: 17 }}>
              {money(l.price)} <small className="muted">{l.unit}</small>
            </span>
          </span>
        </Link>
        {blocked ? (
          <Note tone="amber" icon="info" className="mt16">
            {b.owner_id === u.id ? 'O‘z xizmatingizni band qila olmaysiz.' : 'Bu namuna e’lon — band qilish o‘chiq.'}
          </Note>
        ) : (
          <div className="mt20">
            <BookingForm listingId={l.id} days={days} start={cfg.start} end={cfg.end} rooms={cfg.rooms} price={l.price} unit={l.unit} nowHour={tk().getUTCHours()} today={today} />
          </div>
        )}
      </div>
    </Shell>
  )
}
