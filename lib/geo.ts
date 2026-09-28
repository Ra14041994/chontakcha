export type Area = { id: string; name: string; label: string; lat: number; lng: number }

export const AREAS: Area[] = [
  { id: 'chortoq', name: 'Chortoq', label: 'Chortoq markazi', lat: 41.069, lng: 71.819 },
  { id: 'namangan', name: 'Namangan', label: 'Namangan shahri', lat: 40.9983, lng: 71.6726 },
  { id: 'uychi', name: 'Uychi', label: 'Uychi markazi', lat: 41.0808, lng: 71.9233 },
  { id: 'uchqorgon', name: 'Uchqo‘rg‘on', label: 'Uchqo‘rg‘on markazi', lat: 41.1136, lng: 72.0794 },
]

export function areaById(id?: string | null): Area {
  return AREAS.find((a) => a.id === id) || AREAS[0]
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** SQL ifoda: `b` jadvalidagi nuqtagacha km (parametrlar: lat, lng raqamlari). */
export function distSql(latParam: string, lngParam: string, alias = 'b'): string {
  return `(6371 * 2 * asin(least(1, sqrt(power(sin(radians(${alias}.lat - ${latParam}) / 2), 2) + cos(radians(${latParam})) * cos(radians(${alias}.lat)) * power(sin(radians(${alias}.lng - ${lngParam}) / 2), 2)))))`
}

export function yandexRoute(lat: number, lng: number): string {
  return `https://yandex.uz/maps/?rtext=~${lat},${lng}&rtt=auto`
}

export function yandexPoint(lat: number, lng: number): string {
  return `https://yandex.uz/maps/?pt=${lng},${lat}&z=17&l=map`
}

export function validLatLng(lat: unknown, lng: unknown): boolean {
  const a = Number(lat)
  const b = Number(lng)
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 && !(a === 0 && b === 0)
}
