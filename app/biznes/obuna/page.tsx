import type { Metadata } from 'next'
import Link from 'next/link'
import { q } from '@/lib/db'
import { getUser, adminPhones } from '@/lib/session'
import { myBusiness, subInfo } from '@/lib/business'
import { addDays, dateLong, dateShort, money, tkDate } from '@/lib/format'
import { SUB_PRICE } from '@/lib/categories'
import { Shell, TopBack } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Note } from '@/components/ui'
import { SubPrefs } from '@/components/client/SellerBits'
import { PayRequest } from '@/components/client/PayRequest'

export const metadata: Metadata = { title: 'Obuna', robots: { index: false } }

export default async function SubscriptionPage() {
  const u = await getUser()
  const b = u ? await myBusiness(u.id) : null
  if (!b) {
    return (
      <Shell top={<TopBack fallback="/" />} nav="buyer" sheet="narrow2">
        <div className="inner">
          <h1>Obuna narxi</h1>
          <div className="subcard mt16">
            <div className="eyebrow g">Cho‘ntakcha Business</div>
            <div className="big">
              {money(SUB_PRICE)} <small>so‘m / oy</small>
            </div>
            <p>Birinchi oy bepul. Karta talab qilinmaydi.</p>
            <img className="mark" src="/brand/logo_mark_white.webp" alt="" />
          </div>
          <Link href="/biznes/elon/yangi" className="btn btn-primary btn-block mt16">
            Birinchi e’lonni joylash
          </Link>
        </div>
      </Shell>
    )
  }
  const sub = subInfo(b)
  const payments = await q<{ id: number; amount: number; months: number; method: string | null; created_at: Date }>(
    `select id, amount, months, method, created_at from payments where business_id = $1 order by id desc limit 24`,
    [b.id],
  )
  const from = sub.until && sub.until.getTime() > Date.now() ? tkDate(sub.until) : tkDate()
  const tone = sub.state === 'expired' ? 'red' : sub.state === 'grace' ? 'amber' : 'tint'
  return (
    <Shell top={<TopBack fallback="/biznes" />} nav="seller" sheet="narrow2">
      <div className="inner">
        <div className="page-h">
          <h1>Obunani uzaytirish</h1>
        </div>
        <Note tone={tone} icon={sub.state === 'expired' ? 'eyeoff' : 'clock'}>
          <b>{sub.title}.</b> {sub.state === 'trial' && sub.until ? `Bepul oy ${dateLong(sub.until)}da tugaydi. To‘lov bo‘lmasa, 3 kunlik muhlatdan keyin e’lonlaringiz qidiruvda ko‘rinmay qoladi. To‘lagach, darhol qaytadi.` : sub.text}
        </Note>
        <div className="card flex center gap12 mt16">
          <span className="itile">
            <Icon name="store" />
          </span>
          <div className="grow">
            <b style={{ display: 'block' }}>Cho‘ntakcha Business · 1 oy</b>
            <span className="small muted">
              {dateLong(from + 'T12:00:00Z')} – {dateLong(addDays(from, 30) + 'T12:00:00Z')}
            </span>
          </div>
          <b style={{ fontSize: 20 }}>
            {money(SUB_PRICE)} <small className="muted" style={{ fontSize: 13 }}>so‘m</small>
          </b>
        </div>
        <SubPrefs autoRenew={b.auto_renew} method={b.pay_method} />
        <div className="mt20">
          <PayRequest label={`${money(SUB_PRICE)} so‘m to‘lash`} method={b.pay_method || 'click'} adminPhone={adminPhones()[0] || null} />
        </div>
        <p className="tc small muted mt10">Chek “Bildirishnomalar” bo‘limida saqlanadi.</p>
        {payments.length > 0 && (
          <>
            <div className="list-title">To‘lovlar tarixi</div>
            <div className="list">
              {payments.map((p) => (
                <div key={p.id} className="row">
                  <span className="itile green">
                    <Icon name="receipt" />
                  </span>
                  <span className="grow">
                    <span className="t" style={{ display: 'block' }}>
                      {p.months} oy · {money(p.amount)} so‘m
                    </span>
                    <span className="s">{p.method || 'Administrator'}</span>
                  </span>
                  <span className="end">{dateShort(p.created_at)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Shell>
  )
}
