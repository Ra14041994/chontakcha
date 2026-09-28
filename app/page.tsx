import Link from 'next/link'
import { cards, bizCards, cheapestGroups, type Card } from '@/lib/listings'
import { getViewer } from '@/lib/session'
import { CATEGORIES } from '@/lib/categories'
import { priceShort, unitTail } from '@/lib/format'
import { Shell, TopHome, getCounts } from '@/components/shell'
import { ProductCard, BizCardView } from '@/components/cards'
import { Icon } from '@/components/Icon'
import { Empty, SecHead } from '@/components/ui'
import { HeroMap } from '@/components/client/HeroMap'
import { Intro } from '@/components/client/Intro'
import type { MapPoint } from '@/components/client/MapView'

const POPULAR = ['Smartfon', 'Pomidor', 'Kir yuvish mashinasi', 'Avtomoyka', 'PlayStation']

function pinsFrom(list: Card[]): MapPoint[] {
  const seen = new Set<string>()
  const out: MapPoint[] = []
  for (const c of list) {
    if (seen.has(c.biz_id)) continue
    seen.add(c.biz_id)
    out.push({ id: c.id, lat: c.lat, lng: c.lng, label: priceShort(c.price) + unitTail(c.unit), tone: c.cheapest ? 'cheap' : 'default', title: `${c.title} — ${c.biz_name}` })
  }
  return out.slice(0, 9)
}

export default async function HomePage() {
  const v = await getViewer()
  const uid = v.user?.id
  const authed = Boolean(v.user)
  const [cheap, nearAll, bizs, counts] = await Promise.all([
    cheapestGroups({ lat: v.lat, lng: v.lng, userId: uid, limit: 10 }),
    cards({ lat: v.lat, lng: v.lng, userId: uid, limit: 24, sort: 'yaqin' }),
    bizCards({ lat: v.lat, lng: v.lng, userId: uid, limit: 8 }),
    v.user ? getCounts(v.user.id) : Promise.resolve(null),
  ])
  const cheapIds = new Set(cheap.map((c) => c.id))
  const near = nearAll.filter((c) => !cheapIds.has(c.id)).slice(0, 10)
  const pins = pinsFrom([...cheap, ...nearAll])

  return (
    <Shell top={<TopHome areaId={v.areaId} areaLabel={v.areaLabel} notifs={counts?.notifs ?? 0} />} active="home" cats footer>
      <section className="hero">
        <div className="l">
          <div className="eyebrow">Har doim cho‘ntagingizda foyda</div>
          <h1>
            Yaqin atrofda <span>eng arzon</span> narxni toping
          </h1>
          <p>{v.areaName} do‘konlaridagi narxlarni solishtiring — eng yaqin va eng arzonini bir qarashda ko‘ring.</p>
          <div className="pop">
            Ko‘p qidiriladi:
            {POPULAR.map((p) => (
              <Link key={p} href={`/qidiruv?q=${encodeURIComponent(p)}`} className="chip soft sm">
                {p}
              </Link>
            ))}
          </div>
        </div>
        <div className="r">
          <HeroMap points={pins} center={[v.lat, v.lng]} me={v.precise ? [v.lat, v.lng] : null} />
          <div className="over">
            <div className="grow">
              <b>Hammasi xaritada</b>
              <div className="small muted">Narxlar do‘konlar joylashuvi bilan</div>
            </div>
            <Link href="/xarita" className="btn btn-primary btn-sm">
              Xaritani ochish
            </Link>
          </div>
        </div>
      </section>

      <section className="sec">
        <h2 className="only-d sec-h">Kategoriyalar</h2>
        <div className="cats">
          {CATEGORIES.filter((c) => c.img).map((c) => (
            <Link key={c.id} href={`/qidiruv?k=${c.id}`} className="cat">
              <span className="ci">
                <img src={c.img} alt="" loading="lazy" />
              </span>
              {c.short || c.name}
            </Link>
          ))}
        </div>
      </section>

      {cheap.length > 0 && (
        <section className="sec">
          <SecHead title="Eng arzon narxlar" sub="Bir xil mahsulot yaqin do‘konlar bo‘yicha solishtirildi" href="/qidiruv?saralash=arzon" />
          <div className="hscroll">
            {cheap.map((c, i) => (
              <ProductCard key={c.id} c={c} authed={authed} groupInfo priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      <section className="sec">
        <div className="promo">
          <div>
            <div className="eyebrow g">Cho‘ntakcha Business</div>
            <h3>Do‘koningizni yaqin atrofdagi xaridorlarga ko‘rsating</h3>
            <ul className="only-d">
              <li>
                <Icon name="check" /> Mahsulot va xizmatlaringizni rasm bilan joylang
              </li>
              <li>
                <Icon name="check" /> Xaridorlar chat va qo‘ng‘iroq orqali to‘g‘ridan-to‘g‘ri yozadi
              </li>
              <li>
                <Icon name="check" /> Narxlaringizni bir tugma bilan tasdiqlang
              </li>
            </ul>
            <p className="only-m">Birinchi oy bepul, keyin oyiga 17 000 so‘m</p>
            <Link href={counts?.bizId ? '/biznes' : '/biznes/elon/yangi'} className="btn btn-primary only-m">
              {counts?.bizId ? 'Biznes paneli' : 'Biznes ochish'} <Icon name="chev" size={18} />
            </Link>
          </div>
          <div className="box only-d">
            <div className="small" style={{ opacity: 0.8 }}>
              Obuna
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, marginTop: 4 }}>
              17 000 <small style={{ fontSize: 16, opacity: 0.8 }}>so‘m / oy</small>
            </div>
            <Link href={counts?.bizId ? '/biznes' : '/biznes/elon/yangi'} className="btn btn-white btn-block mt16">
              {counts?.bizId ? 'Biznes paneli' : 'Biznes ochish'} <Icon name="chev" size={18} />
            </Link>
            <p className="small mt12" style={{ opacity: 0.75, maxWidth: 'none' }}>
              Birinchi oy bepul. Karta talab qilinmaydi.
            </p>
          </div>
          <img className="mark" src="/brand/logo_mark_white.webp" alt="" />
        </div>
      </section>

      <section className="sec">
        <SecHead title="Yaqiningizdagi takliflar" href="/qidiruv?saralash=yaqin" />
        {near.length ? (
          <div className="pgrid m6">
            {near.map((c) => (
              <ProductCard key={c.id} c={c} authed={authed} />
            ))}
          </div>
        ) : (
          <Empty icon="box" title="Hozircha e’lonlar yo‘q" text="Birinchi bo‘lib e’lon joylang — xaridorlar sizni topadi." action={<Link href="/biznes/elon/yangi" className="btn btn-primary">E’lon berish</Link>} />
        )}
      </section>

      {bizs.length > 0 && (
        <section className="sec">
          <SecHead title="Yaqin atrofdagi bizneslar" href="/qidiruv?tur=biznes" />
          <div className="bscroll">
            {bizs.map((b) => (
              <BizCardView key={b.id} b={b} />
            ))}
          </div>
        </section>
      )}
      <p className="sample-bar">
        <span className="tag">Beta</span> “Namuna” belgili e’lonlar saytni ko‘rsatish uchun qo‘yilgan.
      </p>
      {!v.seenIntro && <Intro current={v.areaId} overlay />}
    </Shell>
  )
}
