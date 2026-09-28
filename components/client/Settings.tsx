'use client'
import { useActionState, useState, useTransition } from 'react'
import { setNotify, updateProfile } from '@/app/_actions/prefs'
import { AREAS } from '@/lib/geo'
import { toast } from './Toaster'

export function ProfileForm({ name, area, phone }: { name: string; area: string; phone: string }) {
  const [state, action, pending] = useActionState(updateProfile, null)
  return (
    <form action={action} className="card">
      <label className="label" style={{ marginTop: 0 }}>
        Ism
      </label>
      <input className="input" name="name" defaultValue={name} maxLength={60} required />
      <label className="label">Telefon</label>
      <input className="input" value={phone || 'Ulanmagan'} disabled readOnly style={{ background: 'var(--grey)' }} />
      <p className="hint">Raqam Telegram orqali tasdiqlangan. O‘zgartirish uchun yangi raqam bilan qayta kiring.</p>
      <label className="label">Hudud</label>
      <select className="select" name="area" defaultValue={area}>
        {AREAS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
      {state && !state.ok && <p className="err">{state.error}</p>}
      {state?.ok && <p className="small green b mt8">Saqlandi</p>}
      <button className="btn btn-primary btn-block mt16" disabled={pending}>
        {pending ? <span className="spinner white" /> : null} Saqlash
      </button>
    </form>
  )
}

const KEYS = [
  ['price', 'Narx tushsa', 'Saqlangan mahsulotlar'],
  ['messages', 'Yangi xabarlar', 'Sotuvchilar va xaridorlar javobi'],
  ['bookings', 'Band holati', 'Tasdiqlash va eslatma'],
  ['follows', 'Kuzatilgan bizneslar', 'Aksiya va yangiliklar'],
] as const

export function NotifyToggles({ notify, hasTelegram, only }: { notify: Record<string, boolean | undefined>; hasTelegram: boolean; only?: string[] }) {
  const [st, setSt] = useState<Record<string, boolean>>(() => Object.fromEntries(KEYS.map(([k]) => [k, notify[k] !== false])))
  const [, start] = useTransition()
  return (
    <div className="list">
      {KEYS.filter(([k]) => !only || only.includes(k)).map(([k, t, s]) => (
        <label key={k} className="row" style={{ cursor: 'pointer' }}>
          <span className="grow">
            <span className="t" style={{ display: 'block' }}>
              {t}
            </span>
            <span className="s" style={{ display: 'block' }}>
              {s}
            </span>
          </span>
          <span className="switch">
            <input
              type="checkbox"
              checked={st[k]}
              onChange={(e) => {
                const on = e.target.checked
                setSt((x) => ({ ...x, [k]: on }))
                start(async () => {
                  const r = await setNotify(k, on)
                  if (!r.ok) {
                    setSt((x) => ({ ...x, [k]: !on }))
                    toast('Saqlanmadi')
                  }
                })
              }}
            />
            <span />
          </span>
        </label>
      ))}
      {!only && <div className="row" style={{ minHeight: 0 }}>
        <span className="s">{hasTelegram ? 'Bildirishnomalar saytda va Telegram botda keladi.' : 'Telegram orqali kirsangiz, bildirishnomalar botga ham keladi.'}</span>
      </div>}
    </div>
  )
}
