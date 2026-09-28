import type { Metadata } from 'next'
import Link from 'next/link'
import { StaticPage } from '@/components/StaticPage'

export const metadata: Metadata = { title: 'Ilova haqida' }

export default function AboutPage() {
  return (
    <StaticPage title="Ilova haqida">
      <img src="/brand/logo_word.webp" alt="Cho‘ntakcha" style={{ height: 30, width: 'auto' }} />
      <p className="mt16">
        <b>Cho‘ntakcha</b> — har doim cho‘ntagingizda foyda. Yaqin atrofdagi do‘konlar narxlarini solishtiring, eng arzon va eng yaqin taklifni toping,
        sotuvchi bilan to‘g‘ridan-to‘g‘ri yozishing.
      </p>
      <p>Versiya 1.0 · Beta. Hozircha Chortoq, Namangan, Uychi va Uchqo‘rg‘on hududlarida.</p>
      <h2>Biznesingiz bormi?</h2>
      <p>
        Mahsulot va xizmatlaringizni joylang — birinchi oy bepul. <Link href="/biznes/elon/yangi" className="link">E’lon berish</Link>
      </p>
      <p className="small muted mt16">Xarita ma’lumotlari: © OpenStreetMap hissadorlari.</p>
    </StaticPage>
  )
}
