import type { IconName } from './icons'

export type Kind = 'product' | 'service'
export type Category = { id: string; name: string; short?: string; img?: string; icon: IconName; kinds: Kind[] }

export const CATEGORIES: Category[] = [
  { id: 'phone', name: 'Telefonlar', img: '/sample/phone.jpg', icon: 'phonedev', kinds: ['product', 'service'] },
  { id: 'food', name: 'Oziq-ovqat', img: '/sample/tomato.jpg', icon: 'bag', kinds: ['product'] },
  { id: 'tech', name: 'Maishiy texnika', short: 'Texnika', img: '/sample/washer.jpg', icon: 'zap', kinds: ['product', 'service'] },
  { id: 'furniture', name: 'Mebel', img: '/sample/sofa.jpg', icon: 'home', kinds: ['product'] },
  { id: 'auto', name: 'Avtomobillar', short: 'Avtomobil', img: '/sample/car.jpg', icon: 'truck', kinds: ['product', 'service'] },
  { id: 'leisure', name: 'Dam olish', img: '/sample/gamepad.jpg', icon: 'gift', kinds: ['service', 'product'] },
  { id: 'beauty', name: 'Go‘zallik', img: '/sample/dryer.jpg', icon: 'sparkles', kinds: ['service', 'product'] },
  { id: 'masters', name: 'Ustalar', img: '/sample/tools.jpg', icon: 'wrench', kinds: ['service'] },
  { id: 'housing', name: 'Uy-joy', icon: 'home', kinds: ['product', 'service'] },
  { id: 'education', name: 'Ta’lim', icon: 'badge', kinds: ['service'] },
  { id: 'clothes', name: 'Kiyim-kechak', icon: 'bag', kinds: ['product'] },
  { id: 'other', name: 'Boshqa', icon: 'grid', kinds: ['product', 'service'] },
]

export function categoryById(id?: string | null): Category {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

export const UNITS = ['so‘m', 'so‘m/kg', 'so‘m/dona', 'so‘m/soat', 'so‘m/kishi', 'so‘mdan', 'so‘m/oy', 'so‘m/m²']

export const BUSINESS_TYPES = [
  'Texnika va telefonlar',
  'Oziq-ovqat',
  'Mebel',
  'Avtomobillar',
  'Go‘zallik saloni',
  'Dam olish va o‘yinlar',
  'Usta va ta’mir xizmati',
  'Kiyim-kechak',
  'Uy-joy',
  'Ta’lim markazi',
  'Kafe va restoran',
  'Boshqa',
]

export const REVIEW_TAGS = ['Narxi mos', 'Xushmuomala', 'Tez xizmat', 'Sifatli', 'Toza joy', 'Tez yetkazdi', 'Joy kam', 'Kechikdi']

export const REPORT_REASONS = ['Narx noto‘g‘ri', 'Mahsulot yo‘q', 'Firibgarlik', 'Noto‘g‘ri rasm yoki ma’lumot', 'Boshqa']

export const SUB_PRICE = 17000
export const GRACE_DAYS = 3
export const MAX_PHOTOS = 5
