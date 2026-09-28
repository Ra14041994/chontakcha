'use client'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { createBooking } from '@/app/_actions/buyer'
import { money } from '@/lib/format'
import { Icon } from '../Icon'
import { toast } from './Toaster'

type Day = { key: string; top: string; num: number; busy: Record<string, number[]> }

export function BookingForm({ listingId, days, start, end, rooms, price, unit, nowHour, today }: { listingId: string; days: Day[]; start: number; end: number; rooms: string[]; price: number; unit: string; nowHour: number; today: string }) {
  const [day, setDay] = useState(days[0]?.key || today)
  const [room, setRoom] = useState(rooms[0] || '')
  const [hour, setHour] = useState<number | null>(null)
  const [hours, setHours] = useState(1)
  const [note, setNote] = useState('')
  const [pending, startT] = useTransition()
  const router = useRouter()
  const d = days.find((x) => x.key === day) || days[0]
  const taken = useMemo(() => new Set(d?.busy[room || ''] || []), [d, room])
  const slots = Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i)
  const free = (h: number, len = hours) => {
    if (day === today && h <= nowHour) return false
    for (let x = h; x < h + len; x++) if (x >= end || taken.has(x)) return false
    return true
  }
  const perHour = unit.includes('/soat')
  const total = perHour ? price * hours : price
  const label = (h: number) => `${String(h % 24).padStart(2, '0')}:00`
  return (
    <div>
      <h3>Sana</h3>
      <div className="days mt10">
        {days.map((x) => (
          <button
            key={x.key}
            type="button"
            className={`day${x.key === day ? ' on' : ''}`}
            onClick={() => {
              setDay(x.key)
              setHour(null)
            }}
          >
            {x.top}
            <b>{x.num}</b>
          </button>
        ))}
      </div>
      <div className="flex between center mt20">
        <h3>Vaqt</h3>
        <span className="small muted flex center gap8">
          <span className="tag" style={{ background: '#fff', border: '1px solid var(--line3)', height: 22 }}>Bo‘sh</span>
          <span className="tag" style={{ height: 22, textDecoration: 'line-through' }}>Band</span>
        </span>
      </div>
      <div className="slots mt10">
        {slots.map((h) => (
          <button key={h} type="button" className={`slot${hour === h ? ' on' : ''}`} disabled={!free(h, 1)} onClick={() => setHour(h)}>
            {label(h)}
          </button>
        ))}
      </div>
      {!slots.some((h) => free(h, 1)) && <p className="hint">Bu kunda bo‘sh vaqt qolmagan — boshqa kunni tanlang.</p>}
      <div className="field-row mt16">
        <div>
          <h3>Davomiyligi</h3>
          <div className="stepper mt10">
            <button type="button" aria-label="Kamaytirish" onClick={() => setHours((x) => Math.max(1, x - 1))}>
              <Icon name="minus" />
            </button>
            <b>{hours} soat</b>
            <button type="button" aria-label="Ko‘paytirish" onClick={() => setHours((x) => Math.min(6, x + 1))}>
              <Icon name="plus" />
            </button>
          </div>
        </div>
        {rooms.length > 0 && (
          <div>
            <h3>Joy</h3>
            <select className="select mt10" value={room} onChange={(e) => (setRoom(e.target.value), setHour(null))}>
              {rooms.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <label className="label">
        Izoh <span className="opt">· ixtiyoriy</span>
      </label>
      <textarea className="textarea" style={{ minHeight: 80 }} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Masalan: 2 ta joystik kerak" />
      <div className="note tint mt16">
        <Icon name="info" />
        <div>Sotuvchi tasdiqlagach, bildirishnoma keladi. To‘lov joyida, bekor qilish bepul.</div>
      </div>
      <div className="actionbar" style={{ position: 'sticky', bottom: 0, margin: '20px -16px 0' }}>
        <div className="price-line">
          <span className="small">{hour != null ? `${d?.top === 'Bugun' ? 'Bugun' : d?.top} · ${label(hour)}–${label(hour + hours)}` : 'Vaqtni tanlang'}</span>
          <b>
            {money(total)} <small className="muted" style={{ fontSize: 13 }}>so‘m{unit.includes('dan') ? 'dan' : ''}</small>
          </b>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: '0 0 auto', padding: '0 24px' }}
          disabled={hour == null || pending || !free(hour ?? -1)}
          onClick={() =>
            startT(async () => {
              if (hour == null) return
              const r = await createBooking({ listingId, day, start: hour, hours, room: room || null, note })
              if (r.ok) {
                toast('So‘rov yuborildi — sotuvchi tasdiqlashini kuting')
                router.push('/bandlarim')
              } else toast(r.error)
            })
          }
        >
          {pending ? <span className="spinner white" /> : null} Band qilish
        </button>
      </div>
      {hour != null && !free(hour) && <p className="err">Tanlangan davomiylik bo‘sh vaqtga sig‘maydi.</p>}
    </div>
  )
}
