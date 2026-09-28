import type { Metadata } from 'next'
import { q } from '@/lib/db'
import { requireBusiness } from '@/lib/business'
import { relShort } from '@/lib/format'
import { Shell, TopBack } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { Empty } from '@/components/ui'
import { ConfirmAllButton } from '@/components/client/SellerBits'
import { PriceEditor } from '@/components/client/PriceEditor'

export const metadata: Metadata = { title: 'Narxlarni tasdiqlash', robots: { index: false } }

export default async function PricesPage() {
  const { b } = await requireBusiness('/biznes/narxlar')
  const rows = await q<{ id: string; title: string; price: number; unit: string; photo: string | null; price_checked_at: Date }>(
    `select id, title, price, unit, photos->>0 as photo, price_checked_at from listings where business_id = $1 and status = 'active' order by title`,
    [b.id],
  )
  const oldest = rows.reduce<Date | null>((m, r) => (!m || r.price_checked_at < m ? r.price_checked_at : m), null)
  return (
    <Shell top={<TopBack fallback="/biznes" />} nav={null} sheet="nonav narrow">
      <div className="inner">
        <div className="page-h">
          <h1>Narxlarni tasdiqlash</h1>
        </div>
        {!rows.length ? (
          <Empty icon="box" title="Faol e’lon yo‘q" />
        ) : (
          <>
            <div className="card tc">
              <div className="itile green lg" style={{ margin: '0 auto' }}>
                <Icon name="checkc" size={24} />
              </div>
              <h3 className="mt12">Narxlaringiz hali ham to‘g‘rimi?</h3>
              <p className="small muted mt4">
                {rows.length} ta faol e’lon{oldest ? ` · eng eski tasdiq: ${relShort(oldest)}` : ''}
              </p>
              <ConfirmAllButton className="btn btn-primary btn-block mt16" />
              <p className="tiny muted mt10">Tasdiqlangan narxlar xaridorga “Narx bugun tasdiqlangan” belgisi bilan ko‘rinadi.</p>
            </div>
            <div className="list-title">Yoki o‘zgarganini yozing</div>
            <PriceEditor rows={rows.map((r) => ({ id: r.id, title: r.title, price: r.price, unit: r.unit, photo: r.photo }))} />
          </>
        )}
      </div>
    </Shell>
  )
}
