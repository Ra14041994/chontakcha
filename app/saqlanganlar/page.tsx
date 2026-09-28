import type { Metadata } from 'next'
import Link from 'next/link'
import { q } from '@/lib/db'
import { cards, bizCards } from '@/lib/listings'
import { getViewer, requireUser } from '@/lib/session'
import { Shell, TopBack } from '@/components/shell'
import { ProductCard, BizCardView } from '@/components/cards'
import { Empty } from '@/components/ui'
import { NotifyToggles } from '@/components/client/Settings'

export const metadata: Metadata = { title: 'Saqlanganlar', robots: { index: false } }

export default async function SavedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const u = await requireUser('/saqlanganlar')
  const v = await getViewer()
  const { tab = 'mahsulotlar' } = await searchParams
  const favIds = (await q<{ listing_id: string }>(`select listing_id from favorites where user_id = $1 order by created_at desc`, [u.id])).map((r) => r.listing_id)
  const followIds = (await q<{ business_id: string }>(`select business_id from follows where user_id = $1`, [u.id])).map((r) => r.business_id)
  const [items, bizs] = await Promise.all([
    cards({ lat: v.lat, lng: v.lng, userId: u.id, ids: favIds, sort: 'yangi', limit: 200 }),
    bizCards({ lat: v.lat, lng: v.lng, userId: u.id, ids: followIds, limit: 100 }),
  ])
  const order = new Map(favIds.map((id, i) => [id, i]))
  items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  const products = items.filter((c) => c.kind === 'product')
  const services = items.filter((c) => c.kind === 'service')
  const active = ['mahsulotlar', 'xizmatlar', 'bizneslar'].includes(tab) ? tab : 'mahsulotlar'
  const list = active === 'mahsulotlar' ? products : services
  const tabLink = (k: string, label: string, n: number) => (
    <Link href={`/saqlanganlar?tab=${k}`} className={active === k ? 'on' : ''} replace>
      {label} <span className="cnt">{n}</span>
    </Link>
  )
  return (
    <Shell top={<TopBack fallback="/profil" />} active="profil">
      <div className="page-h">
        <h1>Saqlanganlar</h1>
      </div>
      <div className="tabs">
        {tabLink('mahsulotlar', 'Mahsulotlar', products.length)}
        {tabLink('xizmatlar', 'Xizmatlar', services.length)}
        {tabLink('bizneslar', 'Bizneslar', bizs.length)}
      </div>
      {active !== 'bizneslar' ? (
        <>
          {list.length > 0 && (
            <div className="mb16" style={{ maxWidth: 520 }}>
              <NotifyToggles notify={u.notify || {}} hasTelegram={Boolean(u.tg_id)} only={['price']} />
            </div>
          )}
          {list.length ? (
            <div className="pgrid">
              {list.map((c) => (
                <ProductCard key={c.id} c={c} authed />
              ))}
            </div>
          ) : (
            <Empty
              icon="heart"
              title="Hali hech narsa saqlanmagan"
              text="Yoqqan e’lonlardagi yurak belgisini bosing — narx tushsa, xabar beramiz."
              action={
                <Link href="/" className="btn btn-primary">
                  E’lonlarni ko‘rish
                </Link>
              }
            />
          )}
        </>
      ) : bizs.length ? (
        <div className="gridauto bgrid3">
          {bizs.map((b) => (
            <BizCardView key={b.id} b={b} />
          ))}
        </div>
      ) : (
        <Empty icon="store" title="Kuzatilayotgan biznes yo‘q" text="Biznes sahifasida “Kuzatish”ni bosing — aksiya va yangiliklardan xabardor bo‘lasiz." />
      )}
    </Shell>
  )
}
