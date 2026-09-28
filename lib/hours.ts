import { DAY_LONG, tk } from './format'

export type Hours = { open_time: string; close_time: string; days: string }
export type OpenState = { open: boolean; label: string; short: string }

function toMin(s: string): number {
  const [h, m] = String(s || '0:0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function has(days: string, d: number): boolean {
  return String(days || '1234567').includes(String(d))
}

/** Hozir ochiqmi va qisqa yozuv: “Ochiq · 22:00 gacha” / “Yopiq · 09:00 da ochiladi”. */
export function openState(h: Hours, now: Date = new Date()): OpenState {
  const t = tk(now)
  const wd = t.getUTCDay() === 0 ? 7 : t.getUTCDay()
  const yd = wd === 1 ? 7 : wd - 1
  const cur = t.getUTCHours() * 60 + t.getUTCMinutes()
  const o = toMin(h.open_time)
  const c = toMin(h.close_time)
  const days = h.days || '1234567'
  if (!days.length) return { open: false, label: 'Vaqtincha yopiq', short: 'Yopiq' }

  let open: boolean
  if (o === c) open = has(days, wd)
  else if (c < o) open = (cur >= o && has(days, wd)) || (cur < c && has(days, yd))
  else open = has(days, wd) && cur >= o && cur < c

  if (open) {
    if (o === c) return { open, label: 'Ochiq · 24 soat', short: 'Ochiq' }
    return { open, label: `Ochiq · ${h.close_time} gacha`, short: 'Ochiq' }
  }
  if (has(days, wd) && cur < o) return { open, label: `Yopiq · ${h.open_time} da ochiladi`, short: 'Yopiq' }
  for (let i = 1; i <= 7; i++) {
    const d = ((wd - 1 + i) % 7) + 1
    if (has(days, d)) {
      const when = i === 1 ? 'ertaga' : DAY_LONG[d - 1]
      return { open, label: `Yopiq · ${when} ${h.open_time} da`, short: 'Yopiq' }
    }
  }
  return { open, label: 'Yopiq', short: 'Yopiq' }
}

export function hoursText(h: Hours): string {
  const days = h.days || '1234567'
  const range = h.open_time === h.close_time ? '24 soat' : `${h.open_time}–${h.close_time}`
  if (days === '1234567') return `Har kuni ${range}`
  if (days === '123456') return `Du–Sh ${range}`
  if (days === '12345') return `Du–Ju ${range}`
  const names = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
  return `${days.split('').map((d) => names[Number(d) - 1]).join(', ')} ${range}`
}
