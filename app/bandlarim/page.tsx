import type { Metadata } from 'next'
import Link from 'next/link'
import { q } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { dayLong, dayWord, km, money, tk, tkDate } from '@/lib/format'
import { rangeLabel } from '@/lib/bookings'
import { haversineKm, yandexRoute } from '@/lib/geo'
import { getViewer } from '@/lib/session'
import { Shell, TopBack } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Avatar, Empty } from '@/components/ui'
import { CancelBooking } from '@/components/client/BuyerBits'
import { openChat } from '@/app/_actions/chat'

export const metadata: Metadata = { title: 'Bandlarim', robots: { index: false } }

type B = {
  id: string; day: string; start_hour: number; hours: number; room: string | null; price: number; status: string; note: string
  listing_id: string; title: string; unit: string; business_id: string; biz_name: string; biz_color: string; biz_logo: string | null
  lat: number; lng: number; reviewed: boolean; is_sample: boolean
}

const STATUS: Record<string, [string, string]> = {
  pending: ['Kutilmoqda', 'amber'],
  confirmed: ['Tasdiqlangan', 'green'],
  rejected: ['Rad etilgan', 'red'],
  cancelled: ['Bekor qilingan', ''],
  done: ['Yakunlangan', ''],
}

export default async function MyBookings({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const u = await requireUser('/bandlarim')
  const v = await getViewer()
  const { tab = 'kelgusi' } = await searchParams
  const rows = await q<B>(
    `select k.id, k.day, k.start_hour, k.hours, k.room, k.price, k.status, k.note, k.listing_id, l.title, l.unit, k.business_id,
            b.name as biz_name, b.color as biz_color, b.logo_url as biz_logo, b.lat, b.lng, b.is_sample,
            exists (select 1 from reviews r where r.user_id = k.user_id and r.listing_id = k.listing_id) as reviewed
     from bookings k join listings l on l.id = k.listing_id join businesses b on b.id = k.business_id
     where k.user_id = $1 order by k.day desc, k.start_hour desc limit 200`,
    [u.id],
  )
  const today = tkDate()
  const nowH = tk().getUTCHours()
  const isFuture = (r: B) => r.day > today || (r.day === today && r.start_hour + r.hours > nowH)
  const upcoming = rows.filter((r) => isFuture(r) && ['pending', 'confirmed'].includes(r.status)).reverse()
  const past = rows.filter((r) => !upcoming.includes(r))
  const toReview = past.filter((r) => ['confirmed', 'done'].includes(r.status) && !r.reviewed && !r.is_sample).slice(0, 3)
  const list = tab === 'otgan' ? past : upcoming
  const card = (r: B) => {
    const [label, tone] = STATUS[r.status] || [r.status, '']
    const soon = r.day === today && r.start_hour - nowH < 2
    return (
      <div key={r.id} className="bk">
        <div className="flex gap12 center">
          <Avatar name={r.biz_name} color={r.biz_color} src={r.biz_logo} />
          <div className="grow">
            <Link href={`/e/${r.listing_id}`} className="b" style={{ display: 'block' }}>
              {r.biz_name}
            </Link>
            <div className="small muted ellipsis">
              {r.title} · {r.hours} soat
            </div>
          </div>
          <span className={`tag ${tone}`}>
            <Icon name={r.status === 'confirmed' ? 'check' : r.status === 'pending' ? 'clock' : 'x'} /> {label}
          </span>
        </div>
        <div className="info">
          <div>
            <Icon name="cal" /> {dayWord(r.day)}, {dayLong(r.day)} · {rangeLabel(r.start_hour, r.hours)}
          </div>
          <div>
            <Icon name="pin" /> {km(haversineKm(v.lat, v.lng, r.lat, r.lng))}
            {r.room ? ` · ${r.room}` : ''}
          </div>
          <div>
            <Icon name="wallet" /> {money(r.price)} so‘m{r.unit.includes('dan') ? 'dan' : ''} · joyida to‘lanadi
          </div>
          {r.note && (
            <div>
              <Icon name="chat" /> “{r.note}”
            </div>
          )}
        </div>
        {['pending', 'confirmed'].includes(r.status) && isFuture(r) && (
          <div className="btns mt12">
            <CancelBooking id={r.id} soon={soon} />
            {r.status === 'confirmed' ? (
              <a href={yandexRoute(r.lat, r.lng)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                <Icon name="nav" size={18} /> Yo‘nalish
              </a>
            ) : (
              !r.is_sample && (
                <form action={openChat.bind(null, r.listing_id, null)} style={{ display: 'contents' }}>
                  <button className="btn btn-soft btn-sm">
                    <Icon name="chat" size={18} /> Chat
                  </button>
                </form>
              )
            )}
          </div>
        )}
      </div>
    )
  }
  return (
    <Shell top={<TopBack fallback="/profil" />} active="profil" sheet="narrow">
      <div className="inner">
        <div className="page-h">
          <h1>Bandlarim</h1>
        </div>
        <div className="tabs">
          <Link href="/bandlarim" className={tab !== 'otgan' ? 'on' : ''} replace>
            Kelgusi <span className="cnt">{upcoming.length}</span>
          </Link>
          <Link href="/bandlarim?tab=otgan" className={tab === 'otgan' ? 'on' : ''} replace>
            O‘tgan <span className="cnt">{past.length}</span>
          </Link>
        </div>
        {list.length ? list.map(card) : <Empty icon="cal" title={tab === 'otgan' ? 'O‘tgan band yo‘q' : 'Kelgusi band yo‘q'} text="Xizmatlarni (game club, avtomoyka, usta…) oldindan band qilsangiz, shu yerda ko‘rinadi." action={<Link href="/qidiruv?tur=xizmat" className="btn btn-primary">Xizmatlarni ko‘rish</Link>} />}
        {toReview.length > 0 && tab !== 'otgan' && (
          <>
            <div className="list-title">Baho kutayotganlar</div>
            {toReview.map((r) => (
              <div key={r.id} className="bk">
                <div className="flex gap12 center">
                  <Avatar name={r.biz_name} color={r.biz_color} src={r.biz_logo} />
                  <div className="grow">
                    <b>{r.title}</b>
                    <div className="small muted">
                      {r.biz_name} · {dayLong(r.day)} · yakunlangan
                    </div>
                  </div>
                </div>
                <Link href={`/baho?l=${r.listing_id}&bk=${r.id}`} className="btn btn-soft btn-block btn-sm mt12">
                  <Icon name="star" size={18} /> Baho qoldirish
                </Link>
              </div>
            ))}
          </>
        )}
        <div className="note mt16">
          <Icon name="info" />
          <div>Band 2 soatdan kam qolganda bekor qilinsa, sotuvchiga xabar boradi.</div>
        </div>
      </div>
    </Shell>
  )
}
