import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { myBusiness, subInfo } from '@/lib/business'
import { sellerTodo, stats7, topListings } from '@/lib/seller'
import { openState } from '@/lib/hours'
import { isoWeekday, relShort, money, dateLong, dayLong, addDays, tkDate } from '@/lib/format'
import { SUB_PRICE } from '@/lib/categories'
import { Shell, getCounts } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Avatar, Row } from '@/components/ui'
import { ConfirmAllButton } from '@/components/client/SellerBits'

export const metadata: Metadata = { title: 'Biznes paneli', robots: { index: false } }

const DAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (!prev && !cur) return <span className="d">—</span>
  if (!prev) return <span className="d up">yangi</span>
  const p = Math.round(((cur - prev) / prev) * 100)
  if (p === 0) return <span className="d">0%</span>
  return (
    <span className={`d ${p > 0 ? 'up' : 'down'}`}>
      <Icon name={p > 0 ? 'trendup' : 'trend'} size={14} /> {p > 0 ? '+' : ''}
      {p}%
    </span>
  )
}

function Landing() {
  const today = tkDate()
  return (
    <div className="inner">
      <h1>Cho‘ntakcha Business</h1>
      <p className="page-sub">Do‘koningizni yaqin atrofdagi xaridorlarga ko‘rsating.</p>
      <div className="subcard mt16">
        <div className="eyebrow g">Birinchi oy bepul</div>
        <div className="big">
          0 so‘m <small>bugun</small>
        </div>
        <p>Keyin {money(SUB_PRICE)} so‘m/oy. Istalgan vaqt to‘xtatish mumkin.</p>
        <img className="mark" src="/brand/logo_mark_white.webp" alt="" />
      </div>
      <div className="card mt12">
        <b>Obunaga nimalar kiradi</b>
        <div className="checklist mt10">
          {['Cheksiz e’lon joylash', 'Biznes profili va xaritada belgi', 'Chat, baho va izohlar', 'Ko‘rish, qo‘ng‘iroq va yo‘nalish statistikasi', 'Kuzatuvchilarga aksiya yuborish'].map((t) => (
            <div key={t}>
              <span className="ok">
                <Icon name="check" />
              </span>
              {t}
            </div>
          ))}
        </div>
      </div>
      <div className="card mt12">
        <b>Qanday ishlaydi</b>
        <div className="timeline mt12">
          <div className="st on">
            <i />
            <div>
              <b>Bugun, {dayLong(today)}</b>
              <div className="small muted">Birinchi e’lonni joylaysiz — u darhol chiqadi</div>
            </div>
          </div>
          <div className="st">
            <i />
            <div>
              <b>{dayLong(addDays(today, 27))}</b>
              <div className="small muted">Eslatma: bepul oy tugashiga 3 kun qoldi</div>
            </div>
          </div>
          <div className="st">
            <i />
            <div>
              <b>{dayLong(addDays(today, 30))}</b>
              <div className="small muted">{money(SUB_PRICE)} so‘m — Click, Payme, Uzum yoki karta</div>
            </div>
          </div>
        </div>
      </div>
      <Link href="/biznes/elon/yangi" className="btn btn-primary btn-block mt20">
        Birinchi e’lonni joylash
      </Link>
    </div>
  )
}

export default async function SellerPanel() {
  const u = await requireUser('/biznes')
  const b = await myBusiness(u.id)
  if (!b)
    return (
      <Shell top={<div className="mtop-row" />} nav="buyer" sheet="narrow2">
        <Landing />
      </Shell>
    )
  const [st, top, todo, counts] = await Promise.all([stats7(b.id), topListings(b.id), sellerTodo(b.id), getCounts(u.id)])
  const sub = subInfo(b)
  const open = openState(b)
  const maxV = Math.max(1, ...st.days.map((d) => d.views))
  const subTone = sub.state === 'expired' ? 'red' : sub.state === 'grace' ? 'amber' : ''
  return (
    <Shell
      nav="seller"
      active="panel"
      top={
        <div className="mtop-row">
          <Link href="/" className="cbtn white" aria-label="Xaridor rejimi" title="Xaridor rejimi">
            <Icon name="swap" size={22} />
          </Link>
          <span className="grow" />
          <Link href="/bildirishnomalar" className="cbtn" aria-label="Bildirishnomalar">
            <Icon name="bell" size={22} />
            {counts.notifs > 0 && <span className="badge-n">{counts.notifs}</span>}
          </Link>
        </div>
      }
    >
      <div className="seller-head">
        <Avatar name={b.name} color={b.color} src={b.logo_url} size="lg" />
        <div className="grow">
          <div className="flex center gap8">
            <h1 className="ellipsis" style={{ fontSize: 22 }}>
              {b.name}
            </h1>
            <span className="biz-badge">BUSINESS</span>
          </div>
          <div className={`small b mt4 ${open.open ? 'green' : 'muted'}`}>
            <span className={`dot${open.open ? '' : ' grey'}`} /> {open.label}
          </div>
        </div>
        <Link href={`/b/${b.id}`} className="btn btn-outline btn-sm only-d">
          <Icon name="store" size={18} /> Biznes profili
        </Link>
        <Link href="/biznes/elon/yangi" className="btn btn-primary btn-sm only-d">
          <Icon name="plus" size={18} /> Yangi e’lon
        </Link>
      </div>

      <div className="two mt16" style={{ alignItems: 'stretch' }}>
        <Link href="/biznes/obuna" className={`card flex center gap12${subTone ? ' ' : ''}`} style={subTone === 'red' ? { background: 'var(--red-tint)', borderColor: '#f3caca' } : subTone === 'amber' ? { background: 'var(--amber-tint)', borderColor: '#f6deb0' } : undefined}>
          <span className={`itile${subTone ? ' ' + subTone : ''}`}>
            <Icon name={sub.state === 'expired' ? 'eyeoff' : 'clock'} />
          </span>
          <span className="grow">
            <b style={{ display: 'block' }}>{sub.title}</b>
            <span className="small muted">{sub.text}</span>
          </span>
          <Icon name="chev" />
        </Link>
        <div className="card">
          <div className="flex gap12">
            <span className="itile green">
              <Icon name="checkc" />
            </span>
            <div className="grow">
              <b>Narxlar hali to‘g‘rimi?</b>
              <div className="small muted">
                {todo?.active ?? 0} ta faol e’lon{todo?.oldest ? ` · eng eski tasdiq: ${relShort(todo.oldest)}` : ''}
                {todo?.stale ? <span className="red b"> · {todo.stale} tasi 3 kundan eski</span> : null}
              </div>
            </div>
          </div>
          <div className="btns mt12">
            <ConfirmAllButton className="btn btn-primary btn-sm" />
            <Link href="/biznes/narxlar" className="btn btn-outline btn-sm">
              O‘zgartirish
            </Link>
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <h2>Oxirgi 7 kun</h2>
        </div>
        <div className="stats">
          {(
            [
              ['eye', 'Ko‘rishlar', st.views, st.prev.views],
              ['phone', 'Qo‘ng‘iroqlar', st.calls, st.prev.calls],
              ['nav', 'Yo‘nalishlar', st.routes, st.prev.routes],
              ['chat', 'Chatlar', st.chats, st.prev.chats],
            ] as const
          ).map(([ic, l, cur, prev]) => (
            <div key={l} className="stat">
              <div className="top">
                <span className="itile" style={{ width: 36, height: 36, borderRadius: 10 }}>
                  <Icon name={ic} size={18} />
                </span>
                <Delta cur={cur} prev={prev} />
              </div>
              <div className="v">{money(cur)}</div>
              <div className="l">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="two">
        <div className="sec">
          <div className="card">
            <b>Ko‘rishlar · 7 kun</b>
            <div className="chart">
              {st.days.map((d, i) => (
                <div key={d.day} className={`col${i === 6 ? ' today' : ''}`}>
                  <span>{d.views}</span>
                  <i style={{ height: `${Math.max(4, (d.views / maxV) * 100)}%` }} />
                  <span>{DAYS[isoWeekday(d.day) - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="sec">
          <h2 className="mb12">Bugungi ishlar</h2>
          <div className="list">
            <Row href="/biznes/bandlar" icon="cal" title="Yangi band so‘rovlari" end={todo?.bookings ? <span className="badge-n" style={{ border: 0 }}>{todo.bookings}</span> : <span>0</span>} />
            <Row href="/biznes/izohlar" icon="star" title="Javobsiz izohlar" end={todo?.reviews ? <span className="badge-n" style={{ border: 0 }}>{todo.reviews}</span> : <span>0</span>} />
            <Row href="/xabarlar?rol=sotuvchi" icon="chat" title="O‘qilmagan xabarlar" end={todo?.msgs ? <span className="badge-n" style={{ border: 0 }}>{todo.msgs}</span> : <span>0</span>} />
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <h2>Eng ko‘p ko‘rilgan</h2>
          <Link href="/biznes/elonlar" className="more">
            E’lonlar <Icon name="chev" size={16} />
          </Link>
        </div>
        {top.length ? (
          <div className="list">
            {top.map((l) => (
              <Link key={l.id} href={`/e/${l.id}`} className="row">
                {l.photo ? <img src={l.photo} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }} /> : <span className="itile"><Icon name="image" /></span>}
                <span className="grow">
                  <span className="t ellipsis" style={{ display: 'block' }}>
                    {l.title}
                  </span>
                  <span className="s">
                    {l.views} ko‘rish · {l.saves} saqlash
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card tc">
            <p className="muted">Hali e’lon yo‘q.</p>
            <Link href="/biznes/elon/yangi" className="btn btn-primary btn-sm mt12">
              E’lon qo‘shish
            </Link>
          </div>
        )}
      </div>

      <div className="btns mt20">
        <Link href="/biznes/aksiyalar" className="btn btn-soft">
          <Icon name="megaphone" /> Aksiya joylash
        </Link>
        <Link href={`/b/${b.id}`} className="btn btn-outline">
          <Icon name="store" /> Biznes profili
        </Link>
      </div>
      <div className="list mt16">
        <Row href="/biznes/malumot" icon="pencil" title="Biznes ma’lumotlari" sub="Nomi, manzil, ish vaqti, logo" />
        <Row href="/biznes/obuna" icon="wallet" title="Obuna va to‘lov" sub={sub.until ? `${dateLong(sub.until)}gacha` : ''} />
      </div>
    </Shell>
  )
}
