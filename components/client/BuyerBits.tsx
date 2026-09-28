'use client'
import { useTransition } from 'react'
import { cancelBooking } from '@/app/_actions/buyer'
import { toast } from './Toaster'

export function CancelBooking({ id, soon }: { id: string; soon: boolean }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(soon ? 'Bandga 2 soatdan kam qoldi. Baribir bekor qilinsinmi? Sotuvchiga xabar boradi.' : 'Band bekor qilinsinmi?')) return
        start(async () => {
          const r = await cancelBooking(id)
          toast(r.ok ? 'Band bekor qilindi' : r.error || 'Xatolik')
        })
      }}
    >
      {pending ? <span className="spinner" /> : null} Bekor qilish
    </button>
  )
}
