export type SpecRow = { k: string; v: string }

export type ListingInput = {
  id?: string
  kind: 'product' | 'service'
  photos: string[]
  title: string
  category: string
  condition: 'new' | 'used' | null
  price: number
  unit: string
  description: string
  specs: SpecRow[]
  available: boolean
  delivery: boolean
  delivery_fee: number | null
  delivery_eta: string
  delivery_area: string
  booking: boolean
  booking_start: number
  booking_end: number
  rooms: string
}

export type BusinessInput = {
  name: string
  category: string
  phone: string
  address: string
  lat: number
  lng: number
  area: string
  open_time: string
  close_time: string
  days: string
  about: string
  logo_url: string | null
  delivery: boolean
  delivery_fee: number | null
  delivery_eta: string
  delivery_area: string
}

export type SaveResult = { ok: true; id: string; created: boolean; newBusiness: boolean } | { ok: false; error: string; field?: string }

export const EMPTY_LISTING: ListingInput = {
  kind: 'product',
  photos: [],
  title: '',
  category: '',
  condition: 'new',
  price: 0,
  unit: 'so‘m',
  description: '',
  specs: [],
  available: true,
  delivery: false,
  delivery_fee: null,
  delivery_eta: '',
  delivery_area: '',
  booking: false,
  booking_start: 9,
  booking_end: 21,
  rooms: '',
}

export function photoAllowed(url: string): boolean {
  return (
    /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[\w./-]+$/i.test(url) ||
    /^\/api\/files\/[a-z0-9]+\.(jpg|png|webp)$/.test(url) ||
    /^\/sample\/[a-z]+\.jpg$/.test(url)
  )
}
