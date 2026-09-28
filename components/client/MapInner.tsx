'use client'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { MapProps } from './MapView'

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default function MapInner({ points, center, zoom = 14, me, interactive = true, fit = true, selected, onSelect, pick, onPick }: MapProps) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const pickMarker = useRef<L.Marker | null>(null)
  const onSelectRef = useRef(onSelect)
  const onPickRef = useRef(onPick)
  onSelectRef.current = onSelect
  onPickRef.current = onPick

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
    map.current = m
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(el.current)
    return () => {
      ro.disconnect()
      m.remove()
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const m = map.current
    const lg = layer.current
    if (!m || !lg) return
    lg.clearLayers()
    const bounds: L.LatLngExpression[] = []
    for (const p of points) {
      const tone = p.id === selected ? 'sel' : p.tone && p.tone !== 'default' ? p.tone : ''
      const icon = L.divIcon({
        className: 'pin-wrap',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        html: `<div class="pin ${tone}" title="${escHtml(p.title || p.label)}">${escHtml(p.label)}</div>`,
      })
      const mk = L.marker([p.lat, p.lng], { icon, zIndexOffset: p.id === selected ? 1000 : p.tone === 'cheap' ? 500 : 0, keyboard: false })
      mk.on('click', () => onSelectRef.current?.(p.id))
      mk.addTo(lg)
      bounds.push([p.lat, p.lng])
    }
    if (me) {
      L.marker(me, { icon: L.divIcon({ className: 'pin-wrap', iconSize: [0, 0], iconAnchor: [0, 0], html: '<div class="me-dot" style="transform:translate(-50%,-50%)"></div>' }), interactive: false }).addTo(lg)
    }
    if (fit && bounds.length > 1) {
      if (me) bounds.push(me)
      m.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 16 })
    } else if (fit && bounds.length === 1) {
      m.setView(bounds[0], Math.max(m.getZoom(), 15))
    }
  }, [points, selected, me, fit])

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
