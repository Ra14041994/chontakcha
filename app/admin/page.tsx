import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { one, q } from '@/lib/db'
import { getUser } from '@/lib/session'
import { subInfo } from '@/lib/business'
import { dateShort, money, phonePretty, relShort } from '@/lib/format'
import { telegramEnabled, tgCall } from '@/lib/telegram'
import { appUrl } from '@/lib/url'
import { blobLabel } from '@/lib/blob'
import { Shell, TopBack } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Note } from '@/components/ui'
import { adminBlockUser, adminBusiness, adminDeleteSamples, adminExtend, adminListing, adminResolveReport, adminRestoreSamples, adminWebhook } from '@/app/_actions/admin'

export const metadata: Metadata = { title: 'Admin', robots: { index: false } }

const TABS = [
  ['umumiy', 'Umumiy'],
  ['obunalar', 'Obunalar'],
  ['shikoyatlar', 'Shikoyatlar'],
  ['elonlar', 'E’lonlar'],
  ['foydalanuvchilar', 'Foydalanuvchilar'],
  ['sozlama', 'Sozlama'],
] as const

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; b?: string }> }) {
  const u = await getUser()
  if (!u?.is_admin) notFound()
  const sp = await searchParams
  const tab = sp.b ? 'obunalar' : TABS.some(([k]) => k === sp.tab) ? sp.tab! : 'umumiy'

  const stats = await one<{ users: number; biz: number; listings: number; samples: number; reports: number; views: number; msgs: number; bookings: number; newusers: number }>(
    `select (select count(*)::int from users) as users,
            (select count(*)::int from businesses where not is_sample and status <> 'deleted') as biz,
            (select count(*)::int from listings where status = 'active' and not is_sample) as listings,
            (select count(*)::int from listings where is_sample) as samples,
            (select count(*)::int from reports where not resolved) as reports,
            (select count(*)::int from events where type = 'view' and created_at > now() - interval '7 days') as views,
            (select count(*)::int from messages where created_at > now() - interval '7 days') as msgs,
            (select count(*)::int from bookings where created_at > now() - interval '7 days') as bookings,
            (select count(*)::int from users where created_at > now() - interval '7 days') as newusers`,
  )

  let body: React.ReactNode = null
  if (tab === 'umumiy') {
    const cards: [string, number, string][] = [
      ['Foydalanuvchilar', stats?.users ?? 0, `+${stats?.newusers ?? 0} shu hafta`],
      ['Bizneslar', stats?.biz ?? 0, 'namunasiz'],
      ['Faol e’lonlar', stats?.listings ?? 0, `${stats?.samples ?? 0} ta namuna`],
      ['Ko‘rishlar (7 kun)', stats?.views ?? 0, ''],
      ['Xabarlar (7 kun)', stats?.msgs ?? 0, ''],
      ['Bandlar (7 kun)', stats?.bookings ?? 0, ''],
      ['Ochiq shikoyatlar', stats?.reports ?? 0, ''],
    ]
    body = (
      <div className="stats">
        {cards.map(([l, v, s]) => (
          <div key={l} className="stat">
            <div className="v" style={{ marginTop: 0 }}>{money(v)}</div>
            <div className="l">{l}</div>
            {s && <div className="tiny muted">{s}</div>}
          </div>
        ))}
      </div>
    )
  } else if (tab === 'obunalar') {
    const rows = await q<{ id: string; name: string; phone: string | null; owner_phone: string | null; sub_until: Date | null; status: string; is_sample: boolean; created_at: Date; paid_count: number; listings: number; pay_method: string | null }>(
      `select b.id, b.name, b.phone, u.phone as owner_phone, b.sub_until, b.status, b.is_sample, b.created_at, b.pay_method,
              (select count(*)::int from payments p where p.business_id = b.id) as paid_count,
              (select count(*)::int from listings l where l.business_id = b.id and l.status = 'active') as listings
       from businesses b left join users u on u.id = b.owner_id
       where not b.is_sample and b.status <> 'deleted' order by (b.id = $1) desc, b.sub_until asc nulls first limit 300`,
      [sp.b || ''],
    )
    body = rows.length ? (
      <div className="tablewrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Biznes</th>
              <th>Holat</th>
              <th>E’lon</th>
              <th>Amal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const s = subInfo(b)
              return (
                <tr key={b.id} style={b.id === sp.b ? { background: 'var(--tint)' } : undefined}>
                  <td>
                    <Link href={`/b/${b.id}`} className="b">
                      {b.name}
                    </Link>
                    <div className="tiny muted">
                      {phonePretty(b.phone || b.owner_phone)} · {dateShort(b.created_at)}
                      {b.pay_method ? ` · ${b.pay_method}` : ''}
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${s.state === 'expired' ? 'red' : s.state === 'grace' ? 'amber' : 'green'}`}>{s.title}</span>
                    {b.status === 'blocked' && <span className="tag red mt4">Bloklangan</span>}
                  </td>
                  <td>{b.listings}</td>
                  <td>
                    <div className="flex gap6 wrap">
                      <form action={adminExtend.bind(null, b.id, 1, 'Administrator')}>
                        <button className="btn btn-primary btn-xs">+30 kun</button>
                      </form>
                      <form action={adminExtend.bind(null, b.id, 3, 'Administrator')}>
                        <button className="btn btn-soft btn-xs">+90 kun</button>
                      </form>
                      <form action={adminBusiness.bind(null, b.id, b.status === 'blocked' ? 'active' : 'blocked')}>
                        <button className="btn btn-outline btn-xs">{b.status === 'blocked' ? 'Faollashtirish' : 'Bloklash'}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="muted">Hali haqiqiy biznes yo‘q.</p>
    )
  } else if (tab === 'shikoyatlar') {
    const rows = await q<{ id: number; reason: string; resolved: boolean; created_at: Date; listing_id: string | null; title: string | null; status: string | null; biz: string | null }>(
      `select r.id, r.reason, r.resolved, r.created_at, r.listing_id, l.title, l.status, b.name as biz
       from reports r left join listings l on l.id = r.listing_id left join businesses b on b.id = r.business_id
       order by r.resolved, r.id desc limit 200`,
    )
    body = rows.length ? (
      <div className="list">
        {rows.map((r) => (
          <div key={r.id} className="row" style={r.resolved ? { opacity: 0.55 } : undefined}>
            <span className="itile red">
              <Icon name="flag" />
            </span>
            <span className="grow">
              <span className="t" style={{ display: 'block' }}>
                {r.reason}
              </span>
              <span className="s">
                {r.listing_id ? <Link href={`/e/${r.listing_id}`} className="link">{r.title}</Link> : '—'} · {r.biz} · {relShort(r.created_at)}
                {r.status === 'hidden' ? ' · yashirilgan' : ''}
              </span>
            </span>
            {!r.resolved && (
              <span className="flex gap6">
                {r.listing_id && r.status === 'active' && (
                  <form action={adminListing.bind(null, r.listing_id, 'hidden')}>
                    <button className="btn btn-danger btn-xs">Yashirish</button>
                  </form>
                )}
                <form action={adminResolveReport.bind(null, r.id)}>
                  <button className="btn btn-outline btn-xs">Hal qilindi</button>
                </form>
              </span>
            )}
          </div>
        ))}
      </div>
    ) : (
      <p className="muted">Shikoyat yo‘q.</p>
    )
  } else if (tab === 'elonlar') {
    const rows = await q<{ id: string; title: string; price: number; unit: string; status: string; is_sample: boolean; biz: string; created_at: Date; photo: string | null }>(
      `select l.id, l.title, l.price, l.unit, l.status, l.is_sample, b.name as biz, l.created_at, l.photos->>0 as photo
       from listings l join businesses b on b.id = l.business_id where l.status in ('active', 'hidden') order by l.is_sample, l.created_at desc limit 200`,
    )
    body = (
      <div className="list">
        {rows.map((l) => (
          <div key={l.id} className="row">
            {l.photo ? <img src={l.photo} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} /> : <span className="itile"><Icon name="image" /></span>}
            <span className="grow">
              <Link href={`/e/${l.id}`} className="t" style={{ display: 'block' }}>
                {l.title} {l.is_sample && <span className="tag">Namuna</span>}
              </Link>
              <span className="s">
                {money(l.price)} {l.unit} · {l.biz} · {relShort(l.created_at)}
              </span>
            </span>
            <form action={adminListing.bind(null, l.id, l.status === 'active' ? 'hidden' : 'active')}>
              <button className={`btn btn-xs ${l.status === 'active' ? 'btn-danger' : 'btn-soft'}`}>{l.status === 'active' ? 'Yashirish' : 'Qaytarish'}</button>
            </form>
          </div>
        ))}
      </div>
    )
  } else if (tab === 'foydalanuvchilar') {
    const rows = await q<{ id: string; name: string; phone: string | null; tg_username: string | null; created_at: Date; last_seen: Date | null; blocked: boolean; is_admin: boolean }>(
      `select id, name, phone, tg_username, created_at, last_seen, blocked, is_admin from users order by created_at desc limit 300`,
    )
    body = (
      <div className="tablewrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ism</th>
              <th>Telefon</th>
              <th>Oxirgi</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>{x.name || '—'}</b> {x.is_admin && <span className="tag amber">admin</span>}
                  <div className="tiny muted">{x.tg_username ? '@' + x.tg_username : ''}</div>
                </td>
                <td>{phonePretty(x.phone)}</td>
                <td className="small">{x.last_seen ? relShort(x.last_seen) : relShort(x.created_at)}</td>
                <td>
                  {!x.is_admin && (
                    <form action={adminBlockUser.bind(null, x.id, !x.blocked)}>
                      <button className={`btn btn-xs ${x.blocked ? 'btn-soft' : 'btn-danger'}`}>{x.blocked ? 'Blokdan chiqarish' : 'Bloklash'}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  } else {
    const info = telegramEnabled() ? await tgCall<{ url: string; pending_update_count: number; last_error_message?: string }>('getWebhookInfo', {}) : null
    const expected = appUrl() + '/api/telegram/webhook'
    body = (
      <div className="gridauto">
        <div className="card">
          <h3>Namuna ma’lumotlar</h3>
          <p className="small muted mt4">Hozir {stats?.samples ?? 0} ta namuna e’lon bor. Haqiqiy do‘konlar ko‘paygach, namunalarni o‘chiring.</p>
          <div className="btns mt12">
            <form action={adminDeleteSamples}>
              <button className="btn btn-danger btn-sm" disabled={!stats?.samples}>
                <Icon name="trash" size={18} /> Namunalarni o‘chirish
              </button>
            </form>
            <form action={adminRestoreSamples}>
              <button className="btn btn-outline btn-sm">
                <Icon name="refresh" size={18} /> Qaytarish
              </button>
            </form>
          </div>
        </div>
        <div className="card">
          <h3>Telegram bot</h3>
          {telegramEnabled() ? (
            <>
              <p className="small mt8">
                Webhook: <b>{info?.result?.url || 'o‘rnatilmagan'}</b>
              </p>
              {info?.result?.url !== expected && <Note tone="amber" icon="warn" className="mt8">Kutilgan manzil: {expected}</Note>}
              {info?.result?.last_error_message && <Note tone="red" icon="alert" className="mt8">Oxirgi xato: {info.result.last_error_message}</Note>}
              <form action={adminWebhook} className="mt12">
                <button className="btn btn-soft btn-sm">
                  <Icon name="refresh" size={18} /> Webhookni qayta o‘rnatish
                </button>
              </form>
            </>
          ) : (
            <Note tone="amber" icon="warn" className="mt8">TELEGRAM_BOT_TOKEN qo‘shilmagan.</Note>
          )}
        </div>
        <div className="card">
          <h3>Muhit</h3>
          <div className="kv"><span className="k">Sayt manzili</span><span className="v">{appUrl()}</span></div>
          <div className="kv"><span className="k">Rasm ombori</span><span className="v">{blobLabel()}</span></div>
          <div className="kv"><span className="k">Baza</span><span className="v">{process.env.DATABASE_URL || process.env.POSTGRES_URL ? 'Postgres ✓' : 'Lokal'}</span></div>
        </div>
      </div>
    )
  }

  return (
    <Shell top={<TopBack fallback="/profil" />} nav={null} sheet="nonav">
      <div className="page-h">
        <h1>Admin panel</h1>
      </div>
      <div className="tabs">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin?tab=${k}`} className={tab === k ? 'on' : ''} replace>
            {l}
            {k === 'shikoyatlar' && stats?.reports ? <span className="cnt">{stats.reports}</span> : null}
          </Link>
        ))}
      </div>
      {body}
    </Shell>
  )
}
