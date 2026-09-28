import type { Metadata } from 'next'
import { StaticPage } from '@/components/StaticPage'

export const metadata: Metadata = { title: 'Maxfiylik siyosati' }

export default function PrivacyPage() {
  return (
    <StaticPage title="Maxfiylik siyosati">
      <p>Cho‘ntakcha faqat xizmat ishlashi uchun zarur ma’lumotlarni saqlaydi.</p>
      <h2>Qanday ma’lumot saqlanadi</h2>
      <ul>
        <li>Telefon raqamingiz va ismingiz — Telegram orqali kirganingizda, siz ruxsat bergan holda.</li>
        <li>Saqlangan e’lonlar, kuzatilayotgan bizneslar, xabarlar, bandlar va izohlar.</li>
        <li>Tanlagan hududingiz. Joylashuvni aniqlashga ruxsat bersangiz — taxminiy koordinatalar faqat brauzeringizda (cookie) saqlanadi va masofani hisoblash uchun ishlatiladi.</li>
        <li>Sotuvchilar uchun: biznes ma’lumotlari, e’lonlar va rasmlar hamda anonim statistika (ko‘rishlar, qo‘ng‘iroq va yo‘nalish bosishlari soni).</li>
      </ul>
      <h2>Kim ko‘radi</h2>
      <p>Xaridorning telefon raqami sotuvchilarga avtomatik ko‘rsatilmaydi. Izohlarda ismingiz qisqartirilgan holda chiqadi (masalan, “Aziz R.”).</p>
      <p>Ma’lumotlaringiz uchinchi shaxslarga sotilmaydi va reklama uchun berilmaydi.</p>
      <h2>O‘chirish</h2>
      <p>Profil → Sozlamalar → “Akkauntni o‘chirish” orqali ma’lumotlaringizni istalgan vaqt o‘chirishingiz mumkin.</p>
    </StaticPage>
  )
}
