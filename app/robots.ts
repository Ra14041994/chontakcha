import type { MetadataRoute } from 'next'
import { appUrl } from '@/lib/url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/biznes', '/profil', '/xabarlar', '/kirish'] }],
    host: appUrl(),
  }
}
