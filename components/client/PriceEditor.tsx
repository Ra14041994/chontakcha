'use client'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { savePrices } from '@/app/_actions/seller'
import { money } from '@/lib/format'
import { Icon } from '../Icon'
import { toast } from './Toaster'

type R = { id: string; title: string; price: number; unit: string; photo: string | null }

export function PriceEditor({ rows }: { rows: R[] }) {
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(rows.map((r) => [r.id, r.price])))
  const [filter, setFilter] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()
  const changed = rows.filter((r) => vals[r.id] && vals[r.id] !== r.price)
  const shown = useMemo(() => rows.filter((r) => r.title.toLowerCase().includes(filter.toLowerCase())), [rows, filter])
  return (
    <>
      <div className="msearch" style={{ marginTop: 0, boxShadow: 'none', border: '1px solid var(--line3)', height: 50 }}>
        <Icon name="search" />
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Mahsulotni topish" />
      </div>
      <div className="list mt12">
        {shown.map((r) => {
          const ch = vals[r.id] !== r.price
          return (
            <div key={r.id} className={`pricerow${ch ? ' changed' : ''}`}>
              {r.photo ? <img src={r.photo} alt="" /> : <span className="itile"><Icon name="image" /></span>}
              <div className="grow">
                <b className="clamp2" style={{ fontSize: 14.5 }}>
                  {r.title}
                </b>
                <div className="small muted">
                  {ch ? (
                    <>
                      <s>{money(r.price)}</s> <span className="link">o‘zgardi</span>
                    </>
                  ) : (
                    <>Hozir: {money(r.price)} {r.unit}</>
                  )}
                </div>
              </div>
              <input inputMode="numeric" aria-label={`${r.title} narxi`} value={vals[r.id] ? money(vals[r.id]) : ''} onChange={(e) => setVals((v) => ({ ...v, [r.id]: Number(e.target.value.replace(/\D/g, '')) || 0 }))} />
            </div>
          )
        })}
      </div>
      <div className="actionbar" style={{ position: 'sticky', bottom: 0, margin: '20px -16px 0' }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await savePrices(changed.map((c) => ({ id: c.id, price: vals[c.id] })))
              if (r.ok) {
                toast(r.changed ? `${r.changed} ta narx yangilandi, hammasi tasdiqlandi` : 'Hammasi tasdiqlandi')
                router.push('/biznes')
              } else toast(r.error || 'Xatolik')
            })
          }
        >
          {pending ? <span className="spinner white" /> : null} Saqlash va tasdiqlash{changed.length ? ` · ${changed.length} ta o‘zgardi` : ''}
        </button>
      </div>
    </>
  )
}
