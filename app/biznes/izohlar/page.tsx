import type { Metadata } from 'next'
import Link from 'next/link'
import { q } from '@/lib/db'
import { requireBusiness } from '@/lib/business'
import { ago, ratingText, shortName } from '@/lib/format'
import { Shell, TopBack } from '@/components/shell'
import { Icon, Stars } from '@/components/Icon'
import { Empty, PersonAvatar } from '@/components/ui'
import { ReplyBox } from '@/components/client/SellerBits'

export const metadata: Metadata = { title: 'Izohlar va javoblar', robots: { index: false } }

type R = { id: string; rating: number; body: string; tags: string[]; reply: string | null; created_at: Date; name: string; title: string | null }

export default async function SellerReviews({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { b } = await requireBusiness('/biznes/izohlar')
  const { f = '' } = await searchParams
  const all = await q<R>(
    `select r.id, r.rating, r.body, r.tags, r.reply, r.created_at, u.name, l.title
     from reviews r join users u on u.id = r.user_id left join listings l on l.id = r.listing_id
     where r.business_id = $1 order by r.created_at desc limit 300`,
    [b.id],
  )
  const unanswered = all.filter((r) => !r.reply)
  const filter = f || (unanswered.length ? 'javobsiz' : 'hammasi')
  const list = filter === 'javobsiz' ? unanswered : filter === 'past' ? all.filter((r) => r.rating <= 3) : all
  const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0
  return (
    <Shell top={<TopBack fallback="/biznes" />} nav="seller" sheet="narrow">
      <div className="inner">
        <div className="page-h">
          <h1>Izohlar va javoblar</h1>
        </div>
        {all.length > 0 && (
          <div className="rsum mb16">
            <div className="tc">
              <div className="big">{ratingText(avg)}</div>
              <Stars n={avg} />
              <div className="small muted mt4">{all.length} ta baho</div>
            </div>
            <div className="bars">
              {[5, 4, 3, 2, 1].map((s) => {
                const n = all.filter((r) => r.rating === s).length
                return (
                  <div key={s} className="bar">
                    <span>{s}</span>
                    <i>
                      <b style={{ width: `${(n / all.length) * 100}%` }} />
                    </i>
                    <span>{Math.round((n / all.length) * 100)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <div className="chips mb16">
          <Link href="/biznes/izohlar?f=javobsiz" className={`chip sm${filter === 'javobsiz' ? ' on' : ''}`} replace>
            Javobsiz {unanswered.length}
          </Link>
          <Link href="/biznes/izohlar?f=hammasi" className={`chip sm${filter === 'hammasi' ? ' on' : ''}`} replace>
            Hammasi {all.length}
          </Link>
          <Link href="/biznes/izohlar?f=past" className={`chip sm${filter === 'past' ? ' on' : ''}`} replace>
            Past baho
          </Link>
        </div>
        {list.length ? (
          list.map((r) => (
            <div key={r.id} className="review">
              <div className="top">
                <PersonAvatar name={r.name} size="sm" />
                <div className="grow">
                  <b>{shortName(r.name)}</b>
                  <div className="small muted">
                    <Stars n={r.rating} size={13} /> {ago(r.created_at)}
                  </div>
                </div>
              </div>
              {r.title && <div className="small muted b mt8">{r.title}</div>}
              {r.body && <div className="body">{r.body}</div>}
              {r.reply ? (
                <div className="reply">
                  <b>
                    <Icon name="store" size={16} /> Sizning javobingiz
                  </b>
                  {r.reply}
                </div>
              ) : null}
              <ReplyBox id={r.id} initial={r.reply} />
            </div>
          ))
        ) : (
          <Empty icon="star" title={all.length ? 'Bu yerda izoh yo‘q' : 'Hali izoh yo‘q'} text="Xaridorlar baho qoldirsa, shu yerda ko‘rasiz va javob yozasiz." />
        )}
        <p className="tc small muted mt16">Har izohga bitta ochiq javob yoziladi. Javob hammaga ko‘rinadi.</p>
      </div>
    </Shell>
  )
}
