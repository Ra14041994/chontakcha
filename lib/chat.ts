import { one, q } from './db'
import { notify } from './notify'
import { shortName } from './format'

export type Conv = {
  id: string
  business_id: string
  buyer_id: string
  listing_id: string | null
  last_text: string
  last_at: Date
  buyer_unread: number
  seller_unread: number
  owner_id: string | null
  biz_name: string
  biz_color: string
  biz_logo: string | null
  biz_phone: string | null
  biz_lat: number
  biz_lng: number
  biz_address: string
  buyer_name: string
  l_title: string | null
  l_photo: string | null
  l_price: number | null
  l_unit: string | null
}

export type Msg = { id: number; from_seller: boolean; body: string; created_at: Date; listing_id: string | null }

export async function convFor(convId: string, userId: string): Promise<{ conv: Conv; role: 'buyer' | 'seller' } | null> {
  const conv = await one<Conv>(
    `select c.*, b.owner_id, b.name as biz_name, b.color as biz_color, b.logo_url as biz_logo, b.phone as biz_phone,
            b.lat as biz_lat, b.lng as biz_lng, b.address as biz_address, u.name as buyer_name,
            l.title as l_title, l.photos->>0 as l_photo, l.price as l_price, l.unit as l_unit
     from conversations c
     join businesses b on b.id = c.business_id
     join users u on u.id = c.buyer_id
     left join listings l on l.id = c.listing_id
     where c.id = $1`,
    [convId],
  )
  if (!conv) return null
  if (conv.buyer_id === userId) return { conv, role: 'buyer' }
  if (conv.owner_id === userId) return { conv, role: 'seller' }
  return null
}

export async function messagesAfter(convId: string, afterId = 0, limit = 300): Promise<Msg[]> {
  return q<Msg>(
    `select id, from_seller, body, created_at, listing_id from messages where conversation_id = $1 and id > $2 order by id asc limit ${Math.min(limit, 500)}`,
    [convId, afterId],
  )
}

export async function markRead(convId: string, role: 'buyer' | 'seller') {
  await q(`update conversations set ${role === 'buyer' ? 'buyer_unread' : 'seller_unread'} = 0 where id = $1 and ${role === 'buyer' ? 'buyer_unread' : 'seller_unread'} > 0`, [convId])
}

export async function postMessage(conv: Conv, role: 'buyer' | 'seller', userId: string, text: string): Promise<Msg | null> {
  const body = text.replace(/\r\n/g, '\n').trim().slice(0, 2000)
  if (!body) return null
  const recent = await one<{ n: number }>(
    `select count(*)::int as n from messages where conversation_id = $1 and sender_id = $2 and created_at > now() - interval '1 minute'`,
    [conv.id, userId],
  )
  if ((recent?.n ?? 0) > 20) return null
  const m = await one<Msg>(
    `insert into messages (conversation_id, sender_id, from_seller, body) values ($1, $2, $3, $4)
     returning id, from_seller, body, created_at, listing_id`,
    [conv.id, userId, role === 'seller', body],
  )
  const before = await one<{ buyer_unread: number; seller_unread: number }>(
    `update conversations set last_text = $2, last_at = now(),
       buyer_unread = buyer_unread + $3, seller_unread = seller_unread + $4
     where id = $1 returning buyer_unread, seller_unread`,
    [conv.id, body.slice(0, 200), role === 'seller' ? 1 : 0, role === 'buyer' ? 1 : 0],
  )
  // Qabul qiluvchiga Telegram xabari faqat birinchi o‘qilmagan xabarda (spam bo‘lmasin).
  const recipient = role === 'buyer' ? conv.owner_id : conv.buyer_id
  const unreadNow = role === 'buyer' ? before?.seller_unread : before?.buyer_unread
  if (recipient && unreadNow === 1) {
    const from = role === 'buyer' ? shortName(conv.buyer_name) : conv.biz_name
    await notify(
      recipient,
      { type: 'message', title: `Yangi xabar: ${from}`, body: body.slice(0, 140), link: `/xabarlar/${conv.id}` },
      { pref: 'messages', inApp: false },
    )
  }
  return m
}
