import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { Shell, TopBack, getCounts } from '@/components/shell'
import { ConvList, loadConvs } from './list'

export const metadata: Metadata = { title: 'Xabarlar', robots: { index: false } }

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ rol?: string; f?: string }> }) {
  const u = await requireUser('/xabarlar')
  const { rol, f } = await searchParams
  const counts = await getCounts(u.id)
  const all = await loadConvs(u.id, rol)
  const rows = f === 'oqilmagan' ? all.filter((r) => r.unread > 0) : all
  const unread = all.filter((r) => r.unread > 0).length
  const seller = rol === 'sotuvchi'
  const base = seller ? '/xabarlar?rol=sotuvchi' : '/xabarlar'
  return (
    <Shell top={<TopBack fallback={seller ? '/biznes' : '/'} />} nav={seller ? 'seller' : 'buyer'} active="xabarlar" sheet="narrow">
      <div className="inner">
        <div className="page-h">
          <h1>Xabarlar</h1>
        </div>
        {counts.bizId && (
          <div className="chips mb12">
            <Link href="/xabarlar" className={`chip sm${!rol ? ' on' : ''}`} replace>
              Hammasi
            </Link>
            <Link href="/xabarlar?rol=xaridor" className={`chip sm${rol === 'xaridor' ? ' on' : ''}`} replace>
              Men yozganlar
            </Link>
            <Link href="/xabarlar?rol=sotuvchi" className={`chip sm${seller ? ' on' : ''}`} replace>
              Biznesimga
            </Link>
          </div>
        )}
        <div className="seg mb16">
          <Link href={base} className={f !== 'oqilmagan' ? 'on' : ''} replace>
            Hammasi
          </Link>
          <Link href={base + (base.includes('?') ? '&' : '?') + 'f=oqilmagan'} className={f === 'oqilmagan' ? 'on' : ''} replace>
            O‘qilmagan{unread ? ` · ${unread}` : ''}
          </Link>
        </div>
        <ConvList rows={rows} />
        {rows.length > 0 && <p className="tc small muted mt16">Suhbatlar 6 oy saqlanadi</p>}
      </div>
    </Shell>
  )
}
