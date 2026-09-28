import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/session'
import { telegramEnabled } from '@/lib/telegram'
import { safeNext } from '@/lib/url'
import { Shell, TopBack } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Note } from '@/components/ui'
import { TelegramLogin } from '@/components/client/TelegramLogin'
import { demoAllowed, demoLogin } from '@/app/_actions/auth'

export const metadata: Metadata = { title: 'Kirish', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; xato?: string }> }) {
  const sp = await searchParams
  const next = safeNext(sp.next)
  if (await getUser()) redirect(next)
  const demo = await demoAllowed()
  return (
    <Shell top={<TopBack fallback="/" close />} nav={null} sheet="nonav narrow2">
      <div className="inner">
        <div className="itile lg" style={{ marginTop: 6 }}>
          <Icon name="phonedev" size={24} />
        </div>
        <h1 className="mt16">Cho‘ntakcha’ga kirish</h1>
        <p className="page-sub" style={{ fontSize: 15 }}>
          Telefon raqamingiz Telegram orqali tasdiqlanadi. Parol va SMS kod kerak emas.
        </p>
        {sp.xato === 'havola' && (
          <Note tone="red" icon="alert" className="mt16">
            Havola eskirgan yoki ishlatilgan. Qaytadan kiring.
          </Note>
        )}
        <div className="auth-card mt20">
          {telegramEnabled() ? (
            <TelegramLogin next={next} />
          ) : (
            <Note tone="amber" icon="warn">
              Telegram bot hali ulanmagan. Administrator Vercel’da <b>TELEGRAM_BOT_TOKEN</b> ni qo‘shishi kerak.
            </Note>
          )}
          <div className="steps">
            <div>
              <b className="n">1</b> “Telegram orqali kirish” tugmasini bosing — Telegram ochiladi.
            </div>
            <div>
              <b className="n">2</b> Botda <b>Start</b>, keyin <b>“Raqamni yuborish”</b>ni bosing.
            </div>
            <div>
              <b className="n">3</b> Saytga qayting — avtomatik kirasiz.
            </div>
          </div>
        </div>
        <Note icon="lock" className="mt16">
          Raqamingiz sotuvchilarga avtomatik ko‘rsatilmaydi. U faqat kirish va xavfsizlik uchun kerak.
        </Note>
        <p className="small muted mt16">
          SMS orqali kirish tez orada qo‘shiladi. Davom etib, <Link href="/shartlar" className="link">foydalanish shartlari</Link> va{' '}
          <Link href="/maxfiylik" className="link">maxfiylik siyosati</Link>ga rozilik bildirasiz.
        </p>
        <Link href={next === '/' ? '/' : next.startsWith('/biznes') || next.startsWith('/profil') ? '/' : next} className="btn btn-ghost btn-block mt12">
          Hozircha kirmasdan davom etish
        </Link>
        {demo && (
          <form action={demoLogin} className="card mt24" style={{ borderStyle: 'dashed' }}>
            <div className="eyebrow">Faqat sinov uchun (lokal)</div>
            <input type="hidden" name="next" value={next} />
            <div className="field-row mt10">
              <input className="input" name="name" placeholder="Ism" defaultValue="Aziz Rahimov" />
              <input className="input" name="phone" placeholder="+998901234567" defaultValue="+998901234567" />
            </div>
            <label className="check mt10">
              <input type="checkbox" name="admin" /> Admin
            </label>
            <button className="btn btn-outline btn-block mt10">Sinov kirish</button>
          </form>
        )}
      </div>
    </Shell>
  )
}
