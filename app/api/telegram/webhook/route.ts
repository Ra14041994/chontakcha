import { timingSafeEqual } from 'node:crypto'
import { one, q } from '@/lib/db'
import { newId } from '@/lib/ids'
import { adminPhones } from '@/lib/session'
import { esc, sendTg, tgCall, webhookSecret } from '@/lib/telegram'
import { appUrl } from '@/lib/url'
import { decideBookingCore } from '@/lib/bookings'

export const dynamic = 'force-dynamic'

type TgUser = { id: number; first_name?: string; last_name?: string; username?: string }
type TgMessage = {
  message_id: number
  from?: TgUser
  chat: { id: number; type: string }
  text?: string
  contact?: { phone_number: string; user_id?: number; first_name?: string; last_name?: string }
}
type TgCallback = { id: string; from: TgUser; data?: string; message?: { message_id: number; chat: { id: number }; text?: string } }

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

function anyPhone(p: string): string | null {
  const d = String(p || '').replace(/\D/g, '')
  if (d.length < 9 || d.length > 15) return null
  if (d.length === 9) return '+998' + d
  return '+' + d
}

const HELP =
  'Assalomu alaykum! Bu <b>Cho‘ntakcha</b> boti.\n\nBu yerda saytga kirishni tasdiqlaysiz va xabarlar, band qilish, narx tushishi haqida bildirishnomalar olasiz.\n\nKirish uchun saytdagi <b>“Telegram orqali kirish”</b> tugmasini bosing.'

async function send(chatId: number, html: string, extra: Record<string, unknown> = {}) {
  await tgCall('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...extra })
}

async function confirmLogin(chatId: number, token: string, userId: string) {
  await q(`update login_tokens set status = 'confirmed', user_id = $2 where token = $1`, [token, userId])
  const finish = `${appUrl()}/api/auth/telegram/finish?t=${token}`
  await send(chatId, '✅ <b>Kirish tasdiqlandi.</b>\nSaytga qayting — sahifa o‘zi yangilanadi. Ochilmasa, pastdagi tugmani bosing.', {
    reply_markup: finish.startsWith('https://') ? { inline_keyboard: [[{ text: 'Saytga qaytish', url: finish }]] } : { remove_keyboard: true },
  })
}

async function onStart(m: TgMessage, from: TgUser, payload: string | undefined) {
  if (!payload || !/^[a-f0-9]{16,64}$/.test(payload)) {
    await send(m.chat.id, HELP, appUrl().startsWith('https://') ? { reply_markup: { inline_keyboard: [[{ text: 'Saytni ochish', url: appUrl() }]] } } : {})
    return
  }
  const row = await one<{ token: string; status: string }>(
    `select token, status from login_tokens where token = $1 and created_at > now() - interval '15 minutes'`,
    [payload],
  )
  if (!row || !['pending', 'awaiting_contact'].includes(row.status)) {
    await send(m.chat.id, 'Bu havola eskirgan yoki ishlatilgan. Saytda <b>“Telegram orqali kirish”</b> tugmasini qaytadan bosing.')
    return
  }
  const tgId = String(from.id)
  const u = await one<{ id: string; phone: string | null; blocked: boolean }>(`select id, phone, blocked from users where tg_id = $1`, [tgId])
  if (u?.blocked) {
    await send(m.chat.id, 'Hisobingiz vaqtincha bloklangan. Savollar bo‘lsa, administratorga yozing.')
    return
  }
  await q(`update login_tokens set tg_id = $2 where token = $1`, [payload, tgId])
  if (u?.phone) {
    await q(`update users set tg_username = $2, last_seen = now() where id = $1`, [u.id, from.username || null])
    await confirmLogin(m.chat.id, payload, u.id)
    return
  }
  await q(`update login_tokens set status = 'awaiting_contact' where token = $1`, [payload])
  await send(m.chat.id, 'Cho‘ntakcha’ga kirish uchun telefon raqamingizni yuboring 👇\n\nRaqamingiz sotuvchilarga avtomatik ko‘rsatilmaydi.', {
    reply_markup: { keyboard: [[{ text: '📱 Raqamni yuborish', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true },
  })
}

async function onContact(m: TgMessage, from: TgUser) {
  const c = m.contact!
  if (c.user_id !== from.id) {
    await send(m.chat.id, 'Iltimos, o‘zingizning raqamingizni pastdagi <b>“Raqamni yuborish”</b> tugmasi orqali yuboring.')
    return
  }
  const phone = anyPhone(c.phone_number)
  if (!phone) {
    await send(m.chat.id, 'Raqamni o‘qib bo‘lmadi. Qaytadan urinib ko‘ring.')
    return
  }
  const tgId = String(from.id)
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ').trim().slice(0, 60)
  const isAdmin = adminPhones().includes(phone)
  let u = await one<{ id: string; blocked: boolean }>(`select id, blocked from users where tg_id = $1`, [tgId])
  if (!u) u = await one<{ id: string; blocked: boolean }>(`select id, blocked from users where phone = $1`, [phone])
  if (u?.blocked) {
    await send(m.chat.id, 'Hisobingiz vaqtincha bloklangan.', { reply_markup: { remove_keyboard: true } })
    return
  }
  if (u) {
    // Boshqa hisobda shu raqam yoki tg_id bo‘lsa — to‘qnashuvni oldini olamiz.
    await q(`update users set phone = null where phone = $1 and id <> $2`, [phone, u.id])
    await q(`update users set tg_id = null where tg_id = $1 and id <> $2`, [tgId, u.id])
    await q(
      `update users set phone = $2, tg_id = $3, tg_username = $4, name = case when name = '' then $5 else name end,
              is_admin = is_admin or $6, last_seen = now() where id = $1`,
      [u.id, phone, tgId, from.username || null, name, isAdmin],
    )
  } else {
    const id = newId()
    await q(`insert into users (id, phone, tg_id, tg_username, name, is_admin, last_seen) values ($1, $2, $3, $4, $5, $6, now())`, [
      id,
      phone,
      tgId,
      from.username || null,
      name,
      isAdmin,
    ])
    u = { id, blocked: false }
  }
  await send(m.chat.id, '✅ Rahmat! Raqamingiz tasdiqlandi.', { reply_markup: { remove_keyboard: true } })
  const row = await one<{ token: string }>(
    `select token from login_tokens where tg_id = $1 and status = 'awaiting_contact' and created_at > now() - interval '15 minutes' order by created_at desc limit 1`,
    [tgId],
  )
  if (row) await confirmLogin(m.chat.id, row.token, u.id)
  else await send(m.chat.id, 'Endi saytdagi <b>“Telegram orqali kirish”</b> tugmasini bosing — bir bosishda kirasiz.')
}

async function onCallback(cb: TgCallback) {
  const data = cb.data || ''
  const mm = /^bk:([a-z0-9]+):(ok|no)$/.exec(data)
  if (!mm) {
    await tgCall('answerCallbackQuery', { callback_query_id: cb.id })
    return
  }
  const actor = await one<{ id: string }>(`select id from users where tg_id = $1 and not blocked`, [String(cb.from.id)])
  const res = actor ? await decideBookingCore(actor.id, mm[1], mm[2] === 'ok') : { ok: false, error: 'Hisob topilmadi' }
  await tgCall('answerCallbackQuery', { callback_query_id: cb.id, text: res.ok ? (mm[2] === 'ok' ? 'Tasdiqlandi' : 'Rad etildi') : res.error || 'Xatolik' })
  if (res.ok && cb.message) {
    await tgCall('editMessageText', {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: `${esc(cb.message.text || '')}\n\n${mm[2] === 'ok' ? '✅ Tasdiqlandi' : '❌ Rad etildi'}`,
      parse_mode: 'HTML',
    })
  }
}

export async function POST(req: Request) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token') || ''
  if (!safeEqual(secret, webhookSecret())) return new Response('forbidden', { status: 403 })
  let upd: { message?: TgMessage; callback_query?: TgCallback }
  try {
    upd = await req.json()
  } catch {
    return Response.json({ ok: true })
  }
  try {
    if (upd.callback_query) {
      await onCallback(upd.callback_query)
    } else if (upd.message && upd.message.chat.type === 'private' && upd.message.from) {
      const m = upd.message
      const from = m.from!
      if (m.contact) await onContact(m, from)
      else if (m.text?.startsWith('/start')) await onStart(m, from, m.text.split(/\s+/)[1])
      else if (m.text?.startsWith('/sayt')) {
        await sendTg(m.chat.id, 'Cho‘ntakcha — yaqin atrofdagi narxlar:', [[{ text: 'Saytni ochish', url: appUrl() }]])
      } else await send(m.chat.id, HELP)
    }
  } catch (e) {
    console.error('telegram webhook', e)
  }
  return Response.json({ ok: true })
}

export async function GET() {
  return new Response('ok')
}
