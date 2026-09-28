import Link from 'next/link'
import { initials, money, ratingText } from '@/lib/format'
import { Icon, Star, type IconName } from './Icon'

export function Avatar({ name, color, src, size, round, className }: { name: string; color?: string | null; src?: string | null; size?: 'sm' | 'lg' | 'xl'; round?: boolean; className?: string }) {
  return (
    <span className={`avatar${size ? ' ' + size : ''}${round ? ' round' : ''}${className ? ' ' + className : ''}`} style={{ background: src ? '#fff' : color || undefined }}>
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  )
}

export function PersonAvatar({ name, size }: { name: string; size?: 'sm' | 'lg' }) {
  return <span className={`avatar person round${size ? ' ' + size : ''}`}>{(name || 'X').trim().slice(0, 1).toUpperCase()}</span>
}

export function Price({ value, unit, cheap, className }: { value: number; unit: string; cheap?: boolean; className?: string }) {
  return (
    <span className={`${className || ''}${cheap ? ' cheap' : ''}`}>
      {money(value)}
      <small>{unit}</small>
    </span>
  )
}

export function Rating({ value, count, showCount = true }: { value: number | null; count: number; showCount?: boolean }) {
  if (!count || value == null) return <span className="muted small">Hali baho yo‘q</span>
  return (
    <span className="rating">
      <Star size={15} /> {ratingText(value)}
      {showCount && <span className="muted" style={{ fontWeight: 600 }}>({count})</span>}
    </span>
  )
}

export function OpenTag({ open, label, compact }: { open: boolean; label: string; compact?: boolean }) {
  return (
    <span className={`tag ${open ? 'green' : ''}`}>
      <span className={`dot${open ? '' : ' grey'}`} />
      {compact ? (open ? 'Ochiq' : 'Yopiq') : label}
    </span>
  )
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="itile">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function Note({ icon = 'info', tone, children, className }: { icon?: IconName; tone?: 'tint' | 'green' | 'amber' | 'red'; children: React.ReactNode; className?: string }) {
  return (
    <div className={`note${tone ? ' ' + tone : ''}${className ? ' ' + className : ''}`}>
      <Icon name={icon} />
      <div>{children}</div>
    </div>
  )
}

export function SecHead({ title, sub, href, more = 'Barchasi' }: { title: string; sub?: string; href?: string; more?: string }) {
  return (
    <div className="sec-h">
      <div>
        <h2>{title}</h2>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {href && (
        <Link href={href} className="more">
          {more} <Icon name="chev" size={16} />
        </Link>
      )}
    </div>
  )
}

export function Row({ href, icon, tone, title, sub, end, danger, chevron = true }: { href?: string; icon?: IconName; tone?: 'green' | 'red' | 'amber'; title: React.ReactNode; sub?: React.ReactNode; end?: React.ReactNode; danger?: boolean; chevron?: boolean }) {
  const inner = (
    <>
      {icon && (
        <span className={`itile${tone ? ' ' + tone : ''}`}>
          <Icon name={icon} />
        </span>
      )}
      <span className="grow">
        <span className="t" style={{ display: 'block' }}>{title}</span>
        {sub && <span className="s" style={{ display: 'block' }}>{sub}</span>}
      </span>
      {(end || chevron) && (
        <span className="end">
          {end}
          {chevron && href && <Icon name="chev" size={18} />}
        </span>
      )}
    </>
  )
  return href ? (
    <Link href={href} className={`row${danger ? ' danger' : ''}`}>
      {inner}
    </Link>
  ) : (
    <div className={`row${danger ? ' danger' : ''}`}>{inner}</div>
  )
}

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Yo‘l">
      {items.map((it, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span>/</span>}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <b>{it.label}</b>}
        </span>
      ))}
    </nav>
  )
}
