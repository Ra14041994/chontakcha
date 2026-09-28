'use client'
import { useRef, useState } from 'react'
import { Icon } from '../Icon'

export function Gallery({ photos, alt, badges }: { photos: string[]; alt: string; badges?: React.ReactNode }) {
  const [i, setI] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const go = (n: number) => {
    const el = track.current
    if (!el) return
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
    setI(n)
  }
  if (!photos.length) {
    return (
      <div className="gallery">
        <div style={{ aspectRatio: '1 / 0.86', display: 'grid', placeItems: 'center', color: '#9aa3b5' }}>
          <Icon name="image" size={32} />
        </div>
        {badges && <div className="tl">{badges}</div>}
      </div>
    )
  }
  return (
    <div>
      <div className="gallery">
        <div
          className="track"
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget
            const n = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
            if (n !== i) setI(n)
          }}
        >
          {photos.map((p, k) => (
            <img key={p + k} src={p} alt={k === 0 ? alt : ''} loading={k === 0 ? 'eager' : 'lazy'} decoding="async" />
          ))}
        </div>
        {badges && <div className="tl">{badges}</div>}
        {photos.length > 1 && (
          <span className="cnt tag dark">
            {i + 1} / {photos.length}
          </span>
        )}
      </div>
      {photos.length > 1 && (
        <div className="thumbs">
          {photos.slice(0, 5).map((p, k) => (
            <button key={p + k} type="button" className={k === i ? 'on' : ''} onClick={() => go(k)} aria-label={`${k + 1}-rasm`}>
              <img src={p} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
