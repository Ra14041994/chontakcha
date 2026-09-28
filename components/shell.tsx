import Link from 'next/link'
import Form from 'next/form'
import { cache } from 'react'
import { one } from '@/lib/db'
import { getViewer } from '@/lib/session'
import { CATEGORIES } from '@/lib/categories'
import { Icon, type IconName } from './Icon'
import { AreaPicker } from './client/AreaPicker'
import { BackButton } from './client/BackButton'

export type Counts = { msgs: number; notifs: number; bk: number; bizId: string | null }

export const getCounts = cache(async (userId: string): Promise<Counts> => {
  const r = await one<{ msgs: number; notifs: number; bk: number; biz_id: string | null }>(
    `select
       (select coalesce(sum(buyer_unread), 0)::int from conversations where buyer_id = $1)
       + (select coalesce(sum(c.seller_unread), 0)::int from conversations c join businesses b on b.id = c.business_id where b.owner_id = $1) as msgs,
       (select count(*)::int from notifications where user_id = $1 and not read) as notifs,
       (select count(*)::int from bookings k join businesses b on b.id = k.business_id where b.owner_id = $1 and k.status = 'pending') as bk,
       (select id from businesses where owner_id = $1 limit 1) as biz_id`,
    [userId],
  )
  return { msgs: r?.msgs ?? 0, notifs: r?.notifs ?? 0, bk: r?.bk ?? 0, bizId: r?.biz_id ?? null }
})

type NavKind = 'buyer' | 'seller' | null

export async function Shell({
  children,
  top,
  nav = 'buyer',
  active,
  sheet = '',
  cats = false,
  footer = false,
  after,
  q,
  appClass,
}: {
  children: React.ReactNode
  top?: React.ReactNode
  nav?: NavKind
  active?: string
  sheet?: string
  cats?: boolean
  footer?: boolean
  after?: React.ReactNode
  q?: string
  appClass?: string
}) {
  const v = await getViewer()
  const counts = v.user ? await getCounts(v.user.id) : null
  return (
    <div className={`app${appClass ? ' ' + appClass : ''}`}>
      <header className="dhead">
        <div className="in">
          <Link href="/" className="dlogo" aria-label="Cho‘ntakcha — bosh sahifa">
            <img src="/brand/logo_word.webp" alt="Cho‘ntakcha" width={163} height={25} />
          </Link>
          <AreaPicker current={v.areaId} label={v.areaLabel} />
          <Form action="/qidiruv" className="dsearch" role="search">
            <Icon name="search" />
            <input name="q" defaultValue={q} placeholder="Telefon, pomidor, avtomoyka…" aria-label="Qidiruv" autoComplete="off" />
            <button type="submit">Qidirish</button>
          </Form>
          <Link href="/saqlanganlar" className="cbtn" aria-label="Saqlanganlar" title="Saqlanganlar">
            <Icon name="heart" />
          </Link>
          <Link href="/xabarlar" className="cbtn" aria-label="Xabarlar" title="Xabarlar">
            <Icon name="chat" />
            {counts && counts.msgs > 0 && <span className="badge-n">{counts.msgs > 99 ? '99+' : counts.msgs}</span>}
          </Link>
          <Link href="/bildirishnomalar" className="cbtn" aria-label="Bildirishnomalar" title="Bildirishnomalar">
            <Icon name="bell" />
            {counts && counts.notifs > 0 && <span className="badge-n">{counts.notifs > 99 ? '99+' : counts.notifs}</span>}
          </Link>
          {counts?.bizId ? (
            <Link href="/biznes" className="btn btn-white">
              <Icon name="dash" /> Biznes paneli
            </Link>
          ) : (
            <Link href="/biznes/elon/yangi" className="btn btn-white">
              <Icon name="plus" /> E’lon berish
            </Link>
          )}
          {v.user ? (
            <Link href="/profil" className="me" aria-label="Profil" title={v.user.name || 'Profil'}>
              {(v.user.name || 'P').trim().slice(0, 1).toUpperCase()}
            </Link>
          ) : (
            <Link href="/kirish" className="btn btn-white">
              Kirish
            </Link>
          )}
        </div>
      </header>
      {top && <div className="mtop only-m">{top}</div>}
      <main className={`sheet ${sheet}`}>
        {cats && <DesktopCats />}
        {children}
        {footer && <DesktopFooter />}
      </main>
      {after}
      {nav && <BottomNav kind={nav} active={active} counts={counts} />}
    </div>
  )
}

function DesktopCats() {
  return (
    <nav className="dcats" aria-label="Kategoriyalar">
      <Link href="/qidiruv" className="first">
        <Icon name="grid" size={18} /> Barcha kategoriyalar
      </Link>
      {CATEGORIES.slice(0, 10).map((c) => (
        <Link key={c.id} href={`/qidiruv?k=${c.id}`}>
          {c.name}
        </Link>
      ))}
      <span className="sp" />
      <Link href="/xarita" className="mapl">
        <Icon name="map" size={18} /> Xaritada ko‘rish
      </Link>
    </nav>
  )
}

function DesktopFooter() {
  return (
    <footer className="dfoot">
      <div>
        <img src="/brand/logo_word.webp" alt="Cho‘ntakcha" width={150} height={23} style={{ height: 23, width: 'auto' }} />
        <p className="mt12" style={{ maxWidth: 360 }}>
          Chortoq va Namangan bo‘ylab yaqin do‘konlar narxlarini bir joyda solishtiring. Har doim cho‘ntagingizda foyda.
        </p>
      </div>
      <div>
        <b>Xaridorlar</b>
        <Link href="/qidiruv">Qidiruv</Link>
        <Link href="/xarita">Xarita</Link>
        <Link href="/saqlanganlar">Saqlanganlar</Link>
      </div>
      <div>
        <b>Sotuvchilar</b>
        <Link href="/biznes/elon/yangi">E’lon berish</Link>
        <Link href="/biznes/obuna">Obuna narxi</Link>
        <Link href="/biznes">Biznes paneli</Link>
      </div>
      <div>
        <b>Yordam</b>
        <Link href="/yordam">Savol-javob</Link>
        <Link href="/maxfiylik">Maxfiylik</Link>
        <Link href="/shartlar">Foydalanish shartlari</Link>
      </div>
    </footer>
  )
}

function NavItem({ href, icon, label, on, badge }: { href: string; icon: IconName; label: string; on?: boolean; badge?: number }) {
  return (
    <Link href={href} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
      <Icon name={icon} size={22} />
      <span>{label}</span>
      {badge ? <span className="badge-n nb">{badge > 99 ? '99+' : badge}</span> : null}
    </Link>
  )
}

export function BottomNav({ kind, active, counts }: { kind: 'buyer' | 'seller'; active?: string; counts: Counts | null }) {
  if (kind === 'seller') {
    return (
      <nav className="bnav" aria-label="Sotuvchi menyusi">
        <NavItem href="/biznes" icon="dash" label="Panel" on={active === 'panel'} />
        <NavItem href="/biznes/elonlar" icon="box" label="E’lonlar" on={active === 'elonlar'} />
        <Link href="/biznes/elon/yangi" aria-label="E’lon qo‘shish">
          <span className="plus">
            <Icon name="plus" size={22} />
          </span>
          <span>Qo‘shish</span>
        </Link>
        <NavItem href="/biznes/bandlar" icon="cal" label="Bandlar" on={active === 'bandlar'} badge={counts?.bk} />
        <NavItem href="/xabarlar?rol=sotuvchi" icon="chat" label="Xabarlar" on={active === 'xabarlar'} badge={counts?.msgs} />
      </nav>
    )
  }
  return (
    <nav className="bnav" aria-label="Asosiy menyu">
      <NavItem href="/" icon="home" label="Asosiy" on={active === 'home'} />
      <NavItem href="/xarita" icon="map" label="Xarita" on={active === 'map'} />
      <Link href="/biznes/elon/yangi" aria-label="E’lon berish">
        <span className="plus">
          <Icon name="plus" size={22} />
        </span>
        <span>E’lon</span>
      </Link>
      <NavItem href="/xabarlar" icon="chat" label="Xabarlar" on={active === 'xabarlar'} badge={counts?.msgs} />
      <NavItem href="/profil" icon="user" label="Profil" on={active === 'profil'} />
    </nav>
  )
}

/** Oddiy ichki sahifa uchun mobil tepa: orqaga tugmasi va o‘ng tomondagi amallar. */
export function TopBack({ fallback = '/', children, close }: { fallback?: string; children?: React.ReactNode; close?: boolean }) {
  return (
    <div className="mtop-row">
      <BackButton fallback={fallback} icon={close ? 'x' : 'back'} />
      <span className="grow" />
      {children}
    </div>
  )
}

export function TopHome({ areaId, areaLabel, notifs }: { areaId: string; areaLabel: string; notifs: number }) {
  return (
    <>
      <div className="mtop-row">
        <Link href="/" className="logo-tile" aria-label="Cho‘ntakcha">
          <img src="/brand/logo_mark.webp" alt="" width={30} height={30} />
        </Link>
        <AreaPicker current={areaId} label={areaLabel} grow />
        <Link href="/saqlanganlar" className="cbtn" aria-label="Saqlanganlar">
          <Icon name="heart" size={22} />
        </Link>
        <Link href="/bildirishnomalar" className="cbtn" aria-label="Bildirishnomalar">
          <Icon name="bell" size={22} />
          {notifs > 0 && <span className="badge-dot" />}
        </Link>
      </div>
      <Form action="/qidiruv" className="msearch" role="search">
        <Icon name="search" />
        <input name="q" placeholder="Nima qidiryapsiz?" aria-label="Qidiruv" autoComplete="off" enterKeyHint="search" />
      </Form>
    </>
  )
}
