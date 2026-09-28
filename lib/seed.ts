// Namuna ma’lumotlar (Product Owner qarori: saytda “Namuna” belgisi bilan ko‘rinadi, admin bir tugma bilan o‘chiradi).
// Soxta izoh/baho qo‘shilmaydi. Namuna e’lonlarda chat va band qilish o‘chiq.
import type { Stmt } from './db'
import { normText, searchBlob } from './text'

const C = { lat: 41.069, lng: 71.819 } // Chortoq markazi

type SB = {
  id: string; name: string; category: string; color: string; dLat: number; dLng: number; address: string
  open: string; close: string; days?: string; about: string; phone?: string
  delivery?: { fee: number; eta: string; area: string }
}

const BUSINESSES: SB[] = [
  { id: 'n-tm', name: 'Techno Market', category: 'Texnika va telefonlar', color: '#153759', dLat: 0.0035, dLng: 0.0045, address: 'Navoiy ko‘chasi, 12', open: '09:00', close: '22:00', about: 'Telefonlar, maishiy texnika va aksessuarlar. Rasmiy kafolat, muddatli to‘lov.', delivery: { fee: 15000, eta: '30–60 daqiqa', area: 'Chortoq bo‘ylab' } },
  { id: 'n-ip', name: 'iPoint', category: 'Telefonlar va aksessuarlar', color: '#2E5E4E', dLat: -0.007, dLng: 0.007, address: 'Mustaqillik ko‘chasi, 5', open: '09:00', close: '21:00', about: 'Smartfonlar va aksessuarlar. Eski telefonni almashtirish mumkin.' },
  { id: 'n-az', name: 'AppleZone', category: 'Telefonlar', color: '#234685', dLat: 0.006, dLng: -0.005, address: 'Bobur ko‘chasi, 21', open: '10:00', close: '21:00', about: 'Smartfon va planshetlar. Do‘kon kafolati.', delivery: { fee: 20000, eta: '1–2 soat', area: 'Chortoq bo‘ylab' } },
  { id: 'n-mp', name: 'Mobile Plus', category: 'Telefonlar va gadjetlar', color: '#5C7194', dLat: -0.01, dLng: -0.009, address: 'Chortoq bozori, 2-qator', open: '09:00', close: '19:00', about: 'Telefonlar, quloqchinlar, g‘iloflar.' },
  { id: 'n-nm', name: 'Nur Market', category: 'Oziq-ovqat', color: '#177550', dLat: 0.002, dLng: -0.003, address: 'Alisher Navoiy ko‘chasi, 3', open: '07:00', close: '23:00', about: 'Oziq-ovqat va ichimliklar. Har kuni yangi mahsulotlar.' },
  { id: 'n-bm', name: 'Baraka Market', category: 'Oziq-ovqat', color: '#6B4E16', dLat: -0.004, dLng: 0.0065, address: 'Guliston mahallasi, 7', open: '08:00', close: '22:00', about: 'Mahalla do‘koni: non, sut, sabzavot, ichimliklar.' },
  { id: 'n-db', name: 'Dehqon bozori', category: 'Mahalliy mahsulotlar', color: '#3F7D3A', dLat: -0.009, dLng: 0.0085, address: 'Chortoq dehqon bozori', open: '06:00', close: '18:00', about: 'Mahalliy dehqonlardan meva va sabzavotlar.' },
  { id: 'n-ca', name: 'Cyber Arena', category: 'Game club', color: '#251A46', dLat: 0.015, dLng: 0.011, address: 'Yoshlar ko‘chasi, 8', open: '10:00', close: '02:00', about: 'PlayStation 5, kompyuterlar, VIP xona. Oldindan band qiling.' },
  { id: 'n-nb', name: 'Nafis Beauty', category: 'Go‘zallik saloni', color: '#705071', dLat: 0.008, dLng: 0.0085, address: 'Guliston ko‘chasi, 4', open: '09:00', close: '20:00', days: '123456', about: 'Soch turmaklash, bo‘yash, manikyur.' },
  { id: 'n-qm', name: 'Qulay Mebel', category: 'Mebel do‘koni', color: '#816855', dLat: -0.012, dLng: 0.012, address: 'Sanoat ko‘chasi, 15', open: '09:00', close: '19:00', about: 'Yumshoq mebel, oshxona va yotoqxona mebellari.', delivery: { fee: 50000, eta: '1 kun ichida', area: 'Chortoq tumani' } },
  { id: 'n-cv', name: 'Chortoq Avto', category: 'Avtosalon', color: '#2B3A55', dLat: 0.018, dLng: -0.019, address: 'Namangan yo‘li, 2-km', open: '09:00', close: '18:00', days: '123456', about: 'Yangi va ishlatilgan avtomobillar.' },
  { id: 'n-ux', name: 'Usta xizmati', category: 'Santexnika va ta’mir', color: '#8A4B2A', dLat: -0.006, dLng: -0.007, address: 'Bog‘ishamol mahallasi', open: '08:00', close: '20:00', about: 'Santexnika, elektr, maishiy texnika ta’miri. Uyga chiqib ishlaymiz.' },
  { id: 'n-ta', name: 'Toza Avtomoyka', category: 'Avtomobil yuvish', color: '#255A8C', dLat: 0.01, dLng: -0.006, address: 'Namangan yo‘li, 1', open: '08:00', close: '21:00', about: 'Kompleks yuvish, salon tozalash. Navbatsiz — oldindan band qiling.' },
]

type SL = {
  id: string; biz: string; title: string; cat: string; kind?: 'product' | 'service'; price: number; unit?: string; photo: string
  cond?: 'new' | 'used'; desc?: string; specs?: [string, string][]; delivery?: boolean
  booking?: { start: number; end: number; rooms: string[] }; hoursAgo?: number; available?: boolean
}

const PHONE_SPECS: [string, string][] = [['Xotira', '128 GB'], ['Holati', 'Yangi'], ['Rangi', 'Qora titan'], ['Kafolat', '1 yil, do‘kon']]
const PHONE_DESC = 'Yangi, qutisi ochilmagan. Qora titan rang. Do‘kon kafolati — 1 yil. Boshqa ranglar haqida chatda so‘rashingiz mumkin.'

const LISTINGS: SL[] = [
  { id: 'n-tm-sp128', biz: 'n-tm', title: 'Smartfon Pro · 128 GB', cat: 'phone', price: 9500000, photo: 'phone', cond: 'new', desc: PHONE_DESC, specs: PHONE_SPECS, delivery: true, hoursAgo: 3 },
  { id: 'n-ip-sp128', biz: 'n-ip', title: 'Smartfon Pro · 128 GB', cat: 'phone', price: 9390000, photo: 'phone', cond: 'new', desc: PHONE_DESC, specs: PHONE_SPECS, hoursAgo: 5 },
  { id: 'n-az-sp128', biz: 'n-az', title: 'Smartfon Pro · 128 GB', cat: 'phone', price: 9450000, photo: 'phone', cond: 'new', desc: PHONE_DESC, specs: PHONE_SPECS, delivery: true, hoursAgo: 8 },
  { id: 'n-mp-sp128', biz: 'n-mp', title: 'Smartfon Pro · 128 GB', cat: 'phone', price: 9700000, photo: 'phone', cond: 'new', desc: PHONE_DESC, specs: PHONE_SPECS, hoursAgo: 20 },
  { id: 'n-az-sp256', biz: 'n-az', title: 'Smartfon Pro · 256 GB', cat: 'phone', price: 10900000, photo: 'phone', cond: 'new', specs: [['Xotira', '256 GB'], ['Holati', 'Yangi']], delivery: true, hoursAgo: 30 },
  { id: 'n-ip-sp256', biz: 'n-ip', title: 'Smartfon Pro · 256 GB', cat: 'phone', price: 10750000, photo: 'phone', cond: 'new', specs: [['Xotira', '256 GB'], ['Holati', 'Yangi']], hoursAgo: 26 },
  { id: 'n-ip-spm256', biz: 'n-ip', title: 'Smartfon Pro Max · 256 GB', cat: 'phone', price: 14000000, photo: 'phone', cond: 'new', specs: [['Xotira', '256 GB'], ['Ekran', '6,7 dyuym']], hoursAgo: 40 },
  { id: 'n-nm-cola', biz: 'n-nm', title: 'Kola ichimligi · 1,5 L', cat: 'food', price: 8500, photo: 'cola', cond: 'new', desc: 'Salqin holda. 6 tadan olsangiz — chegirma.', hoursAgo: 2 },
  { id: 'n-bm-cola', biz: 'n-bm', title: 'Kola ichimligi · 1,5 L', cat: 'food', price: 9000, photo: 'cola', cond: 'new', hoursAgo: 6 },
  { id: 'n-db-tom', biz: 'n-db', title: 'Pomidor, mahalliy', cat: 'food', price: 6000, unit: 'so‘m/kg', photo: 'tomato', cond: 'new', desc: 'Mahalliy issiqxona pomidori, har kuni ertalab yangi.', hoursAgo: 4 },
  { id: 'n-nm-tom', biz: 'n-nm', title: 'Pomidor, mahalliy', cat: 'food', price: 7500, unit: 'so‘m/kg', photo: 'tomato', cond: 'new', hoursAgo: 9 },
  { id: 'n-bm-tom', biz: 'n-bm', title: 'Pomidor, mahalliy', cat: 'food', price: 7000, unit: 'so‘m/kg', photo: 'tomato', cond: 'new', hoursAgo: 12 },
  { id: 'n-tm-wash8', biz: 'n-tm', title: 'Kir yuvish mashinasi · 8 kg', cat: 'tech', price: 4350000, photo: 'washer', cond: 'new', desc: 'Yangi, qutisi ochilmagan. 8 kg, 1200 ayl/daq. Rasmiy kafolat — 2 yil.', specs: [['Sig‘imi', '8 kg'], ['Aylanish', '1200 ayl/daq'], ['Energiya', 'A+++'], ['Kafolat', '2 yil']], delivery: true, hoursAgo: 7 },
  { id: 'n-mp-wash8', biz: 'n-mp', title: 'Kir yuvish mashinasi · 8 kg', cat: 'tech', price: 3950000, photo: 'washer', cond: 'new', specs: [['Sig‘imi', '8 kg'], ['Kafolat', '1 yil']], hoursAgo: 15 },
  { id: 'n-tm-dryer', biz: 'n-tm', title: 'Soch quritgich · 2200 W', cat: 'beauty', price: 320000, photo: 'dryer', cond: 'new', specs: [['Quvvati', '2200 W'], ['Rejimlar', '3 ta']], delivery: true, hoursAgo: 11 },
  { id: 'n-nb-dryer', biz: 'n-nb', title: 'Soch quritgich · 2200 W', cat: 'beauty', price: 385000, photo: 'dryer', cond: 'new', hoursAgo: 50 },
  { id: 'n-qm-sofa', biz: 'n-qm', title: 'Divan · 3 o‘rinli', cat: 'furniture', price: 2850000, photo: 'sofa', cond: 'new', desc: 'Yumshoq, yig‘ma. Rangi — och kulrang. Yetkazib berish va yig‘ib berish bor.', specs: [['O‘lchami', '220 × 90 sm'], ['Mato', 'Velyur']], delivery: true, hoursAgo: 14 },
  { id: 'n-cv-car', biz: 'n-cv', title: 'Oilaviy avtomobil, 2023', cat: 'auto', price: 145000000, photo: 'car', cond: 'used', desc: 'Bitta egasi bo‘lgan, avtomat uzatma. Probeg 18 000 km. Hujjatlari tayyor.', specs: [['Yili', '2023'], ['Probeg', '18 000 km'], ['Uzatma', 'Avtomat'], ['Rangi', 'Oq']], hoursAgo: 60 },
  { id: 'n-ca-ps', biz: 'n-ca', title: 'PlayStation · 1 soat', cat: 'leisure', kind: 'service', price: 12000, unit: 'so‘m/soat', photo: 'gamepad', desc: 'PlayStation 5, katta ekran, 2 ta joystik. Oldindan band qiling — joy kafolatlanadi.', booking: { start: 10, end: 24, rooms: ['Umumiy zal', 'VIP xona'] }, hoursAgo: 1 },
  { id: 'n-ux-plumb', biz: 'n-ux', title: 'Santexnik xizmati', cat: 'masters', kind: 'service', price: 80000, unit: 'so‘mdan', photo: 'tools', desc: 'Kran, unitaz, quvurlarni almashtirish va ta’mirlash. Uyga chiqib ishlaymiz.', booking: { start: 8, end: 20, rooms: [] }, hoursAgo: 10 },
  { id: 'n-ux-repair', biz: 'n-ux', title: 'Maishiy texnika ta’miri', cat: 'masters', kind: 'service', price: 100000, unit: 'so‘mdan', photo: 'tools', desc: 'Kir yuvish mashinasi, muzlatkich, konditsioner ta’miri. Diagnostika bepul.', hoursAgo: 36 },
  { id: 'n-ta-wash', biz: 'n-ta', title: 'Avtomobil yuvish · kompleks', cat: 'auto', kind: 'service', price: 60000, unit: 'so‘m', photo: 'car', desc: 'Kuzov, salon, gilamchalar. 40 daqiqa.', booking: { start: 8, end: 21, rooms: ['1-joy', '2-joy'] }, hoursAgo: 18 },
  { id: 'n-nb-hair', biz: 'n-nb', title: 'Soch turmaklash', cat: 'beauty', kind: 'service', price: 150000, unit: 'so‘mdan', photo: 'dryer', desc: 'To‘y va bayramlar uchun turmaklash. Oldindan yoziling.', booking: { start: 9, end: 20, rooms: [] }, hoursAgo: 22 },
]

export function sampleStatements(): Stmt[] {
  const now = Date.now()
  const out: Stmt[] = []
  for (const b of BUSINESSES) {
    out.push({
      text: `insert into businesses (id, name, category, color, lat, lng, address, area, open_time, close_time, days, about, phone,
               delivery, delivery_fee, delivery_eta, delivery_area, is_sample, status)
             values ($1,$2,$3,$4,$5,$6,$7,'chortoq',$8,$9,$10,$11,$12,$13,$14,$15,$16,true,'active')
             on conflict (id) do nothing`,
      params: [
        b.id, b.name, b.category, b.color, C.lat + b.dLat, C.lng + b.dLng, b.address, b.open, b.close, b.days || '1234567', b.about,
        b.phone || null, Boolean(b.delivery), b.delivery?.fee ?? null, b.delivery?.eta ?? null, b.delivery?.area ?? null,
      ],
    })
  }
  const bizName = Object.fromEntries(BUSINESSES.map((b) => [b.id, b]))
  for (const l of LISTINGS) {
    const b = bizName[l.biz]
    const when = new Date(now - (l.hoursAgo ?? 5) * 3600 * 1000)
    const specs = (l.specs || []).map(([k, v]) => ({ k, v }))
    out.push({
      text: `insert into listings (id, business_id, kind, title, norm_title, search_text, category, condition, price, unit, description,
               specs, photos, available, delivery, delivery_fee, delivery_eta, delivery_area, booking, booking_cfg, status, is_sample,
               price_checked_at, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18,$19,$20::jsonb,'active',true,$21,$21,$21)
             on conflict (id) do nothing`,
      params: [
        l.id, l.biz, l.kind || 'product', l.title, normText(l.title), searchBlob([l.title, b.name, b.category, l.desc]), l.cat,
        l.kind === 'service' ? null : l.cond || 'new', l.price, l.unit || 'so‘m', l.desc || '', JSON.stringify(specs),
        JSON.stringify([`/sample/${l.photo}.jpg`]), l.available ?? true, Boolean(l.delivery && b.delivery),
        l.delivery && b.delivery ? b.delivery.fee : null, l.delivery && b.delivery ? b.delivery.eta : null,
        l.delivery && b.delivery ? b.delivery.area : null, Boolean(l.booking), l.booking ? JSON.stringify(l.booking) : null, when,
      ],
    })
  }
  const inDays = (n: number) => new Date(now + n * 86400000).toISOString().slice(0, 10)
  out.push({
    text: `insert into promotions (id, business_id, body, listing_id, until) values
           ('n-pr-qm', 'n-qm', 'Dam olish kunlari barcha divanlarga 10% chegirma', 'n-qm-sofa', $1),
           ('n-pr-tm', 'n-tm', 'Kir yuvish mashinalariga yetkazib berish bepul', 'n-tm-wash8', $2)
           on conflict (id) do nothing`,
    params: [inDays(6), inDays(12)],
  })
  return out
}

export const SAMPLE_BUSINESS_IDS = BUSINESSES.map((b) => b.id)
