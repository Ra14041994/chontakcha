import type { Metadata } from 'next'
import Link from 'next/link'
import { q } from '@/lib/db'
import { requireBusiness } from '@/lib/business'
import { addDays, DAY_SHORT, dayLong, dayWord, isoWeekday, MONTHS, tkDate } from '@/lib/format'
import { rangeLabel } from '@/lib/bookings'
import { Shell, TopBack } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Empty, PersonAvatar } from '@/components/ui'
import { BookingDecision } from '@/components/client/SellerBits'
import { openChatWithBuyer } from '@/app/_actions/chat'
import { shortName } from '@/lib/format'

export const metadata: Metadata = { title: 'Bandlar', robots: { index: false } }

type K = { id: string; day: string; start_hour: number; hours: number; room: string | null; note: string; status: string; title: string; buyer: string; created_at: Date }

export default async function SellerBookings({ searchParams }: { searchParams: Promise<{ kun?: string }> }) {
  const { b } = await requireBusiness('/biznes/bandlar')
  const { kun } = await searchParams
  const today = tkDate()
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const sel = kun && /^\d{4}-\d{2}-\d{2}$/.test(kun) ? kun : today
  const rows = await q<K>(
    `select k.id, k.day, k.start_hour, k.hours, k.room, k.note, k.status, l.title, u.name as buyer, k.created_at
     from bookings k join listings l on l.id = k.listing_id join users u on u.id = k.user_id
     where k.business_id = $1 and k.day >= $2 and k.status in ('pending', 'confirmed')
     order by k.day, k.start_hour`,
    [b.id, addDays(today, -1)],
  )
  const pending = rows.filter((r) => r.status === 'pending' && r.day >= today)
  const confirmed = rows.filter((r) => r.status === 'confirmed' && r.day === sel)
  const perDay = (d: string) => rows.filter((r) => r.day === d).length
  const [y, m] = today.split('-').map(Number)
  const lastM = Number(days[6].slice(5, 7))
  return (
    <Shell top={<TopBack fallback="/biznes" />} nav="seller" active="bandlar" sheet="narrow">
      <div className="inner">
        <div className="page-h">
          <div>
            <h1>Bandlar</h1>
            <div className="page-sub">
              {MONTHS[m - 1]}
              {lastM !== m ? ` – ${MONTHS[lastM - 1]}` : ''} {y}
            </div>
          </div>
        </div>
        <div className="days">
          {days.map((d) => (
            <Link key={d} href={`/biznes/bandlar?kun=${d}`} className={`day${d === sel ? ' on' : ''}`} replace scroll={false}>
              {DAY_SHORT[isoWeekday(d) - 1]}
              <b>{Number(d.slice(8))}</b>
              <span className="dots">
                {Array.from({ length: Math.min(3, perDay(d)) }).map((_, i) => (
                  <i key={i} />
                ))}
              </span>
            </Link>
          ))}
        </div>

        <h3 className="mt20 mb12">Yangi so‘rovlar · {pending.length}</h3>
        {pending.length ? (
          pending.map((r) => (
            <div key={r.id} className="bk">
              <div className="flex gap12 center">
                <PersonAvatar name={r.buyer} />
                <div className="grow">
                  <b>{shortName(r.buyer)}</b>
                  <div className="small muted">
                    {r.title} · {r.hours} soat{r.room ? ` · ${r.room}` : ''}
                  </div>
                </div>
                <span className="tag blue">Yangi</span>
              </div>
              <div className="b mt10 flex center gap8">
                <Icon name="cal" size={18} /> {dayWord(r.day)}, {dayLong(r.day)} · {rangeLabel(r.start_hour, r.hours)}
              </div>
              {r.note && (
                <div className="note tint mt10">
                  <Icon name="chat" />
                  <div>“{r.note}”</div>
                </div>
              )}
              <div className="flex gap8 center">
                <div className="grow">
                  <BookingDecision id={r.id} />
                </div>
                <form action={openChatWithBuyer.bind(null, r.id)} style={{ marginTop: 12 }}>
                  <button className="btn btn-soft btn-sm btn-icon" aria-label="Chat">
                    <Icon name="chat" size={18} />
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="card tc small muted">Yangi so‘rov yo‘q</div>
        )}

        <h3 className="mt24 mb12">
          {dayWord(sel)} tasdiqlangan · {confirmed.length}
        </h3>
        {confirmed.length ? (
          <div className="list">
            {confirmed.map((r) => (
              <div key={r.id} className="row">
                <b style={{ width: 54 }}>{String(r.start_hour % 24).padStart(2, '0')}:00</b>
                <span className="grow">
                  <span className="t" style={{ display: 'block' }}>
                    {shortName(r.buyer)}
                  </span>
                  <span className="s">
                    {r.title} · {r.hours} soat{r.room ? ` · ${r.room}` : ''}
                  </span>
                </span>
                <span className="tag green">
                  <Icon name="check" /> Tasdiqlangan
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon="cal" title="Bu kunga tasdiqlangan band yo‘q" />
        )}
      </div>
    </Shell>
  )
}
