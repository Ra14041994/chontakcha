import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { one, q } from '@/lib/db'
import { cards, getBusiness, businessVisible, bizRating } from '@/lib/listings'
import { getViewer } from '@/lib/session'
import { ago, dateLong, km, money, ratingText, shortName } from '@/lib/format'
import { openState, hoursText } from '@/lib/hours'
import { haversineKm, yandexRoute } from '@/lib/geo'
import { absUrl } from '@/lib/url'
import { Shell, TopBack } from '@/components/shell'
import { Icon, Stars } from '@/components/Icon'
import { Avatar, Crumbs, Empty, PersonAvatar } from '@/components/ui'
import { ProductCard } from '@/components/cards'
import { ShareButton } from '@/components/client/ShareButton'
import { FollowButton } from '@/components/client/FollowButton'
import { CallButton, DisabledAction, RevealPhone, RouteButton } from '@/components/client/ContactActions'
import { HeroMap } from '@/components/client/HeroMap'
import { openChat } from '@/app/_actions/chat'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const b = await getBusiness(id)
  if (!b) return { title: 'Biznes topilmadi' }
  const photo = await one<{ p: string | null }>(`select photos->>0 as p from listings where business_id = $1 and status = 'active' order by views desc limit 1`, [id])
  const img = absUrl(b.logo_url || photo?.p)
  return {
    title: b.name,
    description: `${b.category} · ${b.address} · Cho‘ntakcha`,
    openGraph: { title: b.name, description: `${b.category} · ${b.address}`, images: img ? [img] : undefined },
  }
}

export default async function BusinessPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab = '' } = await searchParams
  const v = await getViewer()
  const b = await getBusiness(id)
  if (!b || b.status === 'deleted') notFound()
  const isOwner = Boolean(v.user && b.owner_id === v.user.id)
  if (!businessVisible(b) && !isOwner && !v.user?.is_admin) notFound()
  const uid = v.user?.id
  const authed = Boolean(v.user)

  const [items, rating, reviews, stats, promo] = await Promise.all([
    cards({ lat: v.lat, lng: v.lng, userId: uid, businessId: b.id, sort: 'yangi', limit: 200 }),
    bizRating(b.id),
    q<{ id: string; rating: number; body: string; tags: string[]; reply: string | null; created_at: Date; name: string; l_title: string | null }>(
      `select r.id, r.rating, r.body, r.tags, r.reply, r.created_at, u.name, l.title as l_title
       from reviews r join users u on u.id = r.user_id left join listings l on l.id = r.listing_id
       where r.business_id = $1 order by r.created_at desc limit 50`,
      [b.id],
    ),
    one<{ followers: number; following: boolean }>(
      `select (select count(*)::int from follows where business_id = $1) as followers,
              exists (select 1 from follows where business_id = $1 and user_id = $2) as following`,
      [b.id, uid || null],
    ),
    one<{ body: string; until: string | null }>(
      `select body, until from promotions where business_id = $1 and (until is null or until >= to_char(now() + interval '5 hours', 'YYYY-MM-DD')) order by created_at desc limit 1`,
      [b.id],
    ),
  ])
  const products = items.filter((c) => c.kind === 'product')
  const services = items.filter((c) => c.kind === 'service')
  const active = ['mahsulotlar', 'xizmatlar', 'izohlar', 'malumot'].includes(tab) ? tab : products.length ? 'mahsulotlar' : services.length ? 'xizmatlar' : 'malumot'
  const open = openState(b)
  const dist = haversineKm(v.lat, v.lng, b.lat, b.lng)
  const route = yandexRoute(b.lat, b.lng)
  const covers = items.filter((c) => c.photo).slice(0, 3)

  const tabLink = (k: string, label: string, n?: number) => (
    <Link href={`/b/${b.id}?tab=${k}`} className={active === k ? 'on' : ''} replace scroll={false}>
      {label} {n != null && <span className="cnt">{n}</span>}
    </Link>
  )

  return (
    <Shell
      top={
        <TopBack fallback="/">
          <ShareButton title={b.name} text={`${b.name} — ${b.category}`} businessId={b.id} />
        </TopBack>
      }
      nav={null}
      sheet="nonav"
      footer
    >
      <div className="bcover" style={{ backgroundImage: 'var(--g)', backgroundColor: '#376aca' }}>
        <div className="cuts">
          {covers.map((c) => (
            <img key={c.id} src={c.photo!} alt="" style={{ height: 110, width: 110, objectFit: 'cover', borderRadius: 18, border: '3px solid rgba(255,255,255,.7)', marginLeft: 8, filter: 'none' }} />
          ))}
        </div>
      </div>
      <div className="bhead">
        <div>
          <Avatar name={b.name} color={b.color} src={b.logo_url} size="xl" />
          <Crumbs items={[{ href: '/', label: 'Bosh sahifa' }, { href: '/qidiruv?tur=biznes', label: 'Bizneslar' }, { label: b.name }]} />
          <h1>{b.name}</h1>
          <div className="muted mt4">{b.category}</div>
          <div className="flex center gap8 wrap mt8 small">
            {rating.n > 0 && (
              <Link href={`/b/${b.id}?tab=izohlar`} className="rating">
                <Stars n={rating.rating || 0} size={14} /> {ratingText(rating.rating)} <span className="muted">({rating.n} ta izoh)</span>
              </Link>
            )}
            <span className="muted">{km(dist)}</span>
          </div>
          <div className="flex center gap8 wrap mt6 small">
            <span className={`b ${open.open ? 'green' : 'muted'}`}>
              <span className={`dot${open.open ? '' : ' grey'}`} /> {open.label}
            </span>
            <span className="muted">· {b.address}</span>
          </div>
        </div>
        <div className="bactions">
          {b.phone && !isOwner ? (
            <CallButton phone={b.phone} businessId={b.id} className="" withText />
          ) : (
            <span style={{ height: 68, borderRadius: 16, background: 'var(--grey)', color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: 700, fontSize: 13 }}>
              <Icon name="phone" size={22} /> Qo‘ng‘iroq
            </span>
          )}
          {b.is_sample ? (
            <DisabledAction icon="chat" label="Chat" reason="Namuna biznes — chat o‘chiq" className="" />
          ) : isOwner ? (
            <Link href="/biznes/malumot">
              <Icon name="pencil" size={22} /> Tahrirlash
            </Link>
          ) : (
            <form action={openChat.bind(null, null, b.id)} style={{ display: 'contents' }}>
              <button type="submit">
                <Icon name="chat" size={22} /> Chat
              </button>
            </form>
          )}
          <RouteButton href={route} businessId={b.id} className="" label="Yo‘nalish" />
          {isOwner ? (
            <Link href="/biznes" className="on">
              <Icon name="dash" size={22} /> Panel
            </Link>
          ) : (
            <FollowButton id={b.id} on={Boolean(stats?.following)} authed={authed} />
          )}
        </div>
      </div>

      <div className="infochips">
        {b.delivery && (
          <span className="tag">
            <Icon name="truck" /> Yetkazib berish
          </span>
        )}
        <span className="tag">
          <Icon name="clock" /> {hoursText(b)}
        </span>
        <span className="tag">
          <Icon name="users" /> {stats?.followers ?? 0} kuzatuvchi
        </span>
        {b.is_sample && <span className="tag">Namuna</span>}
      </div>

      {promo && (
        <div className="promo-card mt16">
          <span className="itile">
            <Icon name="tag" />
          </span>
          <div>
            <div className="e">Aksiya{promo.until ? ` · ${dateLong(promo.until + 'T12:00:00Z')}gacha` : ''}</div>
            <b>{promo.body}</b>
          </div>
        </div>
      )}

      <div className="tabs mt20">
        {(products.length > 0 || !services.length) && tabLink('mahsulotlar', 'Mahsulotlar', products.length)}
        {services.length > 0 && tabLink('xizmatlar', 'Xizmatlar', services.length)}
        {tabLink('izohlar', 'Izohlar', rating.n)}
        {tabLink('malumot', 'Ma’lumot')}
      </div>

      {(active === 'mahsulotlar' || active === 'xizmatlar') &&
        ((active === 'mahsulotlar' ? products : services).length ? (
          <div className="pgrid">
            {(active === 'mahsulotlar' ? products : services).map((c) => (
              <ProductCard key={c.id} c={c} authed={authed} />
            ))}
          </div>
        ) : (
          <Empty icon="box" title={active === 'mahsulotlar' ? 'Mahsulotlar yo‘q' : 'Xizmatlar yo‘q'} text="Bu biznes hali e’lon joylamagan." />
        ))}

      {active === 'izohlar' && (
        <div>
          {!isOwner && items[0] && (
            <Link href={`/baho?b=${b.id}`} className="btn btn-outline btn-block mb12">
              <Icon name="star" size={18} /> Baho qoldirish
            </Link>
          )}
          {reviews.length ? (
            reviews.map((r) => (
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
                {r.l_title && <div className="small muted mt8">{r.l_title}</div>}
                {r.body && <div className="body">{r.body}</div>}
                {r.reply && (
                  <div className="reply">
                    <b>
                      <Icon name="store" size={16} /> {b.name} javobi
                    </b>
                    {r.reply}
                  </div>
                )}
              </div>
            ))
          ) : (
            <Empty icon="star" title="Hali izoh yo‘q" text="Bu biznesdan xarid qilgan bo‘lsangiz, tajribangiz bilan bo‘lishing." />
          )}
        </div>
      )}

      {active === 'malumot' && (
        <div className="two" style={{ marginTop: 0 }}>
          <div className="card">
            {b.about && <p style={{ whiteSpace: 'pre-wrap' }}>{b.about}</p>}
            <div className="kv">
              <span className="k">Manzil</span>
              <span className="v">{b.address}</span>
            </div>
            <div className="kv">
              <span className="k">Ish vaqti</span>
              <span className="v">{hoursText(b)}</span>
            </div>
            {b.delivery && (
              <div className="kv">
                <span className="k">Yetkazib berish</span>
                <span className="v">{[b.delivery_fee != null ? (b.delivery_fee > 0 ? `${money(b.delivery_fee)} so‘m` : 'bepul') : null, b.delivery_eta, b.delivery_area].filter(Boolean).join(' · ') || 'Bor'}</span>
              </div>
            )}
            <div className="kv">
              <span className="k">Cho‘ntakcha’da</span>
              <span className="v">{dateLong(b.created_at)}dan beri</span>
            </div>
            <div className="btns mt12">
              <RouteButton href={route} businessId={b.id} />
              {b.phone && !isOwner && <RevealPhone phone={b.phone} businessId={b.id} />}
            </div>
          </div>
          <div className="mapbox" style={{ height: 300, position: 'relative' }}>
            <HeroMap points={[{ id: b.id, lat: b.lat, lng: b.lng, label: b.name, tone: 'biz' }]} center={[b.lat, b.lng]} link={false} interactive zoom={16} />
          </div>
        </div>
      )}
    </Shell>
  )
}
