'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { saveBusiness } from '@/app/_actions/seller'
import { BUSINESS_TYPES } from '@/lib/categories'
import { AREAS } from '@/lib/geo'
import { money } from '@/lib/format'
import type { BusinessInput } from '@/lib/seller-types'
import { Icon } from '../Icon'
import { MapView } from './MapView'
import { toast } from './Toaster'
import { uploadImage } from './upload'

const DAY_NAMES = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

export function BusinessForm({ initial }: { initial: BusinessInput }) {
  const [b, setBiz] = useState<BusinessInput>({ ...initial, phone: initial.phone ? initial.phone.replace(/^\+998/, '') : '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const router = useRouter()
  const set = (p: Partial<BusinessInput>) => setBiz((x) => ({ ...x, ...p }))
  const types = BUSINESS_TYPES.includes(b.category) ? BUSINESS_TYPES : [b.category, ...BUSINESS_TYPES]
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setErr(null)
        start(async () => {
          const r = await saveBusiness({ ...b, phone: b.phone ? '+998' + b.phone.replace(/\D/g, '').slice(-9) : '' })
          if (r.ok) {
            toast('Saqlandi')
            router.push('/biznes')
            router.refresh()
          } else {
            setErr(r.error || 'Xatolik')
            toast(r.error || 'Xatolik')
          }
        })
      }}
    >
      <div className="flex gap12 center">
        <label className="addph" style={{ width: 84, height: 84, aspectRatio: 'auto', cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
          {b.logo_url ? <img src={b.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : busy ? <span className="spinner" /> : <><Icon name="camera" /> Logo</>}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              setBusy(true)
              try {
                set({ logo_url: await uploadImage(f, 'b', 512) })
              } catch (x) {
                const m = x instanceof Error ? x.message : 'Yuklanmadi'
                setErr(m)
                toast(m)
              } finally {
                setBusy(false)
              }
            }}
          />
        </label>
        <div className="grow">
          <b>Logo yoki do‘kon rasmi</b>
          <div className="small muted">Kvadrat rasm yaxshi ko‘rinadi.</div>
          {b.logo_url && (
            <button type="button" className="linkbtn mt4" onClick={() => set({ logo_url: null })}>
              Olib tashlash
            </button>
          )}
        </div>
      </div>
      <label className="label">Biznes nomi</label>
      <input className="input" value={b.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} required />
      <label className="label">Faoliyat turi</label>
      <select className="select" value={b.category} onChange={(e) => set({ category: e.target.value })}>
        {types.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <label className="label">Telefon</label>
      <div className="prefix-input">
        <span className="pre">+998</span>
        <input className="input" inputMode="tel" value={b.phone} onChange={(e) => set({ phone: e.target.value.replace(/[^\d ]/g, '').slice(0, 12) })} placeholder="90 123 45 67" />
      </div>
      <label className="label">Hudud</label>
      <select
        className="select"
        value={b.area}
        onChange={(e) => {
          const a = AREAS.find((x) => x.id === e.target.value) || AREAS[0]
          set({ area: a.id, lat: a.lat, lng: a.lng })
        }}
      >
        {AREAS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
      <label className="label">Manzil</label>
      <input className="input" value={b.address} onChange={(e) => set({ address: e.target.value })} maxLength={120} required />
      <label className="label">Xaritadagi joyi</label>
      <div className="mapbox" style={{ height: 260 }}>
        <MapView points={[]} center={[b.lat, b.lng]} zoom={16} fit={false} pick={[b.lat, b.lng]} onPick={(lat, lng) => set({ lat, lng })} />
      </div>
      <div className="flex between center mt8">
        <span className="hint" style={{ marginTop: 0 }}>
          Xaritani bosing yoki belgini suring
        </span>
        <button
          type="button"
          className="linkbtn"
          onClick={() =>
            navigator.geolocation?.getCurrentPosition(
              (p) => set({ lat: p.coords.latitude, lng: p.coords.longitude }),
              () => toast('Joylashuvga ruxsat berilmadi'),
              { enableHighAccuracy: true, timeout: 12000 },
            )
          }
        >
          <Icon name="locate" size={18} /> Men shu yerdaman
        </button>
      </div>
      <label className="label">Ish kunlari</label>
      <div className="daypick">
        {DAY_NAMES.map((n, i) => {
          const k = String(i + 1)
          return (
            <label key={k}>
              <input type="checkbox" checked={b.days.includes(k)} onChange={(e) => set({ days: e.target.checked ? b.days + k : b.days.replace(k, '') })} />
              <span>{n}</span>
            </label>
          )
        })}
      </div>
      <div className="field-row">
        <div>
          <label className="label">Ochiladi</label>
          <input className="input" value={b.open_time} onChange={(e) => set({ open_time: e.target.value })} maxLength={5} placeholder="09:00" />
        </div>
        <div>
          <label className="label">Yopiladi</label>
          <input className="input" value={b.close_time} onChange={(e) => set({ close_time: e.target.value })} maxLength={5} placeholder="21:00" />
        </div>
      </div>
      <p className="hint">24 soatlik formatda. Kechasi ishlasangiz: 10:00 va 02:00.</p>
      <label className="label">
        Biz haqimizda <span className="opt">· ixtiyoriy</span>
      </label>
      <textarea className="textarea" value={b.about} onChange={(e) => set({ about: e.target.value })} maxLength={600} placeholder="Nima sotasiz, qanday afzalliklaringiz bor" />
      <div className="card mt16">
        <label className="flex center between gap12" style={{ cursor: 'pointer' }}>
          <span>
            <b style={{ display: 'block' }}>Yetkazib berish</b>
            <span className="small muted">Yangi e’lonlar uchun standart shartlar</span>
          </span>
          <span className="switch">
            <input type="checkbox" checked={b.delivery} onChange={(e) => set({ delivery: e.target.checked })} />
            <span />
          </span>
        </label>
        {b.delivery && (
          <>
            <div className="field-row mt12">
              <div>
                <label className="label" style={{ marginTop: 0 }}>
                  Narxi, so‘m
                </label>
                <input className="input" inputMode="numeric" value={b.delivery_fee ? money(b.delivery_fee) : ''} placeholder="0" onChange={(e) => set({ delivery_fee: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
              </div>
              <div>
                <label className="label" style={{ marginTop: 0 }}>
                  Vaqti
                </label>
                <input className="input" value={b.delivery_eta} onChange={(e) => set({ delivery_eta: e.target.value })} placeholder="1 kun ichida" maxLength={40} />
              </div>
            </div>
            <label className="label">Hudud</label>
            <input className="input" value={b.delivery_area} onChange={(e) => set({ delivery_area: e.target.value })} placeholder="Chortoq tumani" maxLength={60} />
          </>
        )}
      </div>
      {err && <p className="err">{err}</p>}
      <div className="actionbar" style={{ position: 'sticky', bottom: 0, margin: '20px -16px 0' }}>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? <span className="spinner white" /> : null} Saqlash
        </button>
      </div>
    </form>
  )
}
