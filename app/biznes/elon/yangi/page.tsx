import type { Metadata } from 'next'
import { getViewer, requireUser } from '@/lib/session'
import { myBusiness } from '@/lib/business'
import { EMPTY_LISTING } from '@/lib/seller-types'
import { Shell, TopBack } from '@/components/shell'
import { ListingWizard } from '@/components/client/ListingWizard'

export const metadata: Metadata = { title: 'Yangi e’lon', robots: { index: false } }

export default async function NewListingPage() {
  const u = await requireUser('/biznes/elon/yangi')
  const v = await getViewer()
  const b = await myBusiness(u.id)
  return (
    <Shell top={<TopBack fallback={b ? '/biznes' : '/'} close />} nav={null} sheet="nonav mid">
      <div className="inner">
        <ListingWizard
          initial={EMPTY_LISTING}
          business={b ? { name: b.name, address: b.address, phone: b.phone, delivery: b.delivery, delivery_fee: b.delivery_fee, delivery_eta: b.delivery_eta, delivery_area: b.delivery_area } : null}
          blobEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
          userPhone={u.phone}
          areaId={v.areaId}
          editing={false}
        />
      </div>
    </Shell>
  )
}
