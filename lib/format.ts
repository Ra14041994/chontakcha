// Formatlash yordamchilari (server va brauzerda ishlaydi). Vaqt — Toshkent (UTC+5, yozgi vaqt yo‘q).
const TZ_MS = 5 * 3600 * 1000

export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
export const DAY_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'] // 1=Dushanba … 7=Yakshanba
export const DAY_MID = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak']
export const DAY_LONG = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']

/** Toshkent vaqtiga siljitilgan sana: faqat getUTC* metodlari bilan o‘qing. */
export function tk(d: Date | string | number = new Date()): Date {
  return new Date(new Date(d).getTime() + TZ_MS)
}

/** Toshkent bo‘yicha bugungi sana 'YYYY-MM-DD'. */
export function tkDate(d: Date | string | number = new Date()): string {
  return tk(d).toISOString().slice(0, 10)
}

/** 'YYYY-MM-DD' ga n kun qo‘shish. */
export function addDays(day: string, n: number): string {
  const t = new Date(day + 'T00:00:00Z')
  t.setUTCDate(t.getUTCDate() + n)
  return t.toISOString().slice(0, 10)
}

/** ISO hafta kuni 1..7 ('YYYY-MM-DD' uchun). */
export function isoWeekday(day: string): number {
  const w = new Date(day + 'T00:00:00Z').getUTCDay()
  return w === 0 ? 7 : w
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function money(n: number | string | null | undefined): string {
  const v = Math.round(Number(n) || 0)
  const s = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return v < 0 ? '−' + s : s
}

/** Xarita belgilari uchun qisqa narx: 9,39 mln · 8 500 */
export function priceShort(n: number): string {
  const v = Number(n) || 0
  if (v >= 1e9) return trimDec(v / 1e9, 1) + ' mlrd'
  if (v >= 1e6) return trimDec(v / 1e6, v >= 1e8 ? 0 : 2) + ' mln'
  return money(v)
}

function trimDec(v: number, digits: number): string {
  return v.toFixed(digits).replace(/\.?0+$/, '').replace('.', ',')
}

/** Birlikdan qisqa qo‘shimcha: 'so‘m/kg' → '/kg' (belgilar uchun). */
export function unitTail(unit: string): string {
  const i = unit.indexOf('/')
  return i >= 0 ? unit.slice(i) : ''
}

export function km(d: number | null | undefined): string {
  if (d == null || !Number.isFinite(Number(d))) return ''
  const v = Number(d)
  if (v < 1) return `${Math.max(10, Math.round(v * 100) * 10)} m`
  if (v < 10) return `${v.toFixed(1).replace('.', ',')} km`
  return `${Math.round(v)} km`
}

export function hm(d: Date | string | number): string {
  const t = tk(d)
  return `${pad2(t.getUTCHours())}:${pad2(t.getUTCMinutes())}`
}

export function dateShort(d: Date | string | number): string {
  const t = tk(d)
  return `${pad2(t.getUTCDate())}.${pad2(t.getUTCMonth() + 1)}`
}

export function dateLong(d: Date | string | number): string {
  const t = tk(d)
  return `${t.getUTCDate()}-${MONTHS[t.getUTCMonth()]}`
}

/** 'YYYY-MM-DD' → '29-sentabr' */
export function dayLong(day: string): string {
  const [, m, dd] = day.split('-').map(Number)
  return `${dd}-${MONTHS[m - 1]}`
}

/** 'YYYY-MM-DD' → 'Bugun' / 'Ertaga' / 'Chorshanba' */
export function dayWord(day: string, today = tkDate()): string {
  if (day === today) return 'Bugun'
  if (day === addDays(today, 1)) return 'Ertaga'
  if (day === addDays(today, -1)) return 'Kecha'
  return DAY_LONG[isoWeekday(day) - 1]
}

export function daysBetween(a: Date | string | number, b: Date | string | number): number {
  const da = tkDate(a)
  const db = tkDate(b)
  return Math.round((Date.parse(db + 'T00:00:00Z') - Date.parse(da + 'T00:00:00Z')) / 86400000)
}

/** Ro‘yxatlar uchun qisqa vaqt: 10:29 · Kecha · Dush · 24.09 */
export function relShort(d: Date | string | number, now: Date = new Date()): string {
  const diff = daysBetween(d, now)
  if (diff <= 0) return hm(d)
  if (diff === 1) return 'Kecha'
  if (diff < 7) return DAY_MID[isoWeekday(tkDate(d)) - 1]
  return dateShort(d)
}

/** Izohlar uchun: hozirgina · 5 daqiqa oldin · 2 kun oldin · 1 hafta oldin */
export function ago(d: Date | string | number, now: Date = new Date()): string {
  const s = Math.max(0, (now.getTime() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'hozirgina'
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`
  const days = Math.floor(s / 86400)
  if (days < 7) return days === 1 ? 'kecha' : `${days} kun oldin`
  if (days < 30) return `${Math.floor(days / 7)} hafta oldin`
  if (days < 365) return `${Math.floor(days / 30)} oy oldin`
  return `${Math.floor(days / 365)} yil oldin`
}

/** Narx yangiligi: 'Narx bugun 10:24 da tasdiqlangan' */
export function freshness(d: Date | string | number | null | undefined, now: Date = new Date()): { text: string; stale: boolean; days: number } {
  if (!d) return { text: 'Narx tasdiqlanmagan', stale: true, days: 99 }
  const days = daysBetween(d, now)
  if (days <= 0) return { text: `Narx bugun ${hm(d)} da tasdiqlangan`, stale: false, days: 0 }
  if (days === 1) return { text: 'Narx kecha tasdiqlangan', stale: false, days }
  return { text: `Narx ${days} kun oldin tasdiqlangan`, stale: days >= 3, days }
}

export function initials(name: string | null | undefined): string {
  const words = String(name || '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/** 'Aziz Rahimov' → 'Aziz R.' */
export function shortName(name: string | null | undefined): string {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'Xaridor'
  if (words.length === 1) return words[0]
  return `${words[0]} ${words[1][0].toUpperCase()}.`
}

/** '+998901234567' → '+998 90 123 45 67' */
export function phonePretty(p: string | null | undefined): string {
  const d = String(p || '').replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('998')) {
    return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`
  }
  return p ? String(p) : ''
}

/** Istalgan yozuvdan '+998XXXXXXXXX' (yaroqsiz bo‘lsa null). */
export function normalizePhone(p: string | null | undefined): string | null {
  let d = String(p || '').replace(/\D/g, '')
  if (d.length === 9) d = '998' + d
  if (d.length !== 12 || !d.startsWith('998')) return null
  return '+' + d
}

export function clampText(s: unknown, max: number): string {
  return String(s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
}

export function oneLine(s: unknown, max: number): string {
  return String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** '4 350 000' yoki '4350000 so‘m' → 4350000 */
export function parseMoney(s: unknown): number {
  const n = Number(String(s ?? '').replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? Math.min(n, 1e13) : 0
}

export function ratingText(r: number | null | undefined): string {
  return (Math.round((Number(r) || 0) * 10) / 10).toFixed(1).replace('.', ',')
}
