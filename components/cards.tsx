import Link from 'next/link'
import type { BizCard as BizCardT, Card } from '@/lib/listings'
import { km, money } from '@/lib/format'
import { Icon } from './Icon'
import { Avatar, OpenTag, Rating } from './ui'
import { FavButton } from './client/FavButton'

function ImgBadge({ c, groupInfo }: { c: Card; groupInfo?: boolean }) {
  if (!c.available) return <span className="tag dark">Tugagan</span>
  if (c.cheapest)
    return (
      <span className="tag solidgreen">
        <Icon name="trend" /> Eng arzon{groupInfo && c.gcount > 1 ? ` · ${c.gcount} do‘kon` : ''}
      </span>
    )
  if (c.best)
    return (
      <span className="tag white" style={{ color: 'var(--link)' }}>
        <Icon name="thumb" /> Eng foydali
      </span>
    )
  if (c.booking)
    return (
      <span className="tag white">
        <Icon name="cal" /> Band qilish
      </span>
    )
  if (c.delivery)
    return (
      <span className="tag white">
        <Icon name="truck" /> Yetkaziladi
      </span>
    )
  return null
}

export function ProductCard({ c, authed, groupInfo, priority }: { c: Card; authed: boolean; groupInfo?: boolean; priority?: boolean }) {
  return (
    <div className={`pc${c.available ? '' : ' sold'}`}>
      <Link href={`/e/${c.id}`} className="ph" prefetch={false}>
        {c.photo ? (
          <img src={c.photo} alt={c.title} loading={priority ? 'eager' : 'lazy'} decoding="async" />
        ) : (
          <span className="noimg">
            <Icon name="image" size={32} />
          </span>
        )}
        {c.is_sample && (
          <span className="tl">
            <span className="tag dark">Namuna</span>
          </span>
        )}
        <span className="bl">
          <ImgBadge c={c} groupInfo={groupInfo} />
        </span>
      </Link>
      <div className="fav">
        <FavButton id={c.id} on={c.fav} authed={authed} />
      </div>
      <Link href={`/e/${c.id}`} prefetch={false}>
        <div className={`pr${c.cheapest ? ' cheap' : ''}`}>
          {money(c.price)}
          <small>{c.unit}</small>
        </div>
        {c.price_old && c.price_old > c.price ? (
          <div className="old">
            {money(c.price_old)} <span className="green" style={{ textDecoration: 'none' }}>↓ {money(c.price_old - c.price)}</span>
          </div>
        ) : null}
        <div className="ti ellipsis">{c.title}</div>
        <div className="me">
          <Icon name="pin" size={14} />
          <span className="ellipsis">
            {km(c.dist)} · {c.biz_name}
          </span>
        </div>
      </Link>
    </div>
  )
}

export function RowCard({ c, authed }: { c: Card; authed: boolean }) {
  return (
    <div className="rc">
      <Link href={`/e/${c.id}`} className="ph" prefetch={false}>
        {c.photo ? <img src={c.photo} alt="" loading="lazy" decoding="async" /> : null}
        {c.is_sample && (
          <span style={{ position: 'absolute', left: 6, top: 6 }}>
            <span className="tag dark" style={{ height: 22, fontSize: 11 }}>
              Namuna
            </span>
          </span>
        )}
      </Link>
      <Link href={`/e/${c.id}`} className="bd" prefetch={false}>
        <div className="ti ellipsis">{c.title}</div>
        <div className={`pr${c.cheapest ? ' cheap' : ''}`}>
          {money(c.price)}
          <small>{c.unit}</small>
        </div>
        <div className="me">
          <span className="ellipsis" style={{ maxWidth: '100%' }}>
            {c.biz_name}
            {c.reviews > 0 && c.rating != null ? ` · ★ ${c.rating.toFixed(1).replace('.', ',')}` : ''} · {km(c.dist)}
          </span>
        </div>
        <div className="tags">
          {!c.available && <span className="tag dark">Tugagan</span>}
          {c.cheapest && (
            <span className="tag solidgreen">
              <Icon name="trend" /> Eng arzon
            </span>
          )}
          {c.best && (
            <span className="tag blue">
              <Icon name="thumb" /> Eng foydali
            </span>
          )}
          <OpenTag open={c.openState.open} label={c.openState.label} compact={c.openState.open} />
          {c.delivery && (
            <span className="tag">
              <Icon name="truck" /> Yetkaziladi
            </span>
          )}
          {c.booking && (
            <span className="tag blue">
              <Icon name="cal" /> Band qilish
            </span>
          )}
        </div>
      </Link>
      <div className="fav">
        <FavButton id={c.id} on={c.fav} authed={authed} />
      </div>
    </div>
  )
}

export function BizCardView({ b }: { b: BizCardT }) {
  return (
    <Link href={`/b/${b.id}`} className="bc" prefetch={false}>
      <Avatar name={b.name} color={b.color} src={b.logo_url} />
      <span className="grow">
        <span className="n ellipsis" style={{ display: 'block' }}>
          {b.name}
        </span>
        <span className="c ellipsis" style={{ display: 'block' }}>
          {b.category}
        </span>
        <span className="m">
          {b.reviews > 0 && <Rating value={b.rating} count={b.reviews} />}
          <span>{km(b.dist)}</span>
          <OpenTag open={b.openState.open} label={b.openState.label} compact />
          {b.is_sample && <span className="tag">Namuna</span>}
        </span>
      </span>
    </Link>
  )
}
