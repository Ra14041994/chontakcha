import type { Metadata } from 'next'
import Link from 'next/link'
import { cards, bizCards, type Card } from '@/lib/listings'
import { getViewer } from '@/lib/session'
import { categoryById } from '@/lib/categories'
import { money } from '@/lib/format'
import { parseSearch, searchHref, SORT_LABEL, type SearchParams, type SearchState } from '@/lib/search'
import { Shell } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Crumbs, Empty } from '@/components/ui'
import { ProductCard, RowCard, BizCardView } from '@/components/cards'
import { SearchTop, FilterSidebar } from '@/components/client/SearchUI'
import { ResultsMap, type MapItem } from '@/components/client/ResultsMap'

type Props = { searchParams: Promise<SearchParams> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const s = parseSearch(await searchParams)
  const cat = s.k ? categoryById(s.k).name : ''
  return { title: s.q ? `“${s.q}” — qidiruv` : cat || 'Qidiruv', robots: { index: false } }
}

function compareGroup(list: Card[]): { items: Card[]; title: string } | null {
  const by = new Map<string, Card[]>()
  for (const c of list) {
    if (c.gcount < 2) continue
    const k = c.norm_title + '|' + c.unit
    by.set(k, [...(by.get(k) || []), c])
  }
  let best: Card[] | null = null
  for (const arr of by.values()) if (arr.length >= 2 && (!best || arr.length > best.length)) best = arr
  if (!best) return null
  const items = [...best].sort((a, b) => a.price - b.price)
  return { items, title: items[0].title }
}

function Chips({ s }: { s: SearchState }) {
  const chips: { label: string; href: string }[] = []
  if (s.k) chips.push({ label: categoryById(s.k).name, href: searchHref(s, { k: '' }) })
  if (s.km) chips.push({ label: `${s.km} km gacha`, href: searchHref(s, { km: 0 }) })
  if (s.min) chips.push({ label: `${money(s.min)} dan`, href: searchHref(s, { min: 0 }) })
  if (s.max) chips.push({ label: `${money(s.max)} gacha`, href: searchHref(s, { max: 0 }) })
  if (s.reyting) chips.push({ label: `★ ${String(s.reyting).replace('.', ',')}+`, href: searchHref(s, { reyting: 0 }) })
  if (s.ochiq) chips.push({ label: 'Hozir ochiq', href: searchHref(s, { ochiq: false }) })
  if (s.mavjud) chips.push({ label: 'Faqat mavjud', href: searchHref(s, { mavjud: false }) })
  if (s.yetkazish) chips.push({ label: 'Yetkazib berish', href: searchHref(s, { yetkazish: false }) })
  if (!chips.length) return null
  return (
    <div className="chips mb12 only-m">
      {chips.map((c) => (
        <Link key={c.label} href={c.href} className="chip soft sm" replace>
          {c.label} <Icon name="x" size={16} />
        </Link>
      ))}
      <Link href={searchHref({ q: s.q, tur: s.tur })} className="chip sm" replace style={{ border: 0, background: 'transparent', color: 'var(--muted)' }}>
        Tozalash
      </Link>
    </div>
  )
}

export default async function SearchPage({ searchParams }: Props) {
  const s = parseSearch(await searchParams)
  const v = await getViewer()
  const uid = v.user?.id
  const authed = Boolean(v.user)
  const kind = s.tur === 'mahsulot' ? 'product' : s.tur === 'xizmat' ? 'service' : undefined
  const isBiz = s.tur === 'biznes'

  const [list, bizs] = await Promise.all([
    isBiz
      ? Promise.resolve([] as Card[])
      : cards({
          lat: v.lat,
          lng: v.lng,
          userId: uid,
          q: s.q,
          kind,
          category: s.k || undefined,
          maxKm: s.km || undefined,
          minPrice: s.min || undefined,
          maxPrice: s.max || undefined,
          minRating: s.reyting || undefined,
          availableOnly: s.mavjud,
          delivery: s.yetkazish,
          openNow: s.ochiq,
          sort: s.saralash,
          limit: 400,
        }),
    isBiz || (s.q && s.tur === 'hammasi') ? bizCards({ lat: v.lat, lng: v.lng, userId: uid, q: s.q, limit: isBiz ? 60 : 2, maxKm: s.km || undefined, nameOnly: !isBiz }) : Promise.resolve([]),
  ])
  const shown = list.slice(0, s.n)
  const cmp = s.q && !isBiz ? compareGroup(list) : null
  const title = s.q ? `“${s.q}”` : s.k ? categoryById(s.k).name : isBiz ? 'Bizneslar' : 'Barcha e’lonlar'
  const total = isBiz ? bizs.length : list.length

  const tabs = (
    <div className="tabs" role="tablist">
      {(
        [
          ['hammasi', 'Hammasi'],
          ['mahsulot', 'Mahsulot'],
          ['xizmat', 'Xizmat'],
          ['biznes', 'Biznes'],
        ] as const
      ).map(([k, label]) => (
        <Link key={k} href={searchHref(s, { tur: k, n: 24 })} className={s.tur === k ? 'on' : ''} replace>
          {label}
        </Link>
      ))}
    </div>
  )

  if (s.view === 'xarita' && !isBiz) {
    const items: MapItem[] = list.slice(0, 300).map((c) => ({
      id: c.id,
      title: c.title,
      price: c.price,
      unit: c.unit,
      photo: c.photo,
      biz_id: c.biz_id,
      biz_name: c.biz_name,
      lat: c.lat,
      lng: c.lng,
      dist: c.dist,
      cheapest: c.cheapest,
      open: c.openState.open,
      is_sample: c.is_sample,
    }))
    return (
      <Shell top={<SearchTop s={s} />} active="map" sheet="mapmode" appClass="map-page" q={s.q} nav="buyer">
        <div className="only-d flex between center mb16">
          <h1 style={{ fontSize: 26 }}>
            {title} — {total} ta natija
          </h1>
          <Link href={searchHref(s, { view: 'royxat' })} className="btn btn-outline btn-sm">
            <Icon name="list" size={18} /> Ro‘yxat
          </Link>
        </div>
        <ResultsMap items={items} center={[v.lat, v.lng]} me={v.precise ? [v.lat, v.lng] : null} listHref={searchHref(s, { view: 'royxat' })} />
      </Shell>
    )
  }

  const results = isBiz ? (
    bizs.length ? (
      <div className="gridauto">
        {bizs.map((b) => (
          <BizCardView key={b.id} b={b} />
        ))}
      </div>
    ) : (
      <Empty icon="store" title="Biznes topilmadi" text="Boshqa so‘z bilan qidirib ko‘ring yoki masofani oshiring." />
    )
  ) : shown.length ? (
    <>
      <div className="only-m">
        {shown.map((c) => (
          <RowCard key={c.id} c={c} authed={authed} />
        ))}
      </div>
      <div className="pgrid four only-d">
        {shown.map((c) => (
          <ProductCard key={c.id} c={c} authed={authed} />
        ))}
      </div>
      {list.length > shown.length && (
        <div className="tc mt24">
          <Link href={searchHref(s, { n: s.n + 24 })} className="btn btn-outline" scroll={false} replace>
            Yana ko‘rsatish · {Math.min(24, list.length - shown.length)} ta
          </Link>
        </div>
      )}
    </>
  ) : (
    <Empty
      icon="searchx"
      title="Hech narsa topilmadi"
      text={s.q ? `“${s.q}” bo‘yicha e’lon yo‘q. So‘zni qisqartiring yoki filtrlarni olib tashlang.` : 'Filtrlarni o‘zgartirib ko‘ring.'}
      action={
        <Link href={searchHref({ q: s.q })} className="btn btn-soft">
          Filtrlarni tozalash
        </Link>
      }
    />
  )

  return (
    <Shell
      top={<SearchTop s={s} />}
      active="home"
      q={s.q}
      cats
      footer
      after={
        !isBiz && list.length > 0 ? (
          <div className="float-map">
            <Link href={searchHref(s, { view: 'xarita' })} className="btn btn-primary">
              <Icon name="map" /> Xaritada ko‘rish
            </Link>
          </div>
        ) : null
      }
    >
      <Crumbs items={[{ href: '/', label: 'Bosh sahifa' }, { label: 'Qidiruv' }]} />
      <div className="only-d flex between center mb16 gap16">
        <h1 style={{ fontSize: 28 }}>
          {title} — {total} ta natija
        </h1>
        {!isBiz && (
          <Link href={searchHref(s, { view: 'xarita' })} className="btn btn-outline btn-sm">
            <Icon name="map" size={18} /> Xaritada ko‘rish
          </Link>
        )}
      </div>
      <div className="split">
        <aside className="only-d sticky">
          <FilterSidebar s={s} />
        </aside>
        <div>
          {tabs}
          <Chips s={s} />
          <div className="results-meta">
            <b>{total} ta natija</b>
            {!isBiz && <> · {SORT_LABEL[s.saralash]} bo‘yicha</>}
          </div>
          {!isBiz && bizs.length > 0 && (
            <div className="mb16">
              <div className="eyebrow mb8">Bizneslar</div>
              <div className="gridauto bgrid2">
                {bizs.map((b) => (
                  <BizCardView key={b.id} b={b} />
                ))}
              </div>
            </div>
          )}
          {cmp && (
            <div className="cmp">
              <div className="top">
                <span className="thumb">{cmp.items[0].photo ? <img src={cmp.items[0].photo} alt="" /> : null}</span>
                <div className="grow">
                  <div className="eyebrow green" style={{ color: 'var(--green)' }}>
                    Narxlar solishtirildi
                  </div>
                  <div className="b" style={{ fontSize: 16 }}>
                    {cmp.title}
                  </div>
                  <div className="small muted">
                    {cmp.items.length} ta do‘konda · farq {money(cmp.items[cmp.items.length - 1].price - cmp.items[0].price)} so‘m
                  </div>
                </div>
              </div>
              <div className="line">
                {cmp.items.map((c, i) => {
                  const min = cmp.items[0].price
                  const max = cmp.items[cmp.items.length - 1].price
                  const pos = max > min ? ((c.price - min) / (max - min)) * 100 : (i / Math.max(1, cmp.items.length - 1)) * 100
                  return <i key={c.id} className={i === 0 ? 'min' : ''} style={{ left: `${pos}%` }} title={`${c.biz_name}: ${money(c.price)}`} />
                })}
              </div>
              <div className="ends">
                <span className="green">
                  {money(cmp.items[0].price)} · <span style={{ color: 'var(--ink2)' }}>{cmp.items[0].biz_name}</span>
                </span>
                <span>
                  {money(cmp.items[cmp.items.length - 1].price)} · <span className="muted">{cmp.items[cmp.items.length - 1].biz_name}</span>
                </span>
              </div>
              <Link href={`/e/${cmp.items[0].id}`} className="btn btn-soft btn-block btn-sm mt12">
                Narxlarni solishtirish <Icon name="chev" size={16} />
              </Link>
            </div>
          )}
          {results}
        </div>
      </div>
    </Shell>
  )
}
