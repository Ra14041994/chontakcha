import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getViewer, requireUser } from '@/lib/session'
import { myBusiness } from '@/lib/business'
import { getListing } from '@/lib/listings'
import { cfgOf } from '@/lib/bookings'
import type { ListingInput } from '@/lib/seller-types'
import { Shell, TopBack } from '@/components/shell'
import { ListingWizard } from '@/components/client/ListingWizard'

export const metadata: Metadata = { title: 'E’lonni tahrirlash', robots: { index: false } }

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await requireUser(`/biznes/elon/${id}`)
  const v = await getViewer()
  const b = await myBusiness(u.id)
  if (!b) redirect('/biznes/elon/yangi')
  const l = await getListing(id)
  if (!l || l.business_id !== b.id) notFound()
  const cfg = cfgOf(l.booking_cfg)
  const initial: ListingInput = {
    id: l.id,
    kind: l.kind,
    photos: l.photos || [],
    title: l.title,
    category: l.category,
    condition: (l.condition as 'new' | 'used' | null) ?? null,
    price: l.price,
    unit: l.unit,
    description: l.description,
    specs: l.specs || [],
    available: l.available,
    delivery: l.delivery,
    delivery_fee: l.delivery_fee,
    delivery_eta: l.delivery_eta || '',
    delivery_area: l.delivery_area || '',
    booking: l.booking,
    booking_start: cfg.start,
    booking_end: cfg.end,
    rooms: cfg.rooms.join(', '),
  }
  return (
    <Shell top={<TopBack fallback="/biznes/elonlar" close />} nav={null} sheet="nonav mid">
      <div className="inner">
        <ListingWizard
          initial={initial}
          business={{ name: b.name, address: b.address, phone: b.phone, delivery: b.delivery, delivery_fee: b.delivery_fee, delivery_eta: b.delivery_eta, delivery_area: b.delivery_area }}
          userPhone={u.phone}
          areaId={v.areaId}
          editing
        />
      </div>
    </Shell>
  )
}
