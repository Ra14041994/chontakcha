import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cho‘ntakcha — yaqin atrofdagi narxlar',
    short_name: 'Cho‘ntakcha',
    description: 'Yaqin do‘konlar narxlarini solishtiring.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F3F6FF',
    theme_color: '#376ACA',
    lang: 'uz',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
