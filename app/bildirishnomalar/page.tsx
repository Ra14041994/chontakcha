import type { Metadata } from 'next'
import Link from 'next/link'
import { after } from 'next/server'
import { q } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { daysBetween, relShort } from '@/lib/format'
import { Shell, TopBack } from '@/components/shell'
import { Icon, type IconName } from '@/components/Icon'
import { Empty } from '@/components/ui'
import { markAllRead } from '@/app/_actions/prefs'

export const metadata: Metadata = { title: 'Bildirishnomalar', robots: { index: false } }

const ICON: Record<string, [IconName, string]> = {
  price_drop: ['trend', 'green'],
  message: ['chat', ''],
  booking_new: ['cal', ''],
  booking_ok: ['calcheck', 'green'],
  booking_no: ['xc', 'red'],
  booking_cancel: ['xc', 'red'],
  review: ['star', 'amber'],
  review_reply: ['star', ''],
  promo: ['megaphone', ''],
  subscription: ['wallet', 'amber'],
  new_listing: ['box', ''],
  welcome: ['sparkles', ''],
  admin: ['shield', 'amber'],
}

type N = { id: number; type: string; title: string; body: string; link: string | null; read: boolean; created_at: Date }

export default async function NotificationsPage() {
  const u = await requireUser('/bildirishnomalar')
  const rows = await q<N>(`select id, type, title, body, link, read, created_at from notifications where user_id = $1 order by id desc limit 100`, [u.id])
  if (rows.some((r) => !r.read)) after(() => q(`update notifications set read = true where user_id = $1 and not read`, [u.id]))
  const now = new Date()
  const groups: [string, N[]][] = [
    ['Bugun', rows.filter((r) => daysBetween(r.created_at, now) <= 0)],
    ['Shu hafta', rows.filter((r) => daysBetween(r.created_at, now) > 0 && daysBetween(r.created_at, now) < 7)],
    ['Oldinroq', rows.filter((r) => daysBetween(r.created_at, now) >= 7)],
  ]
  return (
    <Shell top={<TopBack fallback="/profil" />} active="profil" sheet="narrow">
      <div className="inner">
        <div className="page-h">
          <h1>Bildirishnomalar</h1>
          {rows.some((r) => !r.read) && (
            <form action={markAllRead}>
              <button className="linkbtn">Hammasini o‘qish</button>
            </form>
          )}
        </div>
        {!rows.length && <Empty icon="bell" title="Bildirishnoma yo‘q" text="Narx tushsa, band tasdiqlansa yoki yangi xabar kelsa — shu yerda ko‘rasiz." />}
        {groups.map(([label, list]) =>
          list.length ? (
            <div key={label}>
              <div className="list-title">{label}</div>
              <div className="list">
                {list.map((n) => {
                  const [ic, tone] = ICON[n.type] || ['bell', '']
                  const inner = (
                    <>
                      <span className={`itile${tone ? ' ' + tone : ''}`}>
                        <Icon name={ic} />
                      </span>
                      <span className="grow">
                        <span className="t">
                          {n.title}
                          <span>
                            {relShort(n.created_at)} {!n.read && <i className="u" />}
                          </span>
                        </span>
                        {n.body && <span className="b" style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{n.body}</span>}
                      </span>
                    </>
                  )
                  return n.link ? (
                    <Link key={n.id} href={n.link} className={`notif${n.read ? '' : ' unread'}`}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={n.id} className={`notif${n.read ? '' : ' unread'}`}>
                      {inner}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null,
        )}
        <Link href="/profil/sozlamalar" className="btn btn-outline btn-block mt20">
          <Icon name="gear" /> Bildirishnoma sozlamalari
        </Link>
      </div>
    </Shell>
  )
}
