import type { Metadata } from 'next'
import Link from 'next/link'
import { q } from '@/lib/db'
import { requireBusiness } from '@/lib/business'
import { freshness, money } from '@/lib/format'
import { Shell, TopBack } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Empty } from '@/components/ui'
import { ListingMenu } from '@/components/client/SellerBits'

export const metadata: Metadata = { title: 'E’lonlarim', robots: { index: false } }

type L = { id: string; title: string; price: number; unit: string; photo: string | null; status: string; available: boolean; views: number; saves: number; price_checked_at: Date; created_at: Date; kind: string }

export default async function MyListings({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { b } = await requireBusiness('/biznes/elonlar')
  const { tab = 'faol' } = await searchParams
  const rows = await q<L>(
    `select l.id, l.title, l.price, l.unit, l.photos->>0 as photo, l.status, l.available, l.views, l.price_checked_at, l.created_at, l.kind,
            (select count(*)::int from favorites f where f.listing_id = l.id) as saves
     from listings l where l.business_id = $1 and l.status <> 'deleted' order by l.created_at desc`,
    [b.id],
  )
  const active = rows.filter((r) => r.status === 'active' && r.available)
  const sold = rows.filter((r) => r.status === 'active' && !r.available)
  const drafts = rows.filter((r) => r.status !== 'active')
  const cur = tab === 'tugagan' ? sold : tab === 'qoralama' ? drafts : active
  const stale = active.filter((r) => freshness(r.price_checked_at).stale).length
  const tabLink = (k: string, label: string, n: number) => (
    <Link href={`/biznes/elonlar?tab=${k}`} className={(tab === k || (k === 'faol' && !['tugagan', 'qoralama'].includes(tab))) ? 'on' : ''} replace>
      {label} <span className="cnt">{n}</span>
    </Link>
  )
  return (
    <Shell top={<TopBack fallback="/biznes" />} nav="seller" active="elonlar" sheet="narrow">
      <div className="inner">
        <div className="page-h">
          <h1>E’lonlarim</h1>
          <Link href="/biznes/elon/yangi" className="btn btn-primary btn-sm only-d">
            <Icon name="plus" size={18} /> Yangi e’lon
          </Link>
        </div>
        <div className="tabs">
          {tabLink('faol', 'Faol', active.length)}
          {tabLink('tugagan', 'Tugagan', sold.length)}
          {tabLink('qoralama', 'Qoralama', drafts.length)}
        </div>
        {stale > 0 && cur === active && (
          <div className="card flex center gap12 mb12">
            <span className="itile amber">
              <Icon name="clock" />
            </span>
            <span className="grow small b">{stale} ta e’lon narxi 3 kundan beri tasdiqlanmagan</span>
            <Link href="/biznes/narxlar" className="linkbtn">
              Tasdiqlash
            </Link>
          </div>
        )}
        {cur.length ? (
          <div className="list mylist">
            {cur.map((l) => {
              const f = freshness(l.price_checked_at)
              return (
                <div key={l.id} className="item">
                  <Link href={`/e/${l.id}`}>{l.photo ? <img src={l.photo} alt="" /> : <span className="noimg" style={{ display: 'block' }} />}</Link>
                  <div className="grow">
                    <Link href={`/e/${l.id}`} className="t ellipsis" style={{ display: 'block' }}>
                      {l.title}
                    </Link>
                    <div className="p">
                      {money(l.price)} <small>{l.unit}</small>
                    </div>
                    <div className="s">
                      {l.views} ko‘rish · {l.saves} saqlash{l.kind === 'service' ? ' · xizmat' : ''}
                    </div>
                    {l.status === 'active' ? (
                      <div className={`fresh ${f.stale ? 'muted' : 'green'}`}>
                        <Icon name={f.stale ? 'clock' : 'checkc'} size={14} /> {f.text}
                      </div>
                    ) : (
                      <div className="fresh muted">
                        <Icon name="eyeoff" size={14} /> Xaridorlarga ko‘rinmaydi
                      </div>
                    )}
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end', gap: 8 }}>
                    <ListingMenu id={l.id} status={l.status} available={l.available} />
                    {l.status === 'active' && (
                      <span className={`tag ${l.available ? 'green' : ''}`}>
                        <span className={`dot${l.available ? '' : ' grey'}`} /> {l.available ? 'Bor' : 'Tugagan'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Empty icon="box" title={tab === 'qoralama' ? 'Qoralama yo‘q' : tab === 'tugagan' ? 'Tugagan e’lon yo‘q' : 'Faol e’lon yo‘q'} text="Mahsulot yoki xizmatingizni rasm bilan joylang — xaridorlar sizni topadi." />
        )}
        <Link href="/biznes/elon/yangi" className="btn btn-outline btn-block mt16">
          <Icon name="plus" /> Yangi e’lon qo‘shish
        </Link>
      </div>
    </Shell>
  )
}
