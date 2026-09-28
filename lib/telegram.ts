import { createHash } from 'node:crypto'
import { one, q } from './db'

export type TgButton = { text: string; url?: string; callback_data?: string }

function token(): string {
  return process.env.TELEGRAM_BOT_TOKEN || ''
}

export function telegramEnabled(): boolean {
  return /^\d+:[\w-]{20,}$/.test(token())
}

export async function tgCall<T = any>(method: string, body: Record<string, unknown>): Promise<{ ok: boolean; result?: T; description?: string }> {
  if (!telegramEnabled()) return { ok: false, description: 'TELEGRAM_BOT_TOKEN yo‘q' }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    return (await res.json()) as { ok: boolean; result?: T; description?: string }
  } catch (e) {
    return { ok: false, description: e instanceof Error ? e.message : 'network' }
  }
}

export function webhookSecret(): string {
  if (process.env.TELEGRAM_WEBHOOK_SECRET) return process.env.TELEGRAM_WEBHOOK_SECRET.replace(/[^\w-]/g, '').slice(0, 200)
  return createHash('sha256').update('chontakcha-webhook:' + token()).digest('hex').slice(0, 48)
}

export async function botUsername(): Promise<string | null> {
  if (process.env.TELEGRAM_BOT_USERNAME) return process.env.TELEGRAM_BOT_USERNAME.replace(/^@/, '')
  if (!telegramEnabled()) return null
  const tokHash = createHash('sha256').update(token()).digest('hex').slice(0, 12)
  const cached = await one<{ v: string }>(`select v from meta where k = 'bot_username'`)
  if (cached?.v) {
    const [name, h] = cached.v.split('|')
    if (h === tokHash && name) return name
  }
  const me = await tgCall<{ username: string }>('getMe', {})
  if (me.ok && me.result?.username) {
    await q(`insert into meta (k, v) values ('bot_username', $1) on conflict (k) do update set v = excluded.v`, [me.result.username + '|' + tokHash])
    return me.result.username
  }
  return null
}

/** Webhook shu sayt manziliga o‘rnatilganini ta’minlaydi (faqat https manzillar uchun). */
export async function ensureWebhook(origin: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!telegramEnabled()) return { ok: false, error: 'TELEGRAM_BOT_TOKEN yo‘q' }
  if (!origin.startsWith('https://')) return { ok: false, error: 'Webhook faqat https manzilda ishlaydi' }
  const url = origin.replace(/\/+$/, '') + '/api/telegram/webhook'
  const mark = url + '|' + webhookSecret().slice(0, 6)
  const cur = await one<{ v: string }>(`select v from meta where k = 'tg_webhook'`)
  if (cur?.v === mark) return { ok: true, url }
  const r = await tgCall('setWebhook', {
    url,
    secret_token: webhookSecret(),
    allowed_updates: ['message', 'callback_query'],
    max_connections: 20,
  })
  if (!r.ok) return { ok: false, url, error: r.description }
  await q(`insert into meta (k, v) values ('tg_webhook', $1) on conflict (k) do update set v = excluded.v`, [mark])
  await tgCall('setMyCommands', {
    commands: [
      { command: 'start', description: 'Boshlash' },
      { command: 'sayt', description: 'Cho‘ntakcha saytini ochish' },
    ],
  })
  return { ok: true, url }
}

export function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendTg(chatId: string | number, html: string, buttons?: TgButton[][]): Promise<boolean> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  }
  if (buttons?.length) {
    const rows = buttons
      .map((row) => row.filter((b) => b.callback_data || (b.url && /^https:\/\//.test(b.url))))
      .filter((row) => row.length)
    if (rows.length) body.reply_markup = { inline_keyboard: rows }
  }
  const r = await tgCall('sendMessage', body)
  return r.ok
}
