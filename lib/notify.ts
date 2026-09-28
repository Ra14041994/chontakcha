import { one, q } from './db'
import { esc, sendTg, telegramEnabled, type TgButton } from './telegram'
import { appUrl } from './url'

export type Pref = 'price' | 'messages' | 'bookings' | 'follows'

export type NotifyInput = { type: string; title: string; body?: string; link?: string; image?: string | null }

/** Ilova ichidagi bildirishnoma + (sozlamaga ko‘ra) Telegram xabari. */
export async function notify(userId: string, n: NotifyInput, opts: { pref?: Pref; telegram?: boolean; inApp?: boolean; buttons?: TgButton[][] } = {}) {
  try {
    if (opts.inApp !== false) {
      await q(`insert into notifications (user_id, type, title, body, link, image) values ($1, $2, $3, $4, $5, $6)`, [
        userId,
        n.type,
        n.title.slice(0, 200),
        (n.body || '').slice(0, 500),
        n.link || null,
        n.image || null,
      ])
    }
    if (opts.telegram === false || !telegramEnabled()) return
    const u = await one<{ tg_id: string | null; notify: Record<string, boolean> | null; blocked: boolean }>(
      `select tg_id, notify, blocked from users where id = $1`,
      [userId],
    )
    if (!u?.tg_id || u.blocked) return
    if (opts.pref && u.notify && u.notify[opts.pref] === false) return
    const url = appUrl() + (n.link || '/')
    await sendTg(u.tg_id, `<b>${esc(n.title)}</b>${n.body ? '\n' + esc(n.body) : ''}`, opts.buttons ?? [[{ text: 'Ochish', url }]])
  } catch (e) {
    console.error('notify error', e)
  }
}

export async function notifyMany(userIds: string[], n: NotifyInput, opts: { pref?: Pref; telegram?: boolean } = {}) {
  const ids = [...new Set(userIds)].slice(0, 2000)
  for (let i = 0; i < ids.length; i += 15) {
    await Promise.allSettled(ids.slice(i, i + 15).map((id) => notify(id, n, opts)))
  }
}
