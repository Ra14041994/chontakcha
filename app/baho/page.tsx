import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { one, q } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { shortName } from '@/lib/format'
import { Shell, TopBack } from '@/components/shell'
import { Note } from '@/components/ui'
import { ReviewForm } from '@/components/client/ReviewForm'

export const metadata: Metadata = { title: 'Baho qoldirish', robots: { index: false } }

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ l?: string; b?: string; bk?: string }> }) {
  const sp = await searchParams
  const u = await requireUser('/baho?' + new URLSearchParams(sp as Record<string, string>).toString())
  let bizId = sp.b || ''
  if (sp.l) {
    const l = await one<{ business_id: string }>(`select business_id from listings where id = $1`, [sp.l])
    if (!l) notFound()
    bizId = l.business_id
  }
  const biz = await one<{ id: string; name: string; owner_id: string | null; is_sample: boolean }>(`select id, name, owner_id, is_sample from businesses where id = $1`, [bizId])
  if (!biz) notFound()
  const listings = await q<{ id: string; title: string }>(`select id, title from listings where business_id = $1 and status = 'active' order by views desc limit 50`, [biz.id])
  if (!listings.length) notFound()
  const initialListing = sp.l && listings.some((x) => x.id === sp.l) ? sp.l : listings[0].id
  const existing = await one<{ rating: number; tags: string[]; body: string }>(`select rating, tags, body from reviews where user_id = $1 and listing_id = $2`, [u.id, initialListing])
  return (
    <Shell top={<TopBack fallback={sp.l ? `/e/${sp.l}` : `/b/${biz.id}`} close />} nav={null} sheet="nonav narrow2">
      <div className="inner">
        <h1>Baho qoldirish</h1>
        <p className="page-sub mb16">{biz.name}</p>
        {biz.is_sample ? (
          <Note tone="amber">Namuna biznesga baho qo‘yib bo‘lmaydi.</Note>
        ) : biz.owner_id === u.id ? (
          <Note tone="amber">O‘z biznesingizga baho qo‘ya olmaysiz.</Note>
        ) : (
          <ReviewForm listings={listings} initialListing={initialListing} bookingId={sp.bk} blobEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} userName={shortName(u.name)} initial={existing} />
        )}
      </div>
    </Shell>
  )
}
