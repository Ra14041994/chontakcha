import type { Metadata } from 'next'
import Link from 'next/link'
import { StaticPage } from '@/components/StaticPage'

export const metadata: Metadata = { title: 'Yordam' }

const QA: [string, string][] = [
  ['Cho‘ntakcha nima?', 'Chortoq va Namangan bo‘ylab yaqin do‘konlar, ustalar va xizmatlar narxlarini bir joyda solishtiradigan sayt. Bir xil mahsulotning qaysi do‘konda arzonroq va yaqinroq ekanini darhol ko‘rasiz.'],
  ['Qanday kiraman?', '“Kirish” tugmasini bosing, keyin “Telegram orqali kirish”. Telegram’dagi botda “Start” va “Raqamni yuborish”ni bosasiz — saytga qaytganingizda avtomatik kirasiz. Parol yoki SMS kerak emas.'],
  ['Raqamim sotuvchilarga ko‘rinadimi?', 'Yo‘q. Xaridorning telefon raqami sotuvchilarga avtomatik ko‘rsatilmaydi. Sotuvchi bilan saytdagi chat orqali yozishasiz.'],
  ['“Eng arzon” va “Eng foydali” nimani anglatadi?', '“Eng arzon” — bir xil mahsulot yaqin atrofdagi do‘konlar ichida eng past narxda. “Eng foydali” — narx va masofani birga hisoblaganda eng qulay taklif: masalan, bir oz qimmatroq, lekin ancha yaqin.'],
  ['“Namuna” belgisi nima?', 'Sayt qanday ishlashini ko‘rsatish uchun qo‘yilgan namuna e’lonlar. Ularda chat va band qilish o‘chiq. Haqiqiy do‘konlar qo‘shilgach, namunalar olib tashlanadi.'],
  ['Qanday e’lon beraman?', 'Pastki menyudagi “+ E’lon” tugmasini bosing: rasm qo‘shasiz, nomi va narxini yozasiz, ko‘rib chiqib “E’lon qilish”ni bosasiz. Birinchi e’londa biznes ma’lumotlari bir marta so‘raladi.'],
  ['Obuna qancha turadi?', 'Birinchi oy bepul, keyin oyiga 17 000 so‘m. Muddat tugasa, 3 kunlik muhlat beriladi, so‘ng e’lonlar qidiruvda yashiriladi. To‘lov qilganingizdan keyin darhol qaytadi.'],
  ['Narxni qanday yangilayman?', 'Biznes panelidagi “Narxlar hali to‘g‘rimi?” kartasida bir tugma bilan barcha narxlarni tasdiqlaysiz yoki o‘zgarganlarini yozasiz. Tasdiqlangan narx xaridorga “Narx bugun tasdiqlangan” belgisi bilan ko‘rinadi.'],
  ['Band qilish qanday ishlaydi?', 'Xizmat sahifasida “Band qilish”ni bosing, sana va vaqtni tanlang. Sotuvchi tasdiqlagach, bildirishnoma keladi. To‘lov joyida qilinadi.'],
  ['Noto‘g‘ri e’lon ko‘rsam-chi?', 'E’lon sahifasining pastidagi “Shikoyat qilish”ni bosing. Ma’muriyat tekshiradi.'],
]

export default function HelpPage() {
  return (
    <StaticPage title="Yordam">
      {QA.map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <h2>Savolingiz qoldimi?</h2>
      <p>
        Telegram botimizga yozing yoki <Link href="/xabarlar" className="link">xabarlar</Link> bo‘limidan sotuvchiga murojaat qiling.
      </p>
    </StaticPage>
  )
}
