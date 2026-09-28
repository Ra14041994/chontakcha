import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { convFor, markRead, messagesAfter } from '@/lib/chat'
import { requireUser } from '@/lib/session'
import { money, shortName } from '@/lib/format'
import { openState } from '@/lib/hours'
import { one } from '@/lib/db'
import { yandexRoute } from '@/lib/geo'
import { Shell, TopBack } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Avatar, PersonAvatar } from '@/components/ui'
import { ChatThread } from '@/components/client/ChatThread'
import { CallButton } from '@/components/client/ContactActions'
import { ConvList, loadConvs } from '../list'

export const metadata: Metadata = { title: 'Chat', robots: { index: false } }

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await requireUser(`/xabarlar/${id}`)
  const c = await convFor(id, u.id)
  if (!c) notFound()
  const { conv, role } = c
  const [msgs, convs, hours] = await Promise.all([
    messagesAfter(id, 0, 500),
    loadConvs(u.id),
    one<{ open_time: string; close_time: string; days: string }>(`select open_time, close_time, days from businesses where id = $1`, [conv.business_id]),
  ])
  if ((role === 'buyer' ? conv.buyer_unread : conv.seller_unread) > 0) await markRead(id, role)
  const open = hours ? openState(hours) : null
  const title = role === 'buyer' ? conv.biz_name : shortName(conv.buyer_name)
  const sub = role === 'buyer' ? (open ? open.label : '') : 'Xaridor · raqami yashirin'
  return (
    <Shell
      top={
        <TopBack fallback="/xabarlar">
          {role === 'buyer' && conv.biz_phone && <CallButton phone={conv.biz_phone} businessId={conv.business_id} className="cbtn white round" />}
          {role === 'buyer' && (
            <a href={yandexRoute(conv.biz_lat, conv.biz_lng)} target="_blank" rel="noreferrer" className="cbtn white round" aria-label="Yo‘nalish">
              <Icon name="nav" size={22} />
            </a>
          )}
        </TopBack>
      }
      nav={null}
      sheet="withbar"
    >
      <div className="chat-desk">
        <div className="convs only-d">
          <ConvList rows={convs} activeId={id} empty={false} />
        </div>
        <div className="chat-panel">
          <div className="chat-head mb12">
            {role === 'buyer' ? (
              <Link href={`/b/${conv.business_id}`}>
                <Avatar name={conv.biz_name} color={conv.biz_color} src={conv.biz_logo} />
              </Link>
            ) : (
              <PersonAvatar name={conv.buyer_name} />
            )}
            <div className="grow">
              <div className="xb ellipsis" style={{ fontSize: 17 }}>
                {title}
              </div>
              <div className={`small ${open?.open && role === 'buyer' ? 'green b' : 'muted'}`}>{sub}</div>
            </div>
          </div>
          {conv.listing_id && conv.l_title && (
            <Link href={`/e/${conv.listing_id}`} className="chat-ctx">
              {conv.l_photo ? <img src={conv.l_photo} alt="" /> : null}
              <span className="grow" style={{ minWidth: 0 }}>
                <span className="b ellipsis" style={{ display: 'block', fontSize: 14 }}>
                  {conv.l_title}
                </span>
                <span className="small muted">
                  {conv.l_price != null ? money(conv.l_price) : ''} {conv.l_unit}
                </span>
              </span>
              <Icon name="chev" size={18} />
            </Link>
          )}
          <ChatThread convId={id} role={role} initial={msgs.map((m) => ({ ...m, created_at: new Date(m.created_at).toISOString() }))} />
        </div>
      </div>
    </Shell>
  )
}
