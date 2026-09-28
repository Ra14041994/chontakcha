import type { Metadata } from 'next'
import Link from 'next/link'
import { one } from '@/lib/db'
import { getViewer, requireUser } from '@/lib/session'
import { phonePretty } from '@/lib/format'
import { areaById } from '@/lib/geo'
import { Shell, getCounts } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Row } from '@/components/ui'
import { logout } from '@/app/_actions/auth'

export const metadata: Metadata = { title: 'Profil', robots: { index: false } }

export default async function ProfilePage() {
  const u = await requireUser('/profil')
  const v = await getViewer()
  const counts = await getCounts(u.id)
  const st = await one<{ saved: number; bookings: number; pending: number; follows: number }>(
    `select (select count(*)::int from favorites where user_id = $1) as saved,
            (select count(*)::int from bookings where user_id = $1 and status in ('pending','confirmed') and day >= to_char(now() + interval '5 hours', 'YYYY-MM-DD')) as bookings,
            (select count(*)::int from bookings where user_id = $1 and status = 'pending') as pending,
            (select count(*)::int from follows where user_id = $1) as follows`,
    [u.id],
  )
  return (
    <Shell active="profil" sheet="narrow" top={<div className="mtop-row"><span className="grow" /><Link href="/profil/sozlamalar" className="cbtn white round" aria-label="Sozlamalar"><Icon name="gear" size={22} /></Link></div>}>
      <div className="inner">
        <div className="flex center gap16">
          <span className="avatar person round lg" style={{ width: 68, height: 68, fontSize: 26 }}>
            {(u.name || 'X').trim().slice(0, 1).toUpperCase()}
          </span>
          <div className="grow">
            <h1 style={{ fontSize: 24 }}>{u.name || 'Ism kiritilmagan'}</h1>
            <div className="muted mt4">{phonePretty(u.phone) || 'Telefon ulanmagan'}</div>
            <div className="small muted mt4 flex center gap4">
              <Icon name="pin" size={14} /> {areaById(v.areaId).label}
            </div>
          </div>
          <Link href="/profil/sozlamalar" className="btn btn-soft btn-sm btn-icon" aria-label="Tahrirlash">
            <Icon name="pencil" size={18} />
          </Link>
        </div>

        <div className="stats mt20" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <Link href="/saqlanganlar" className="stat">
            <div className="v" style={{ marginTop: 0 }}>{st?.saved ?? 0}</div>
            <div className="l">Saqlangan</div>
          </Link>
          <Link href="/bandlarim" className="stat">
            <div className="v" style={{ marginTop: 0 }}>{st?.bookings ?? 0}</div>
            <div className="l">Band</div>
          </Link>
          <Link href="/saqlanganlar?tab=bizneslar" className="stat">
            <div className="v" style={{ marginTop: 0 }}>{st?.follows ?? 0}</div>
            <div className="l">Kuzatish</div>
          </Link>
        </div>

        <div className="promo mt20">
          <div className="eyebrow g">Cho‘ntakcha Business</div>
          <h3 style={{ fontSize: 19 }}>{counts.bizId ? 'Biznesingizni boshqaring' : 'Mahsulot yoki xizmatingizni soting'}</h3>
          <p>{counts.bizId ? 'E’lonlar, narxlar, bandlar va statistika bir joyda.' : 'Birinchi oy bepul, keyin 17 000 so‘m/oy'}</p>
          <Link href={counts.bizId ? '/biznes' : '/biznes/elon/yangi'} className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>
            {counts.bizId ? 'Biznes paneli' : 'E’lon berish'} <Icon name="chev" size={16} />
          </Link>
          <img className="mark" src="/brand/logo_mark_white.webp" alt="" style={{ width: 120, height: 120 }} />
        </div>

        <div className="list mt20">
          <Row href="/xabarlar" icon="chat" title="Xabarlar" end={counts.msgs ? <span className="badge-n" style={{ border: 0 }}>{counts.msgs}</span> : null} />
          <Row href="/saqlanganlar" icon="heart" title="Saqlanganlar" />
          <Row href="/bandlarim" icon="cal" title="Bandlarim" end={st?.pending ? <span className="small">{st.pending} ta kutilmoqda</span> : null} />
          <Row href="/bildirishnomalar" icon="bell" title="Bildirishnomalar" end={counts.notifs ? <span className="badge-n" style={{ border: 0 }}>{counts.notifs}</span> : null} />
          <Row href="/profil/sozlamalar" icon="gear" title="Sozlamalar" />
          {u.is_admin && <Row href="/admin" icon="shield" title="Admin panel" tone="amber" />}
        </div>

        <div className="list mt16">
          <Row href="/yordam" icon="help" title="Yordam" />
          <Row href="/haqida" icon="info" title="Ilova haqida" />
          <form action={logout}>
            <button type="submit" className="row danger" style={{ cursor: 'pointer' }}>
              <span className="itile red">
                <Icon name="logout" />
              </span>
              <span className="grow t" style={{ color: 'var(--red-text)' }}>
                Chiqish
              </span>
            </button>
          </form>
        </div>
      </div>
    </Shell>
  )
}
