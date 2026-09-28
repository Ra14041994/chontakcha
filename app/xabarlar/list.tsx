import Link from 'next/link'
import { q } from '@/lib/db'
import { relShort, shortName } from '@/lib/format'
import { Avatar, Empty, PersonAvatar } from '@/components/ui'

export type ConvRow = {
  id: string
  role: 'buyer' | 'seller'
  biz_name: string
  biz_color: string
  biz_logo: string | null
  buyer_name: string
  l_title: string | null
  last_text: string
  last_at: Date
  unread: number
}

export async function loadConvs(userId: string, rol?: string): Promise<ConvRow[]> {
  const rows = await q<ConvRow>(
    `select c.id, case when c.buyer_id = $1 then 'buyer' else 'seller' end as role,
            b.name as biz_name, b.color as biz_color, b.logo_url as biz_logo, u.name as buyer_name, l.title as l_title,
            c.last_text, c.last_at, case when c.buyer_id = $1 then c.buyer_unread else c.seller_unread end as unread
     from conversations c
     join businesses b on b.id = c.business_id
     join users u on u.id = c.buyer_id
     left join listings l on l.id = c.listing_id
     where (c.buyer_id = $1 or b.owner_id = $1)
       and (c.last_text <> '' or c.buyer_id = $1)
     order by c.last_at desc limit 200`,
    [userId],
  )
  if (rol === 'sotuvchi') return rows.filter((r) => r.role === 'seller')
  if (rol === 'xaridor') return rows.filter((r) => r.role === 'buyer')
  return rows
}

export function ConvList({ rows, activeId, empty = true }: { rows: ConvRow[]; activeId?: string; empty?: boolean }) {
  if (!rows.length && empty)
    return <Empty icon="chat" title="Hali xabar yo‘q" text="E’lon sahifasida “Chat” tugmasini bosib sotuvchiga yozing." />
  return (
    <div className="list">
      {rows.map((r) => (
        <Link key={r.id} href={`/xabarlar/${r.id}`} className={`conv${r.unread ? ' unread' : ''}`} style={r.id === activeId ? { background: 'var(--tint)' } : undefined}>
          {r.role === 'buyer' ? <Avatar name={r.biz_name} color={r.biz_color} src={r.biz_logo} /> : <PersonAvatar name={r.buyer_name} />}
          <span className="grow">
            <span className="n">
              <span className="ellipsis">{r.role === 'buyer' ? r.biz_name : shortName(r.buyer_name)}</span>
              {r.role === 'seller' && <span className="tag blue" style={{ height: 20, fontSize: 11 }}>Xaridor</span>}
            </span>
            {r.l_title && <span className="l ellipsis" style={{ display: 'block' }}>{r.l_title}</span>}
            <span className="x ellipsis" style={{ display: 'block' }}>
              {r.last_text || 'Suhbat boshlandi'}
            </span>
          </span>
          <span className="side">
            <span className="tm">{relShort(r.last_at)}</span>
            {r.unread > 0 && <span className="badge-n" style={{ border: 0 }}>{r.unread}</span>}
          </span>
        </Link>
      ))}
    </div>
  )
}
