import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // PGlite faqat lokal ishlab chiqish uchun (DATABASE_URL bo‘lmaganda).
  serverExternalPackages: ['@electric-sql/pglite'],
  outputFileTracingExcludes: {
    '/*': ['./node_modules/@electric-sql/**/*', './.data/**/*'],
  },
  // Telegram, WhatsApp va boshqa botlar havola oldindan ko‘rinishini to‘liq olishi uchun.
  htmlLimitedBots:
    /TelegramBot|Twitterbot|facebookexternalhit|facebookcatalog|WhatsApp|Slackbot|Discordbot|LinkedInBot|Googlebot|Google-InspectionTool|bingbot|YandexBot|YandexImages|vkShare|SkypeUriPreview|Applebot/i,
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=()' },
        ],
      },
    ]
  },
}

export default nextConfig
