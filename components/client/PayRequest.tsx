'use client'
import { useState, useTransition } from 'react'
import { requestPayment } from '@/app/_actions/seller'
import { Icon } from '../Icon'
import { Drawer } from './Drawer'

export function PayRequest({ label, method, adminPhone }: { label: string; method: string; adminPhone: string | null }) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [pending, start] = useTransition()
  return (
    <>
      <button type="button" className="btn btn-primary btn-block" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Drawer title="To‘lov" onClose={() => setOpen(false)}>
          <div className="note amber">
            <Icon name="info" />
            <div>
              Click, Payme va Uzum orqali onlayn to‘lov tez orada ulanadi. Hozircha obuna administrator tomonidan qo‘lda faollashtiriladi — to‘lov
              qilganingizdan so‘ng e’lonlaringiz darhol qaytadi.
            </div>
          </div>
          {sent ? (
            <div className="note green mt12">
              <Icon name="checkc" />
              <div>So‘rovingiz yuborildi. Administrator siz bilan tez orada bog‘lanadi.</div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-block mt16"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await requestPayment(method)
                  if (r.ok) setSent(true)
                })
              }
            >
              {pending ? <span className="spinner white" /> : <Icon name="send" />} Administratorga so‘rov yuborish
            </button>
          )}
          {adminPhone && (
            <a href={`tel:${adminPhone}`} className="btn btn-outline btn-block mt10">
              <Icon name="phone" /> Qo‘ng‘iroq qilish
            </a>
          )}
        </Drawer>
      )}
    </>
  )
}
