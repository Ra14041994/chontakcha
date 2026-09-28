'use server'
import { notFound } from 'next/navigation'
import { refresh } from 'next/cache'
import { one, q, tx } from '@/lib/db'
import { getUser } from '@/lib/session'
import { notify } from '@/lib/notify'
import { dateLong } from '@/lib/format'
import { sampleStatements } from '@/lib/seed'
import { ensureWebhook, tgCall } from '@/lib/telegram'
import { appUrl } from '@/lib/url'
import { SUB_PRICE } from '@/lib/categories'

async function admin() {
  const u = await getUser()
  if (!u?.is_admin) notFound()
  return u
}

export async function adminExtend(bizId: string, months: number, method: string) {
  const u = await admin()
  const m = Math.min(12, Math.max(1, Math.floor(months) || 1))
  const b = await one<{ id: string; owner_id: string | null; name: string; sub_until: Date | null }>(
    `update businesses set sub_until = greatest(coalesce(sub_until, now()), now()) + ($2 || ' days')::interval where id = $1
     returning id, owner_id, name, sub_until`,
    [bizId, String(m * 30)],
  )
  if (!b) return
  await q(`insert into payments (business_id, amount, months, method, note, created_by) values ($1, $2, $3, $4, $5, $6)`, [bizId, SUB_PRICE * m, m, method || 'Administrator', 'Qo‘lda faollashtirildi', u.id])
  if (b.owner_id) {
    await notify(b.owner_id, {
      type: 'subscription',
      title: 'Obuna faollashtirildi',
      body: `${b.name}: ${m} oy · ${b.sub_until ? dateLong(b.sub_until) : ''}gacha. Rahmat!`,
      link: '/biznes/obuna',
    })
  }
  refresh()
}

export async function adminListing(id: string, status: 'active' | 'hidden') {
  await admin()
  await q(`update listings set status = $2 where id = $1 and status <> 'deleted'`, [id, status])
  refresh()
}

export async function adminBusiness(id: string, status: 'active' | 'blocked') {
  await admin()
  await q(`update businesses set status = $2 where id = $1`, [id, status])
  refresh()
}

export async function adminResolveReport(id: number) {
  await admin()
  await q(`update reports set resolved = true where id = $1`, [id])
  refresh()
}

export async function adminBlockUser(id: string, blocked: boolean) {
  const u = await admin()
  if (id === u.id) return
  await q(`update users set blocked = $2 where id = $1`, [id, blocked])
  refresh()
}

export async function adminDeleteSamples() {
  await admin()
  await q(`delete from businesses where is_sample`)
  await q(`insert into meta (k, v) values ('seeded', '1') on conflict (k) do update set v = '1'`)
  refresh()
}

export async function adminRestoreSamples() {
  await admin()
  await tx(sampleStatements())
  refresh()
}

export async function adminWebhook(): Promise<void> {
  await admin()
  await q(`delete from meta where k in ('tg_webhook', 'bot_username')`)
  await ensureWebhook(appUrl())
  refresh()
}

export async function adminWebhookInfo() {
  await admin()
  const r = await tgCall<{ url: string; pending_update_count: number; last_error_message?: string; last_error_date?: number }>('getWebhookInfo', {})
  return r.result || null
}
