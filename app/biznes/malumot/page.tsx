import type { Metadata } from 'next'
import { requireBusiness } from '@/lib/business'
import { Shell, TopBack } from '@/components/shell'
import { BusinessForm } from '@/components/client/BusinessForm'

export const metadata: Metadata = { title: 'Biznes ma’lumotlari', robots: { index: false } }

export default async function BusinessInfoPage() {
  const { b } = await requireBusiness('/biznes/malumot')
  return (
    <Shell top={<TopBack fallback="/biznes" />} nav={null} sheet="nonav narrow2">
      <div className="inner">
        <div className="page-h">
          <div>
            <h1>Biznes ma’lumotlari</h1>
            <p className="page-sub">Xaridorlar biznes sahifangizda shularni ko‘radi</p>
          </div>
        </div>
        <BusinessForm
          initial={{
            name: b.name,
            category: b.category,
            phone: b.phone || '',
            address: b.address,
            lat: b.lat,
            lng: b.lng,
            area: b.area,
            open_time: b.open_time,
            close_time: b.close_time,
            days: b.days,
            about: b.about,
            logo_url: b.logo_url,
            delivery: b.delivery,
            delivery_fee: b.delivery_fee,
            delivery_eta: b.delivery_eta || '',
            delivery_area: b.delivery_area || '',
          }}
        />
      </div>
    </Shell>
  )
}
