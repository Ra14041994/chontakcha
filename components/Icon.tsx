import { ICONS, type IconName } from '@/lib/icons'

export type { IconName }

export function Icon({ name, size, className, style }: { name: IconName; size?: 14 | 16 | 18 | 20 | 22 | 24 | 28 | 32; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`ic${size && size !== 20 ? ' s' + size : ''}${className ? ' ' + className : ''}`}
      style={style}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}

const STAR = ICONS.star

export function Star({ on = true, size = 15 }: { on?: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ fill: on ? '#F59E0B' : '#DCE3EE', stroke: 'none', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: STAR }} />
  )
}

export function Stars({ n, size = 15 }: { n: number; size?: number }) {
  const r = Math.round(Number(n) || 0)
  return (
    <span className="stars" aria-label={`${r} yulduz`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} on={i < r} size={size} />
      ))}
    </span>
  )
}
