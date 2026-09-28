import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { phonePretty } from '@/lib/format'
import { Shell, TopBack } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Note, Row } from '@/components/ui'
import { ProfileForm, NotifyToggles } from '@/components/client/Settings'
import { logout } from '@/app/_actions/auth'
import { deleteAccount } from '@/app/_actions/prefs'

export const metadata: Metadata = { title: 'Sozlamalar', robots: { index: false } }

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ xato?: string }> }) {
  const u = await requireUser('/profil/sozlamalar')
  const { xato } = await searchParams
  return (
    <Shell top={<TopBack fallback="/profil" />} active="profil" sheet="narrow">
      <div className="inner">
        <div className="page-h">
          <h1>Sozlamalar</h1>
        </div>
        <div className="list-title">Profil</div>
        <ProfileForm name={u.name} area={u.area} phone={phonePretty(u.phone)} />

        <div className="list-title">Bildirishnomalar</div>
        <NotifyToggles notify={u.notify || {}} hasTelegram={Boolean(u.tg_id)} />

        <div className="list-title">Til</div>
        <div className="card">
          <div className="seg">
            <button className="on" type="button">
              O‘zbekcha
            </button>
            <button type="button" disabled>
              Ruscha · tez orada
            </button>
          </div>
        </div>

        <div className="list-title">Boshqa</div>
        <div className="list">
          <Row href="/maxfiylik" icon="shield" title="Maxfiylik" />
          <Row href="/yordam" icon="help" title="Yordam" />
          <Row href="/haqida" icon="info" title="Ilova haqida" end={<span>1.0-versiya</span>} />
        </div>

        <form action={logout} className="mt16">
          <button className="btn btn-outline btn-block">
            <Icon name="logout" /> Chiqish
          </button>
        </form>

        <details className="card mt16">
          <summary className="b" style={{ cursor: 'pointer', color: 'var(--red-text)' }}>
            Akkauntni o‘chirish
          </summary>
          <Note tone="red" icon="warn" className="mt12">
            Profil, saqlanganlar, xabarlar va bandlaringiz o‘chiriladi. Biznesingiz bo‘lsa, e’lonlari yashiriladi. Bu amalni qaytarib bo‘lmaydi.
          </Note>
          <form action={deleteAccount} className="mt12">
            <label className="label" style={{ marginTop: 0 }}>
              Tasdiqlash uchun <b>o‘chirish</b> deb yozing
            </label>
            <input className="input" name="confirm" autoComplete="off" />
            {xato === 'tasdiq' && <p className="err">So‘z noto‘g‘ri yozildi.</p>}
            <button className="btn btn-danger btn-block mt10">Akkauntni o‘chirish</button>
          </form>
        </details>
        <p className="tc small muted mt16">
          <Link href="/shartlar">Foydalanish shartlari</Link>
        </p>
      </div>
    </Shell>
  )
}
