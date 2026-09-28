'use client'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { MapPoint, MapProps } from './MapView'

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

type PinRef = { id: string; mk: L.Marker; tone: string; z: number }

const pinEl = (p: PinRef) => (p.mk.getElement()?.firstElementChild as HTMLElement | null) ?? null
const baseZ = (tone: string) => (tone === 'sel' ? 1000 : tone === 'cheap' ? 500 : 0)

/** Tanlangan belgini ajratib ko‘rsatadi (belgilarni qayta chizmasdan). */
function applySelected(list: PinRef[], selected: string | null | undefined) {
  for (const p of list) {
    const el = pinEl(p)
    const tone = p.id === selected ? 'sel' : p.tone
    p.z = baseZ(tone)
    if (el) el.className = 'pin' + (tone ? ' ' + tone : '')
  }
}

/**
 * Ustma-ust tushgan narx belgilarini kichik nuqtaga aylantiradi.
 * Avval tanlangan, keyin eng arzon, keyin qolganlari joy oladi; kattalashtirilganda qayta hisoblanadi.
 */
function declutter(list: PinRef[]) {
  const els = list.map(pinEl)
  for (const e of els) e?.classList.remove('dot', 'hid')
  const rects = els.map((e) => e?.getBoundingClientRect() ?? null)
  const order = list.map((_, i) => i).sort((a, b) => list[b].z - list[a].z || a - b)
  type Box = { left: number; right: number; top: number; bottom: number }
  const hits = (r: Box, t: Box, g: number) => r.left < t.right + g && r.right > t.left - g && r.top < t.bottom + g && r.bottom > t.top - g
  const taken: Box[] = []
  const dot: boolean[] = list.map(() => false)
  for (const i of order) {
    const r = rects[i]
    if (!r || !r.width) continue
    if (taken.some((t) => hits(r, t, 3))) dot[i] = true
    else taken.push(r)
  }
  list.forEach((p, i) => {
    const e = els[i]
    const r = rects[i]
    if (dot[i] && e && r) {
      e.classList.add('dot')
      // Nuqta to‘liq belgi ostida qolsa — umuman ko‘rsatilmaydi (chetidan “dumcha” chiqib turmasin)
      const cx = r.left + r.width / 2
      const box = { left: cx - 7, right: cx + 7, top: r.bottom - 7, bottom: r.bottom + 7 }
      if (taken.some((t) => hits(box, t, 1))) e.classList.add('hid')
    }
    p.mk.setZIndexOffset(dot[i] ? -1000 : p.z)
  })
}

export default function MapInner({ points, center, zoom = 14, me, interactive = true, fit = true, selected, onSelect, pick, onPick }: MapProps) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const pins = useRef<PinRef[]>([])
  const pickMarker = useRef<L.Marker | null>(null)
  const onSelectRef = useRef(onSelect)
  const onPickRef = useRef(onPick)
  const selectedRef = useRef(selected)
  onSelectRef.current = onSelect
  onPickRef.current = onPick
  selectedRef.current = selected

  useEffect(() => {
    if (!el.current || map.current) return
    const m = L.map(el.current, {
      center,
      zoom,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive ? 'center' : false,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: false,
      keyboard: interactive,
      attributionControl: true,
    })
    if (interactive) m.zoomControl.setPosition('bottomright')
    m.attributionControl.setPrefix(false)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    if (onPickRef.current) {
      m.on('click', (e: L.LeafletMouseEvent) => onPickRef.current?.(e.latlng.lat, e.latlng.lng))
    }
    m.on('zoomend', () => declutter(pins.current))
    map.current = m
    let raf = 0
    const ro = new ResizeObserver(() => {
      m.invalidateSize()
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => declutter(pins.current))
    })
    ro.observe(el.current)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      m.remove()
      map.current = null
      pins.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Belgilar faqat nuqtalar o‘zgarganda qayta chiziladi va xarita shunda moslanadi
  // (tanlash yoki kartaga sichqoncha olib borish xaritani qayta siljitmaydi).
  useEffect(() => {
    const m = map.current
    const lg = layer.current
    if (!m || !lg) return
    lg.clearLayers()
    const list: PinRef[] = []
    const bounds: L.LatLngExpression[] = []
    for (const p of points as MapPoint[]) {
      const tone = p.tone && p.tone !== 'default' ? p.tone : ''
      const icon = L.divIcon({
        className: 'pin-wrap',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        html: `<div class="pin${tone ? ' ' + tone : ''}" title="${escHtml(p.title || p.label)}">${escHtml(p.label)}</div>`,
      })
      const mk = L.marker([p.lat, p.lng], { icon, zIndexOffset: baseZ(tone), keyboard: false })
      mk.on('click', () => onSelectRef.current?.(p.id))
      mk.addTo(lg)
      list.push({ id: p.id, mk, tone, z: baseZ(tone) })
      bounds.push([p.lat, p.lng])
    }
    pins.current = list
    applySelected(list, selectedRef.current)
    if (me) {
      L.marker(me, { icon: L.divIcon({ className: 'pin-wrap', iconSize: [0, 0], iconAnchor: [0, 0], html: '<div class="me-dot" style="transform:translate(-50%,-50%)"></div>' }), interactive: false }).addTo(lg)
    }
    if (fit && bounds.length > 1) {
      if (me) bounds.push(me)
      m.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 16 })
    } else if (fit && bounds.length === 1) {
      m.setView(bounds[0], Math.max(m.getZoom(), 15))
    }
    const raf = requestAnimationFrame(() => declutter(list))
    return () => cancelAnimationFrame(raf)
  }, [points, me, fit])

  useEffect(() => {
    applySelected(pins.current, selected)
    declutter(pins.current)
  }, [selected])

  useEffect(() => {
    const m = map.current
    if (!m) return
    if (pick) {
      const icon = L.divIcon({ className: 'pin-wrap', iconSize: [0, 0], iconAnchor: [0, 0], html: '<div class="pin biz">Do‘kon</div>' })
      if (!pickMarker.current) {
        pickMarker.current = L.marker(pick, { icon, draggable: true }).addTo(m)
        pickMarker.current.on('dragend', () => {
          const ll = pickMarker.current!.getLatLng()
          onPickRef.current?.(ll.lat, ll.lng)
        })
      } else {
        pickMarker.current.setLatLng(pick)
      }
    }
  }, [pick])

  return <div ref={el} style={{ position: 'absolute', inset: 0 }} />
}
