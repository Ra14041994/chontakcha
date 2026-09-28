'use client'
import { useActionState, useState } from 'react'
import { createPromotion } from '@/app/_actions/seller'
import { Icon } from '../Icon'

export function PromoForm({ listings, followers, untilOptions }: { listings: { id: string; title: string; price: string; photo: string | null }[]; followers: number; untilOptions: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState(createPromotion, null)
  const [text, setText] = useState('')
  const [key, setKey] = useState(0)
  return (
    <form
      key={key}
      action={async (fd) => {
        await action(fd)
      }}
      className="card"
    >
      <div className="card-h">
        <h3>Kuzatuvchilarga xabar</h3>
        <span className="small muted flex center gap4">
          <Icon name="users" size={16} /> {followers} kishi
        </span>
      </div>
      <textarea className="textarea" name="body" maxLength={160} value={text} onChange={(e) => setText(e.target.value)} placeholder="Masalan: Dam olish kunlari barcha soch quritgichlarga 10% chegirma!" required />
      <div className="counter">{text.length}/160</div>
      <label className="label">Biriktirilgan e’lon <span className="opt">· ixtiyoriy</span></label>
      <select className="select" name="listing" defaultValue="">
        <option value="">Biriktirmaslik</option>
        {listings.map((l) => (
          <option key={l.id} value={l.id}>
            {l.title} — {l.price}
          </option>
        ))}
      </select>
      <label className="label">Muddati</label>
      <select className="select" name="until" defaultValue={untilOptions[1]?.value}>
        {untilOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {state && !state.ok && <p className="err">{state.error}</p>}
      {state?.ok && (
        <p className="small green b mt8">
          Joylandi{state.reach ? ` — ${state.reach} kuzatuvchiga yuborildi` : ''}.{' '}
          <button type="button" className="linkbtn" onClick={() => (setText(''), setKey((k) => k + 1))}>
            Yangi xabar
          </button>
        </p>
      )}
      <button className="btn btn-primary btn-block mt16" disabled={pending || text.trim().length < 5}>
        {pending ? <span className="spinner white" /> : <Icon name="send" />} Joylash
      </button>
    </form>
  )
}
