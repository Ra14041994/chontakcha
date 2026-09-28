import { convFor, markRead, messagesAfter, postMessage } from '@/lib/chat'
import { getUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Ctx) {
  const u = await getUser()
  if (!u) return Response.json({ error: 'auth' }, { status: 401 })
  const { id } = await params
  const c = await convFor(id, u.id)
  if (!c) return Response.json({ error: 'not found' }, { status: 404 })
  const after = Number(new URL(req.url).searchParams.get('after') || 0) || 0
  const msgs = await messagesAfter(id, after)
  const unread = c.role === 'buyer' ? c.conv.buyer_unread : c.conv.seller_unread
  if (unread > 0) await markRead(id, c.role)
  return Response.json({ messages: msgs })
}

export async function POST(req: Request, { params }: Ctx) {
  const u = await getUser()
  if (!u) return Response.json({ error: 'auth' }, { status: 401 })
  const { id } = await params
  const c = await convFor(id, u.id)
  if (!c) return Response.json({ error: 'not found' }, { status: 404 })
  let text = ''
  try {
    const j = (await req.json()) as { text?: string }
    text = String(j.text || '')
  } catch {}
  const m = await postMessage(c.conv, c.role, u.id, text)
  if (!m) return Response.json({ error: 'Xabar yuborilmadi' }, { status: 400 })
  return Response.json({ message: m })
}
