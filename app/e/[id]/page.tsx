import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { headers } from 'next/headers'
import { q, one } from '@/lib/db'
import { cards, getBusiness, getListing, businessVisible, bizRating } from '@/lib/listings'
import { getViewer } from '@/lib/session'
import { categoryById } from '@/lib/categories'
import { ago, freshness, km, money, ratingText, shortName, dateLong } from '@/lib/format'
import { openState, hoursText } from '@/lib/hours'
import { haversineKm, yandexRoute } from '@/lib/geo'
import { logEvent } from '@/lib/events'
import { absUrl } from '@/lib/url'
import { Shell, TopBack } from '@/components/shell'
import { Icon, Stars } from '@/components/Icon'
import { Avatar, Crumbs, OpenTag, PersonAvatar, Rating } from '@/components/ui'
import { ProductCard } from '@/components/cards'
import { Gallery } from '@/components/client/Gallery'
import { FavButton } from '@/components/client/FavButton'
import { ShareButton } from '@/components/client/ShareButton'
import { CallButton, DisabledAction, RevealPhone, RouteButton } from '@/components/client/ContactActions'
import { ReportButton } from '@/components/client/ReportButton'
import { openChat } from '@/app/_actions/chat'

type Params = { params: Promise<{ id: string }> }

const BOT_RE = /bot|crawl|spider|preview|facebookexternalhit|WhatsApp|Telegram/i

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const l = await getListing(id)
  if (!l || l.status === 'deleted') return { title: 'E’lon topilmadi' }
  const b = await getBusiness(l.business_id)
  const title = `${l.title} — ${money(l.price)} ${l.unit}`
  const description = `${b?.name || ''}${b?.address ? ' · ' + b.address : ''} · Cho‘ntakcha’da yaqin do‘konlar narxlarini solishtiring.`
  const img = absUrl(l.photos?.[0])
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', images: img ? [{ url: img, width: 836, height: 836, alt: l.title }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: img ? [img] : undefined },
  }
}

export default async function ListingPage({ params }: Params) {
  const { id } = await params
  const v = await getViewer()
  const l = await getListing(id)
  if (!l) notFound()
  const b = await getBusiness(l.business_id)
  if (!b) notFound()
  const isOwner = Boolean(v.user && b.owner_id === v.user.id)
  const isAdmin = Boolean(v.user?.is_admin)
  const visible = l.status === 'active' && businessVisible(b)
  if (!visible && !isOwner && !isAdmin) notFound()

  const uid = v.user?.id
  const authed = Boolean(v.user)
  const [offers, similar, rating, reviews, favRow, promo] = await Promise.all([
    cards({ lat: v.lat, lng: v.lng, userId: uid, normTitle: l.norm_title, unit: l.unit, sort: 'arzon', limit: 12 }),
    cards({ lat: v.lat, lng: v.lng, userId: uid, category: l.category, excludeId: l.id, sort: 'yaqin', limit: 12 }),
    bizRating(b.id),
    q<{ id: string; rating: number; body: string; tags: string[]; reply: string | null; created_at: Date; name: string; photo_url: string | null }>(
      `select r.id, r.rating, r.body, r.tags, r.reply, r.created_at, r.photo_url, u.name
       from reviews r join users u on u.id = r.user_id where r.listing_id = $1 order by r.created_at desc limit 20`,
      [l.id],
    ),
    uid ? one(`select 1 from favorites where user_id = $1 and listing_id = $2`, [uid, l.id]) : Promise.resolve(null),
    one<{ body: string; until: string | null }>(
      `select body, until from promotions where business_id = $1 and (until is null or until >= to_char(now() + interval '5 hours', 'YYYY-MM-DD')) order by created_at desc limit 1`,
      [b.id],
    ),
  ])
  const me = offers.find((o) => o.id === l.id)
  const cheapest = offers.length > 1 ? offers[0] : null
  const dist = me?.dist ?? haversineKm(v.lat, v.lng, b.lat, b.lng)
  const open = openState(b)
  const fresh = freshness(l.price_checked_at)
  const cat = categoryById(l.category)
  const lRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null
  const similarList = similar.filter((s) => s.norm_title !== l.norm_title).slice(0, 10)
  const route = yandexRoute(b.lat, b.lng)
  const sample = l.is_sample || b.is_sample

  const h = await headers()
  const ua = h.get('user-agent') || ''
  if (!isOwner && !BOT_RE.test(ua) && visible) after(() => logEvent(b.id, l.id, 'view', uid))

  const bestBox = (() => {
    if (!me || offers.length < 2) return null
    if (me.cheapest)
      return (
        <div className="bestbox green">
          <span className="ic-c">
            <Icon name="trend" />
          </span>
          <div>
            <b>Eng arzon narx</b>
            <p>Yaqin atrofdagi {offers.length} ta do‘kon ichida eng arzoni.</p>
          </div>
        </div>
      )
    if (me.best && cheapest)
      return (
        <div className="bestbox">
          <span className="ic-c">
            <Icon name="thumb" />
          </span>
          <div>
            <b>Eng foydali taklif</b>
            <p>
              {cheapest.dist - me.dist > 0.2 ? `Eng arzonidan ${km(cheapest.dist - me.dist)} yaqinroq — ` : 'Narx va masofa bo‘yicha eng yaxshisi — '}
              atigi {money(me.price - cheapest.price)} so‘m qimmat.
            </p>
          </div>
        </div>
      )
    if (cheapest && cheapest.price < l.price)
      return (
        <Link href={`/e/${cheapest.id}`} className="bestbox" style={{ background: 'var(--grey)' }}>
          <span className="ic-c" style={{ background: 'var(--green)' }}>
            <Icon name="trend" />
          </span>
          <div>
            <b style={{ color: 'var(--ink)' }}>Yaqin atrofda arzonroq bor</b>
            <p>
              {cheapest.biz_name} — {money(cheapest.price)} so‘m · {km(cheapest.dist)}
            </p>
          </div>
        </Link>
      )
    return null
  })()

  const chatBtn = (cls: string) =>
    sample ? (
      <DisabledAction icon="chat" label="Chat" reason="Namuna e’lon — chat o‘chiq" className={cls} />
    ) : isOwner ? (
      <Link href={`/biznes/elon/${l.id}`} className={cls}>
        <Icon name="pencil" /> Tahrirlash
      </Link>
    ) : (
      <form action={openChat.bind(null, l.id, null)} style={{ display: 'contents' }}>
        <button type="submit" className={cls}>
          <Icon name="chat" /> Chat
        </button>
      </form>
    )

  const bookBtn = (cls: string) =>
    sample ? (
      <DisabledAction icon="cal" label="Band qilish" reason="Namuna e’lon — band qilish o‘chiq" className={cls} />
    ) : (
      <Link href={`/band/${l.id}`} className={cls}>
        <Icon name="cal" /> Band qilish
      </Link>
    )

  const actionBar = (
    <div className="actionbar only-m">
      {b.phone && !isOwner && <CallButton phone={b.phone} listingId={l.id} businessId={b.id} />}
      {chatBtn('btn btn-soft')}
      {l.booking && !isOwner ? bookBtn('btn btn-primary') : <RouteButton href={route} listingId={l.id} businessId={b.id} />}
    </div>
  )

  return (
    <Shell
      top={
        <TopBack fallback="/">
          <ShareButton title={l.title} text={`${l.title} — ${money(l.price)} ${l.unit}`} listingId={l.id} />
          <FavButton id={l.id} on={Boolean(favRow)} authed={authed} large disabledReason={undefined} />
        </TopBack>
      }
      nav={null}
      sheet="withbar"
      cats
      footer
      after={actionBar}
    >
      <Crumbs items={[{ href: '/', label: 'Bosh sahifa' }, { href: `/qidiruv?k=${cat.id}`, label: cat.name }, { label: l.title }]} />
      {!visible && (
        <div className="note amber mb16">
          <Icon name="eyeoff" />
          <div>
            {l.status !== 'active'
              ? 'Bu e’lon hozir xaridorlarga ko‘rinmaydi (qoralama yoki yashirilgan).'
              : 'Obuna muddati tugagani uchun e’lon qidiruvda ko‘rinmayapti.'}{' '}
            {isOwner && (
              <Link href={l.status !== 'active' ? '/biznes/elonlar' : '/biznes/obuna'} className="link">
                Tuzatish
              </Link>
            )}
          </div>
        </div>
      )}
      <div className="ldesk">
        <div>
          <Gallery
            photos={l.photos || []}
            alt={l.title}
            badges={
              <>
                {sample && <span className="tag dark">Namuna</span>}
                {l.delivery && (
                  <span className="tag white">
                    <Icon name="truck" /> Yetkaziladi
                  </span>
                )}
                {!l.available && <span className="tag dark">Tugagan</span>}
              </>
            }
          />
        </div>
        <div>
          <div className="lhead">
            <div className="meta">
              <Link href={`/qidiruv?k=${cat.id}`} className="link">
                {cat.name}
              </Link>
              <span className={fresh.stale ? 'muted' : 'green'} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                <Icon name={fresh.stale ? 'clock' : 'checkc'} size={16} /> {fresh.text}
              </span>
            </div>
            <h1>{l.title}</h1>
            <div className="rat">
              {lRating != null ? (
                <a href="#izohlar" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <Rating value={lRating} count={reviews.length} showCount={false} />
                  <span style={{ textDecoration: 'underline' }}>{reviews.length} ta izoh</span>
                </a>
              ) : null}
              {l.kind === 'product' && (
                <span className={`tag ${l.available ? 'green' : ''}`}>
                  <span className={`dot${l.available ? '' : ' grey'}`} /> {l.available ? 'Mavjud' : 'Tugagan'}
                </span>
              )}
              {l.condition && <span className="tag">{l.condition === 'used' ? 'Ishlatilgan' : 'Yangi'}</span>}
            </div>
            <div className={`bigprice${me?.cheapest ? ' cheap' : ''}`}>
              {money(l.price)}
              <small>{l.unit}</small>
            </div>
            {l.price_old && l.price_old > l.price ? (
              <div className="oldprice">
                <s>{money(l.price_old)}</s> <span className="green b">↓ {money(l.price_old - l.price)} so‘m arzonladi</span>
              </div>
            ) : null}
            {bestBox}
          </div>

          <div className="dactions only-d">
            {l.booking && !isOwner ? bookBtn('btn btn-primary') : <RouteButton href={route} listingId={l.id} businessId={b.id} />}
            {chatBtn('btn btn-soft')}
            {b.phone && !isOwner && <RevealPhone phone={b.phone} listingId={l.id} businessId={b.id} />}
          </div>

          <Link href={`/b/${b.id}`} className="bc mt16">
            <Avatar name={b.name} color={b.color} src={b.logo_url} />
            <span className="grow">
              <span className="n" style={{ display: 'block' }}>
                {b.name}
              </span>
              <span className="c" style={{ display: 'block' }}>
                {rating.n > 0 && (
                  <>
                    ★ {ratingText(rating.rating)} ({rating.n} ta izoh) ·{' '}
                  </>
                )}
                {km(dist)} · {b.address}
              </span>
              <span className={`small b ${open.open ? 'green' : 'muted'}`} style={{ display: 'block', marginTop: 3 }}>
                {open.label}
              </span>
            </span>
            <Icon name="chev" />
          </Link>

          {l.delivery && (
            <div className="card mt12 flex gap12 center">
              <span className="itile green">
                <Icon name="truck" />
              </span>
              <div className="grow">
                <div className="b">Yetkazib berish bor{l.delivery_fee != null ? ` — ${l.delivery_fee > 0 ? money(l.delivery_fee) + ' so‘m' : 'bepul'}` : ''}</div>
                <div className="small muted">{[l.delivery_eta, l.delivery_area, 'do‘kon o‘zi yetkazadi'].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
          )}
          {promo && (
            <div className="promo-card mt12">
              <span className="itile">
                <Icon name="tag" />
              </span>
              <div>
                <div className="e">Aksiya{promo.until ? ` · ${dateLong(promo.until + 'T12:00:00Z')}gacha` : ''}</div>
                <b>{promo.body}</b>
              </div>
            </div>
          )}
          {sample && (
            <div className="note mt12">
              <Icon name="info" />
              <div>Bu namuna e’lon — sayt qanday ishlashini ko‘rsatish uchun. Chat va band qilish o‘chiq.</div>
            </div>
          )}
        </div>
      </div>

      {offers.length > 1 && (
        <section className="sec">
          <div className="sec-h">
            <div>
              <h2>Shu mahsulot yaqin atrofda</h2>
              <div className="sub">{offers.length} ta do‘kon · narxlarni do‘konlar o‘zi yangilaydi</div>
            </div>
          </div>
          <div className="offers">
            {offers.map((o) => (
              <Link key={o.id} href={`/e/${o.id}`} className={`offer${o.id === l.id ? ' me' : ''}`}>
                <Avatar name={o.biz_name} color={o.biz_color} src={o.biz_logo} size="sm" />
                <span className="grow">
                  <span className="n" style={{ display: 'block' }}>
                    {o.biz_name}
                  </span>
                  <span className="s" style={{ display: 'block' }}>
                    {km(o.dist)} · <span className={o.openState.open ? 'green b' : ''}>{o.openState.open ? 'Ochiq' : 'Yopiq'}</span>
                    {o.delivery ? ' · yetkazadi' : ''}
                  </span>
                </span>
                <span className={`p${o.cheapest ? ' cheap' : ''}`}>
                  {money(o.price)}
                  <span style={{ display: 'block' }}>
                    {o.id === l.id ? (
                      <span className="tag blue" style={{ height: 22, fontSize: 11 }}>
                        Siz ko‘ryapsiz
                      </span>
                    ) : o.cheapest ? (
                      <span className="tag solidgreen" style={{ height: 22, fontSize: 11 }}>
                        Eng arzon
                      </span>
                    ) : o.best ? (
                      <span className="tag blue" style={{ height: 22, fontSize: 11 }}>
                        Eng foydali
                      </span>
                    ) : null}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <Link href={`/qidiruv?q=${encodeURIComponent(l.title)}&view=xarita`} className="btn btn-soft btn-block mt12">
            <Icon name="map" /> Do‘konlarni xaritada ko‘rish
          </Link>
        </section>
      )}

      <div className="two">
        <section className="sec">
          <h2 className="mb12">Tavsif</h2>
          <div className="card">
            {l.description ? <p style={{ whiteSpace: 'pre-wrap', fontSize: 15 }}>{l.description}</p> : <p className="muted">Sotuvchi tavsif yozmagan.</p>}
            {(l.specs?.length || l.condition) && (
              <div className="mt8">
                {l.condition && !(l.specs || []).some((s) => s.k.toLowerCase() === 'holati') && (
                  <div className="kv">
                    <span className="k">Holati</span>
                    <span className="v">{l.condition === 'used' ? 'Ishlatilgan' : 'Yangi'}</span>
                  </div>
                )}
                {(l.specs || []).map((s, i) => (
                  <div key={i} className="kv">
                    <span className="k">{s.k}</span>
                    <span className="v">{s.v}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="kv">
              <span className="k">Ish vaqti</span>
              <span className="v">{hoursText(b)}</span>
            </div>
          </div>
        </section>

        <section className="sec" id="izohlar">
          <div className="sec-h">
            <h2>Izohlar</h2>
            {!isOwner && (
              <Link href={`/baho/${l.id}`} className="btn btn-outline btn-sm">
                <Icon name="star" size={16} /> Baho qoldirish
              </Link>
            )}
          </div>
          {reviews.length ? (
            <>
              <div className="rsum">
                <div>
                  <div className="big">{ratingText(lRating)}</div>
                  <Stars n={lRating || 0} />
                  <div className="small muted mt4">{reviews.length} ta baho</div>
                </div>
                <div className="bars">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const n = reviews.filter((r) => r.rating === s).length
                    return (
                      <div key={s} className="bar">
                        <span>{s}</span>
                        <i>
                          <b style={{ width: `${(n / reviews.length) * 100}%` }} />
                        </i>
                        <span>{n}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="mt12">
                {reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="review">
                    <div className="top">
                      <PersonAvatar name={r.name} size="sm" />
                      <div className="grow">
                        <div className="b">{shortName(r.name)}</div>
                        <div className="small muted">
                          {ago(r.created_at)} · <Stars n={r.rating} size={13} />
                        </div>
                      </div>
                    </div>
                    {r.body && <div className="body">{r.body}</div>}
                    {r.tags?.length ? (
                      <div className="chips wrap mt8">
                        {r.tags.map((t) => (
                          <span key={t} className="tag blue">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {r.reply && (
                      <div className="reply">
                        <b>
                          <Icon name="store" size={16} /> {b.name} javobi
                        </b>
                        {r.reply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {reviews.length > 3 && (
                <Link href={`/b/${b.id}?tab=izohlar`} className="linkbtn mt12">
                  Barcha {reviews.length} ta izohni ko‘rish <Icon name="chev" size={16} />
                </Link>
              )}
            </>
          ) : (
            <div className="card tc">
              <p className="muted">Hali izoh yo‘q. Xarid qilgan bo‘lsangiz, birinchi bo‘lib baho qoldiring.</p>
            </div>
          )}
        </section>
      </div>

      {similarList.length > 0 && (
        <section className="sec">
          <h2 className="mb12">O‘xshash takliflar</h2>
          <div className="hscroll">
            {similarList.map((c) => (
              <ProductCard key={c.id} c={c} authed={authed} />
            ))}
          </div>
        </section>
      )}

      <div className="flex between center mt24 wrap gap8">
        <span className="small muted">
          E’lon: {dateLong(l.created_at)} · {l.views} marta ko‘rilgan
        </span>
        {!isOwner && <ReportButton listingId={l.id} />}
      </div>
    </Shell>
  )
}
