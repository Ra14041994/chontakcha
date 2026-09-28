export type SearchParams = Record<string, string | string[] | undefined>

export type SearchState = {
  q: string
  k: string
  tur: 'hammasi' | 'mahsulot' | 'xizmat' | 'biznes'
  saralash: 'foydali' | 'arzon' | 'yaqin' | 'yangi' | 'reyting'
  km: number
  min: number
  max: number
  reyting: number
  ochiq: boolean
  mavjud: boolean
  yetkazish: boolean
  view: 'royxat' | 'xarita'
  n: number
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''

export function parseSearch(sp: SearchParams): SearchState {
  const tur = one(sp.tur)
  const sar = one(sp.saralash)
  const num = (x: string) => {
    const n = Number(String(x).replace(/[^\d.]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  return {
    q: one(sp.q).slice(0, 80),
    k: one(sp.k).slice(0, 20),
    tur: (['mahsulot', 'xizmat', 'biznes'].includes(tur) ? tur : 'hammasi') as SearchState['tur'],
    saralash: (['arzon', 'yaqin', 'yangi', 'reyting'].includes(sar) ? sar : 'foydali') as SearchState['saralash'],
    km: [1, 3, 5, 10].includes(num(one(sp.km))) ? num(one(sp.km)) : 0,
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    reyting: [4, 4.5].includes(num(one(sp.reyting))) ? num(one(sp.reyting)) : 0,
    ochiq: one(sp.ochiq) === '1',
    mavjud: one(sp.mavjud) === '1',
    yetkazish: one(sp.yetkazish) === '1',
    view: one(sp.view) === 'xarita' ? 'xarita' : 'royxat',
    n: Math.min(400, Math.max(24, Math.floor(num(one(sp.n))) || 24)),
  }
}

export function searchHref(s: Partial<SearchState>, patch: Partial<SearchState> = {}): string {
  const m = { ...s, ...patch }
  const p = new URLSearchParams()
  if (m.q) p.set('q', m.q)
  if (m.k) p.set('k', m.k)
  if (m.tur && m.tur !== 'hammasi') p.set('tur', m.tur)
  if (m.saralash && m.saralash !== 'foydali') p.set('saralash', m.saralash)
  if (m.km) p.set('km', String(m.km))
  if (m.min) p.set('min', String(m.min))
  if (m.max) p.set('max', String(m.max))
  if (m.reyting) p.set('reyting', String(m.reyting))
  if (m.ochiq) p.set('ochiq', '1')
  if (m.mavjud) p.set('mavjud', '1')
  if (m.yetkazish) p.set('yetkazish', '1')
  if (m.view === 'xarita') p.set('view', 'xarita')
  if (m.n && m.n > 24) p.set('n', String(m.n))
  const qs = p.toString()
  return '/qidiruv' + (qs ? '?' + qs : '')
}

export function filterCount(s: SearchState): number {
  return [s.k, s.km, s.min, s.max, s.reyting, s.ochiq, s.mavjud, s.yetkazish, s.saralash !== 'foydali'].filter(Boolean).length
}

export const SORT_LABEL: Record<SearchState['saralash'], string> = {
  foydali: 'Eng foydali',
  arzon: 'Eng arzon',
  yaqin: 'Eng yaqin',
  yangi: 'Eng yangi',
  reyting: 'Reyting',
}
