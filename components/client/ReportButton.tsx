'use client'
import { useState, useTransition } from 'react'
import { reportListing } from '@/app/_actions/social'
import { REPORT_REASONS } from '@/lib/categories'
import { Icon } from '../Icon'
import { Drawer } from './Drawer'
import { toast } from './Toaster'

export function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REPORT_REASONS[0])
  const [note, setNote] = useState('')
  const [pending, start] = useTransition()
  return (
    <>
      <button type="button" className="linkbtn" style={{ color: 'var(--muted)' }} onClick={() => setOpen(true)}>
        <Icon name="flag" size={16} /> Shikoyat qilish
      </button>
      {open && (
        <Drawer
          title="E’lon haqida xabar berish"
          onClose={() => setOpen(false)}
          footer={
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await reportListing(listingId, reason, note)
                  setOpen(false)
                  toast(r.ok ? 'Rahmat! Ma’muriyat tekshiradi.' : r.error || 'Xatolik')
                })
              }
            >
              Yuborish
            </button>
          }
        >
          <div className="list">
            {REPORT_REASONS.map((r) => (
              <label key={r} className="row" style={{ cursor: 'pointer' }}>
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} style={{ width: 20, height: 20, accentColor: 'var(--mid)' }} />
                <span className="grow t">{r}</span>
              </label>
            ))}
          </div>
          <label className="label">
            Izoh <span className="opt">· ixtiyoriy</span>
          </label>
          <textarea className="textarea" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nima noto‘g‘ri?" />
        </Drawer>
      )}
    </>
  )
}
