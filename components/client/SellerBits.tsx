'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { confirmAllPrices, listingAction, decideBooking, replyReview, deletePromotion, setSubPrefs } from '@/app/_actions/seller'
import { Icon } from '../Icon'
import { toast } from './Toaster'

export function ConfirmAllButton({ label = 'Hammasi to‘g‘ri', className = 'btn btn-primary' }: { label?: string; className?: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await confirmAllPrices()
          toast(r.ok ? `${r.n ?? 0} ta e’lon narxi tasdiqlandi` : 'Xatolik')
        })
      }
    >
      {pending ? <span className="spinner white" /> : <Icon name="check" />} {label}
    </button>
  )
}

export function ListingMenu({ id, status, available }: { id: string; status: string; available: boolean }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const router = useRouter()
  const act = (a: Parameters<typeof listingAction>[1], msg: string) =>
    start(async () => {
      setOpen(false)
      if (a === 'delete' && !window.confirm('E’lon o‘chirilsinmi? Bu amalni qaytarib bo‘lmaydi.')) return
      const r = await listingAction(id, a)
      toast(r.ok ? msg : r.error || 'Xatolik')
    })
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" className="btn btn-ghost btn-xs btn-icon" aria-label="Amallar" onClick={() => setOpen((x) => !x)} disabled={pending} style={{ width: 36 }}>
        {pending ? <span className="spinner" /> : <Icon name="more" />}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setOpen(false)} />
          <div className="menu-pop" style={{ top: 36, right: 0 }}>
            <button type="button" onClick={() => router.push(`/biznes/elon/${id}`)}>
              <Icon name="pencil" size={18} /> Tahrirlash
            </button>
            {status === 'active' && (
              <button type="button" onClick={() => act('confirm', 'Narx tasdiqlandi')}>
                <Icon name="checkc" size={18} /> Narx to‘g‘ri
              </button>
            )}
            {status === 'active' && available && (
              <button type="button" onClick={() => act('sold', '“Tugagan” deb belgilandi')}>
                <Icon name="ban" size={18} /> Tugadi
              </button>
            )}
            {status === 'active' && !available && (
              <button type="button" onClick={() => act('available', 'Yana sotuvda')}>
                <Icon name="check" size={18} /> Yana sotuvda
              </button>
            )}
            {status === 'active' ? (
              <button type="button" onClick={() => act('hide', 'E’lon yashirildi')}>
                <Icon name="eyeoff" size={18} /> Yashirish
              </button>
            ) : (
              <button type="button" onClick={() => act('publish', 'E’lon chiqdi')}>
                <Icon name="eye" size={18} /> E’lon qilish
              </button>
            )}
            <button type="button" className="danger" onClick={() => act('delete', 'E’lon o‘chirildi')}>
              <Icon name="trash" size={18} /> O‘chirish
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function BookingDecision({ id, compact }: { id: string; compact?: boolean }) {
  const [pending, start] = useTransition()
  const go = (ok: boolean) =>
    start(async () => {
      const r = await decideBooking(id, ok)
      toast(r.ok ? (ok ? 'Tasdiqlandi — xaridorga xabar yuborildi' : 'Rad etildi') : r.error || 'Xatolik')
    })
  return (
    <div className="btns mt12">
      <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={() => go(false)}>
        Rad etish
      </button>
      <button type="button" className="btn btn-primary btn-sm" style={{ flex: compact ? 1 : 1.4 }} disabled={pending} onClick={() => go(true)}>
        {pending ? <span className="spinner white" /> : <Icon name="check" size={18} />} Tasdiqlash
      </button>
    </div>
  )
}

export function ReplyBox({ id, initial }: { id: string; initial?: string | null }) {
  const [open, setOpen] = useState(!initial)
  const [text, setText] = useState(initial || '')
  const [pending, start] = useTransition()
  if (!open)
    return (
      <button type="button" className="btn btn-soft btn-sm mt12" onClick={() => setOpen(true)}>
        <Icon name="pencil" size={16} /> Javobni tahrirlash
      </button>
    )
  return (
    <div className="mt12">
      <textarea className="textarea" style={{ minHeight: 80 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ochiq javob yozing…" maxLength={600} />
      <div className="flex gap8 mt8" style={{ justifyContent: 'flex-end' }}>
        {initial && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
            Bekor
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={pending || text.trim().length < 2}
          onClick={() =>
            start(async () => {
              const r = await replyReview(id, text)
              if (r.ok) {
                toast('Javob saqlandi')
                setOpen(false)
              } else toast(r.error || 'Xatolik')
            })
          }
        >
          <Icon name="send" size={16} /> Javob berish
        </button>
      </div>
    </div>
  )
}

export function DeletePromo({ id }: { id: string }) {
  const [pending, start] = useTransition()
  return (
    <button type="button" className="btn btn-ghost btn-xs btn-icon" aria-label="O‘chirish" disabled={pending} onClick={() => start(() => deletePromotion(id))}>
      <Icon name="trash" size={16} />
    </button>
  )
}

export function SubPrefs({ autoRenew, method }: { autoRenew: boolean; method: string | null }) {
  const [m, setM] = useState(method || 'click')
  const [auto, setAuto] = useState(autoRenew)
  const [, start] = useTransition()
  const save = (a: boolean, mm: string) => start(async () => void (await setSubPrefs(a, mm)))
  const opts: [string, string, string, 'wallet' | 'card'][] = [
    ['click', 'Click', 'Click ilovasi orqali', 'wallet'],
    ['payme', 'Payme', 'Payme ilovasi orqali', 'wallet'],
    ['uzum', 'Uzum Bank', 'Uzum ilovasi orqali', 'wallet'],
    ['karta', 'Bank kartasi', 'Uzcard yoki Humo', 'card'],
  ]
  return (
    <>
      <div className="list-title">To‘lov usuli</div>
      {opts.map(([k, t, s, ic]) => (
        <label key={k} className="radio-card">
          <input
            type="radio"
            name="pm"
            checked={m === k}
            onChange={() => {
              setM(k)
              save(auto, k)
            }}
          />
          <span className="itile">
            <Icon name={ic} />
          </span>
          <span className="grow">
            <b style={{ display: 'block' }}>{t}</b>
            <span className="small muted">{s}</span>
          </span>
        </label>
      ))}
      <label className="card flex center between gap12 mt12" style={{ cursor: 'pointer' }}>
        <span>
          <b style={{ display: 'block' }}>Har oy avtomatik uzaytirish</b>
          <span className="small muted">To‘lovdan 3 kun oldin eslatamiz</span>
        </span>
        <span className="switch">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => {
              setAuto(e.target.checked)
              save(e.target.checked, m)
            }}
          />
          <span />
        </span>
      </label>
    </>
  )
}
