import { redirect } from 'next/navigation'
import { requireUser, type User } from './session'
import { cache } from 'react'
import { one } from './db'
import { GRACE_DAYS, SUB_PRICE } from './categories'
import { dateLong, money } from './format'
import type { BusinessFull } from './listings'

export type SubState = 'sample' | 'trial' | 'active' | 'grace' | 'expired' | 'none'
export type SubInfo = {
  state: SubState
  daysLeft: number
  until: Date | null
  graceUntil: Date | null
  visible: boolean
  title: string
  text: string
  paid: boolean
}

export const myBusiness = cache(async (userId: string): Promise<(BusinessFull & { paid_count: number }) | null> => {
  return one<BusinessFull & { paid_count: number }>(
    `select b.*, (select count(*)::int from payments p where p.business_id = b.id) as paid_count
     from businesses b where b.owner_id = $1 limit 1`,
    [userId],
  )
})

export function subInfo(b: Pick<BusinessFull, 'is_sample' | 'sub_until' | 'status'> & { paid_count?: number }, now = new Date()): SubInfo {
  const paid = (b.paid_count || 0) > 0
  if (b.is_sample) return { state: 'sample', daysLeft: 999, until: null, graceUntil: null, visible: true, title: 'Namuna biznes', text: '', paid }
  if (!b.sub_until) return { state: 'none', daysLeft: 0, until: null, graceUntil: null, visible: false, title: 'Obuna yo‘q', text: 'E’lonlar xaridorlarga ko‘rinmaydi.', paid }
  const until = new Date(b.sub_until)
  const grace = new Date(until.getTime() + GRACE_DAYS * 86400000)
  const ms = until.getTime() - now.getTime()
  const daysLeft = Math.max(0, Math.ceil(ms / 86400000))
  if (ms > 0) {
    const state: SubState = paid ? 'active' : 'trial'
    return {
      state,
      daysLeft,
      until,
      graceUntil: grace,
      visible: b.status === 'active',
      title: state === 'trial' ? `Bepul oy: ${daysLeft} kun qoldi` : `Obuna faol: ${daysLeft} kun qoldi`,
      text: state === 'trial' ? `${dateLong(until)}dan keyin ${money(SUB_PRICE)} so‘m/oy` : `Keyingi to‘lov: ${dateLong(until)} · ${money(SUB_PRICE)} so‘m`,
      paid,
    }
  }
  if (grace.getTime() > now.getTime()) {
    const g = Math.max(1, Math.ceil((grace.getTime() - now.getTime()) / 86400000))
    return {
      state: 'grace',
      daysLeft: 0,
      until,
      graceUntil: grace,
      visible: b.status === 'active',
      title: `Obuna tugadi — ${g} kunlik muhlat`,
      text: `${dateLong(grace)}dan keyin e’lonlaringiz qidiruvda ko‘rinmay qoladi.`,
      paid,
    }
  }
  return {
    state: 'expired',
    daysLeft: 0,
    until,
    graceUntil: grace,
    visible: false,
    title: 'E’lonlaringiz yashirilgan',
    text: 'Obuna muddati tugagan. To‘lovdan keyin e’lonlar darhol qaytadi.',
    paid,
  }
}


/** Sotuvchi sahifalari uchun: foydalanuvchi va uning biznesi (bo‘lmasa /biznes ga). */
export async function requireBusiness(path: string): Promise<{ u: User; b: BusinessFull & { paid_count: number } }> {
  const u = await requireUser(path)
  const b = await myBusiness(u.id)
  if (!b) redirect('/biznes')
  return { u, b }
}
