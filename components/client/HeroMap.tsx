'use client'
import { useRouter } from 'next/navigation'
import { MapView, type MapPoint } from './MapView'

/** Kichik, statik xarita. `link` bo‘lsa belgini bosganda e’longa o‘tadi. */
export function HeroMap({ points, center, me, link = true, interactive = false, zoom = 14 }: { points: MapPoint[]; center: [number, number]; me?: [number, number] | null; link?: boolean; interactive?: boolean; zoom?: number }) {
  const router = useRouter()
  return (
    <div className="mapbox" style={{ position: 'absolute', inset: 0 }}>
      <MapView points={points} center={center} zoom={zoom} me={me} interactive={interactive} fit={points.length > 1} onSelect={link ? (id) => router.push('/e/' + id) : undefined} />
    </div>
  )
}
