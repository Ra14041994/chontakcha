import type { Metadata } from 'next'
import { cards } from '@/lib/listings'
import { getViewer } from '@/lib/session'
import { Shell } from '@/components/shell'
import { ResultsMap, type MapItem } from '@/components/client/ResultsMap'
import { SearchTop } from '@/components/client/SearchUI'
import { parseSearch } from '@/lib/search'

export const metadata: Metadata = { title: 'Xarita' }

export default async function MapPage() {
  const v = await getViewer()
  const list = await cards({ lat: v.lat, lng: v.lng, userId: v.user?.id, sort: 'yaqin', limit: 300, maxKm: 30 })
  const items: MapItem[] = list.map((c) => ({
    id: c.id,
    title: c.title,
    price: c.price,
    unit: c.unit,
    photo: c.photo,
    biz_id: c.biz_id,
    biz_name: c.biz_name,
    lat: c.lat,
    lng: c.lng,
    dist: c.dist,
    cheapest: c.cheapest,
    open: c.openState.open,
    is_sample: c.is_sample,
  }))
  const s = parseSearch({ view: 'xarita' })
  return (
    <Shell top={<SearchTop s={s} />} active="map" sheet="mapmode" appClass="map-page">
      <div className="only-d mb16">
        <h1 style={{ fontSize: 26 }}>Xarita — {v.areaLabel}</h1>
        <p className="muted mt4">Belgidagi narx — shu do‘kondagi eng arzon e’lon. Yashil — shu mahsulotning eng arzon narxi.</p>
      </div>
      <ResultsMap items={items} center={[v.lat, v.lng]} me={v.precise ? [v.lat, v.lng] : null} />
    </Shell>
  )
}
