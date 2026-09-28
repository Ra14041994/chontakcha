'use client'
import dynamic from 'next/dynamic'

export type MapPoint = {
  id: string
  lat: number
  lng: number
  label: string
  tone?: 'cheap' | 'sel' | 'biz' | 'default'
  title?: string
}

export type MapProps = {
  points: MapPoint[]
  center: [number, number]
  zoom?: number
  me?: [number, number] | null
  interactive?: boolean
  fit?: boolean
  selected?: string | null
  onSelect?: (id: string) => void
  pick?: [number, number] | null
  onPick?: (lat: number, lng: number) => void
}

const Inner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => <div className="skel" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />,
})

export function MapView(props: MapProps) {
  return <Inner {...props} />
}
