import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { hasDatabase } from '@/lib/db'
import { appUrl } from '@/lib/url'
import { NavTracker } from '@/components/client/NavTracker'
import { Toaster } from '@/components/client/Toaster'

const manrope = localFont({
  src: './fonts/manrope-latin-wght-normal.woff2',
  weight: '200 800',
  style: 'normal',
  variable: '--font-manrope',
  display: 'swap',
  fallback: ['Segoe UI', 'system-ui', 'Roboto', 'Arial', 'sans-serif'],
})

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: 'Cho‘ntakcha — yaqin atrofdagi narxlar', template: '%s · Cho‘ntakcha' },
  description: 'Chortoq va Namangan bo‘ylab yaqin do‘konlar narxlarini bir joyda solishtiring: mahsulotlar, xizmatlar va bizneslar.',
  applicationName: 'Cho‘ntakcha',
  openGraph: {
    type: 'website',
    siteName: 'Cho‘ntakcha',
    locale: 'uz_UZ',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Cho‘ntakcha' }],
  },
  twitter: { card: 'summary_large_image' },
  appleWebApp: { capable: true, title: 'Cho‘ntakcha', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  icons: { apple: '/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#376ACA',
}

function SetupNotice() {
  return (
    <div className="setup">
      <img src="/brand/logo_word.webp" alt="Cho‘ntakcha" style={{ height: 28, width: 'auto' }} />
      <h2 className="mt20">Sayt deyarli tayyor</h2>
      <p className="mt8 muted">
        Ma’lumotlar bazasi hali ulanmagan. Vercel’da loyiha → <b>Storage</b> → <b>Neon (Postgres)</b> ni tanlab, bazani shu loyihaga ulang va
        qayta joylang (Redeploy).
      </p>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={manrope.variable}>
      <body>
        {hasDatabase() ? children : <SetupNotice />}
        <NavTracker />
        <Toaster />
      </body>
    </html>
  )
}
