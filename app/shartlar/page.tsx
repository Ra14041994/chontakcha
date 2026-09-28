import type { Metadata } from 'next'
import { StaticPage } from '@/components/StaticPage'

export const metadata: Metadata = { title: 'Foydalanish shartlari' }

export default function TermsPage() {
  return (
    <StaticPage title="Foydalanish shartlari">
      <p>Cho‘ntakcha — xaridorlar va mahalliy sotuvchilarni bog‘laydigan e’lonlar platformasi. Savdo xaridor va sotuvchi o‘rtasida bevosita amalga oshiriladi.</p>
      <h2>Sotuvchilar uchun</h2>
      <ul>
        <li>E’londagi narx, rasm va ma’lumot haqiqiy bo‘lishi kerak. Narxlarni muntazam tasdiqlab turing.</li>
        <li>Taqiqlangan, soxta yoki boshqalarning huquqini buzadigan mahsulotlarni joylash mumkin emas.</li>
        <li>Obuna: birinchi oy bepul, keyin 17 000 so‘m/oy. Muddat tugagach 3 kunlik muhlat beriladi, so‘ng e’lonlar yashiriladi.</li>
      </ul>
      <h2>Xaridorlar uchun</h2>
      <ul>
        <li>Xarid qilishdan oldin mahsulotni ko‘zdan kechiring. Oldindan pul o‘tkazishda ehtiyot bo‘ling.</li>
        <li>Izohlar haqiqiy tajribaga asoslangan bo‘lsin. Haqoratli izohlar o‘chiriladi.</li>
      </ul>
      <h2>Ma’muriyat huquqi</h2>
      <p>Qoidalarni buzgan e’lon yoki hisoblar ogohlantirishsiz yashirilishi yoki bloklanishi mumkin.</p>
    </StaticPage>
  )
}
