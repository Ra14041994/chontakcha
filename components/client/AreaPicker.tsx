'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AREAS, haversineKm } from '@/lib/geo'
import { Icon } from '../Icon'
import { Drawer } from './Drawer'
import { toast } from './Toaster'

export function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

export function locateMe(onDone: (ok: boolean, areaId?: string) => void) {
  if (!('geolocation' in navigator)) {
    toast('Qurilmangiz joylashuvni aniqlay olmaydi')
    onDone(false)
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      const nearest = [...AREAS].sort((a, b) => haversineKm(lat, lng, a.lat, a.lng) - haversineKm(lat, lng, b.lat, b.lng))[0]
      if (haversineKm(lat, lng, nearest.lat, nearest.lng) > 80) {
        toast('Siz xizmat hududidan uzoqdasiz — hudud markazidan hisoblaymiz')
        setCookie('ch_area', nearest.id, 31536000)
        onDone(true, nearest.id)
        return
      }
      setCookie('ch_loc', `${lat.toFixed(5)},${lng.toFixed(5)}`, 60 * 60 * 24 * 30)
      setCookie('ch_area', nearest.id, 31536000)
      onDone(true, nearest.id)
    },
    () => {
      toast('Joylashuvga ruxsat berilmadi')
      onDone(false)
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
  )
}

export function AreaPicker({ current, label, grow }: { current: string; label: string; grow?: boolean }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  function choose(id: string) {
    setCookie('ch_area', id, 31536000)
    document.cookie = 'ch_loc=; path=/; max-age=0'
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button type="button" className="area-pill" style={grow ? { flex: 1 } : undefined} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Icon name="pin" />
        <span>{label}</span>
        <Icon name="chevd" size={18} />
      </button>
      {open && (
        <Drawer title="Hududni tanlang" onClose={() => setOpen(false)}>
          <div className="list">
            {AREAS.map((a) => (
              <button key={a.id} type="button" className="row" onClick={() => choose(a.id)}>
                <span className="itile">
                  <Icon name="pin" />
                </span>
                <span className="grow">
                  <span className="t" style={{ display: 'block' }}>{a.label}</span>
                </span>
                {a.id === current && <Icon name="check" className="green" />}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-soft btn-block mt12"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              locateMe((ok) => {
                setBusy(false)
                if (ok) {
                  setOpen(false)
                  router.refresh()
                  toast('Masofalar joylashuvingizdan hisoblanadi')
                }
              })
            }}
          >
            {busy ? <span className="spinner" /> : <Icon name="locate" />} Joylashuvimni aniqlash
          </button>
          <p className="hint tc mt8">Masofalar tanlangan hudud markazidan yoki joylashuvingizdan hisoblanadi.</p>
        </Drawer>
      )}
    </>
  )
}
