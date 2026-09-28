import { q } from '@/lib/db'
import { botUsername, ensureWebhook, tgCall, telegramEnabled } from '@/lib/telegram'
import { appUrl, requestOrigin } from '@/lib/url'
import { webhookSecret } from '@/lib/telegram'
import { createHash } from 'node:crypto'

export const dynamic = 'force-dynamic'

/** Webhookni qo‘lda o‘rnatish: /api/telegram/setup?key=<kalit>. Kalit — SETUP_KEY yoki bot tokenidan olingan qisqa xesh. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const key = url.searchParams.get('key') || ''
  const expected = process.env.SETUP_KEY || createHash('sha256').update('setup:' + webhookSecret()).digest('hex').slice(0, 16)
  if (!telegramEnabled()) return Response.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN yo‘q' }, { status: 400 })
  if (key !== expected) return Response.json({ ok: false, error: 'kalit noto‘g‘ri' }, { status: 403 })
  const origin = url.searchParams.get('origin') === 'request' ? await requestOrigin() : appUrl()
  await q(`delete from meta where k in ('tg_webhook', 'bot_username')`)
  const w = await ensureWebhook(origin)
  const info = await tgCall('getWebhookInfo', {})
  return Response.json({ ok: w.ok, webhook: w, bot: await botUsername(), info: info.result })
}
