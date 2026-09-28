import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { myBusiness, subInfo } from '@/lib/business'
import { getListing } from '@/lib/listings'
import { areaById } from '@/lib/geo'
import { dateLong, money } from '@/lib/format'
import { Shell } from '@/components/shell'
import { Icon } from '@/components/Icon'
import { ShareButton } from '@/components/client/ShareButton'

export const metadata: Metadata = { title: 'E’lon chiqdi', robots: { index: false } }

export default async function DonePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ yangi?: string }> }) {
  const { id } = await params
  const { yangi } = await searchParams
  const u = await requireUser('/biznes')
  const b = await myBusiness(u.id)
  const l = await getListing(id)
  if (!b || !l || l.business_id !== b.id) notFound()
  const sub = subInfo(b)
  return (
    <Shell nav={null} sheet="nonav narrow2" top={<div className="mtop-row" />}>
      <div className="inner tc">
        <div className="bigcheck">
          <div>
            <Icon name="check" size={32} />
          </div>
        </div>
        <h1 className="mt16">E’loningiz chiqdi!</h1>
        <p className="muted mt8" style={{ fontSize: 15 }}>
          Endi u qidiruvda va xaritada ko‘rinadi. {areaById(b.area).name} bo‘yicha xaridorlar uni topa oladi.
        </p>
        <Link href={`/e/${l.id}`} className="card flex gap12 center mt20" style={{ textAlign: 'left' }}>
          {l.photos[0] && <img src={l.photos[0]} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />}
          <span className="grow">
            <b className="ellipsis" style={{ display: 'block' }}>
              {l.title}
            </b>
            <span className="xb" style={{ fontSize: 17 }}>
              {money(l.price)} <small className="muted">{l.unit}</small>
            </span>
          </span>
          <span className="tag green">
            <span className="dot" /> {l.available ? 'Mavjud' : 'Tugagan'}
          </span>
        </Link>
        {yangi && sub.until && (
          <div className="note tint mt12" style={{ justifyContent: 'center' }}>
            <Icon name="cal" />
            <div>Bepul oy boshlandi · {dateLong(sub.until)}gacha</div>
          </div>
        )}
        <div className="btns mt16">
          <ShareButton title={l.title} text={`${l.title} — ${money(l.price)} ${l.unit}`} listingId={l.id} className="btn btn-soft" label="Ulashish" path={`/e/${l.id}`} />
          <Link href="/biznes/elon/yangi" className="btn btn-outline">
            <Icon name="plus" /> Yana qo‘shish
          </Link>
        </div>
        <Link href="/biznes" className="btn btn-primary btn-block mt16">
          Boshqaruv paneliga o‘tish
        </Link>
      </div>
    </Shell>
  )
}
