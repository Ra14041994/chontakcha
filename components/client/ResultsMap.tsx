'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { km, money, priceShort, unitTail } from '@/lib/format'
import { Icon } from '../Icon'
import { MapView, type MapPoint } from './MapView'

export type MapItem = {
  id: string
  title: string
  price: number
  unit: string
  photo: string | null
  biz_id: string
  biz_name: string
  lat: number
  lng: number
  dist: number
  cheapest: boolean
  open: boolean
  is_sample: boolean
}

export function ResultsMap({ items, center, me, listHref }: { items: MapItem[]; center: [number, number]; me: [number, number] | null; listHref?: string }) {
  const groups = useMemo(() => {
    const m = new Map<string, MapItem[]>()
    for (const it of items) {
      const arr = m.get(it.biz_id) || []
      arr.push(it)
      m.set(it.biz_id, arr)
    }
    return m
  }, [items])
  const points: MapPoint[] = useMemo(
    () =>
      [...groups.entries()].map(([bizId, arr]) => {
        const best = [...arr].sort((a, b) => a.price - b.price)[0]
        return {
          id: bizId,
          lat: best.lat,
          lng: best.lng,
          label: priceShort(best.price) + unitTail(best.unit) + (arr.length > 1 ? ` +${arr.length - 1}` : ''),
          tone: arr.some((x) => x.cheapest) ? 'cheap' : 'default',
          title: best.biz_name,
        }
      }),
    [groups],
  )
  // sel — belgi bosilganda ro‘yxat shu do‘konga toraytiriladi; hover — kartaga sichqoncha olib borilganda belgi faqat ajratiladi.
  const [sel, setSel] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const shown = sel ? groups.get(sel) || [] : items
  const selName = sel ? groups.get(sel)?.[0]?.biz_name : null
  return (
    <div className="map-layout">
      <div className="map-sheet">
        {listHref && (
          <div className="flex center between mb8 only-m" style={{ pointerEvents: 'auto' }}>
            <span className="tag white">{items.length} ta natija</span>
            <Link href={listHref} className="btn btn-white btn-sm" style={{ boxShadow: 'var(--shadow)' }}>
              <Icon name="list" size={18} /> Ro‘yxat
            </Link>
          </div>
        )}
        {selName && (
          <div className="mb8" style={{ pointerEvents: 'auto' }}>
            <button type="button" className="chip on sm" onClick={() => setSel(null)} aria-label="Barcha natijalarni ko‘rsatish">
              {selName} <Icon name="x" size={14} />
            </button>
          </div>
        )}
        <div className="map-strip">
          {shown.slice(0, 60).map((it) => (
            <Link key={it.id} href={`/e/${it.id}`} className="map-card" onMouseEnter={() => setHover(it.biz_id)} onMouseLeave={() => setHover(null)}>
              <span className="ph">{it.photo ? <img src={it.photo} alt="" loading="lazy" /> : null}</span>
              <span className="grow" style={{ minWidth: 0 }}>
                <span className="b ellipsis" style={{ display: 'block' }}>
                  {it.title}
                </span>
                <span className={`xb${it.cheapest ? ' green' : ''}`} style={{ display: 'block', fontSize: 17 }}>
                  {money(it.price)} <small className="muted" style={{ fontWeight: 600 }}>{it.unit}</small>
                </span>
                <span className="small muted ellipsis" style={{ display: 'block' }}>
                  {km(it.dist)} · {it.biz_name} · <span className={it.open ? 'green b' : ''}>{it.open ? 'Ochiq' : 'Yopiq'}</span>
                </span>
              </span>
            </Link>
          ))}
          {!shown.length && <div className="map-card">Bu hududda natija yo‘q</div>}
        </div>
      </div>
      <div className="map-full mapbox" style={{ borderRadius: 0, border: 0 }}>
        <MapView points={points} center={center} zoom={14} me={me} selected={sel ?? hover} onSelect={(id) => setSel((x) => (x === id ? null : id))} />
      </div>
    </div>
  )
}
