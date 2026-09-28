import { get } from '@vercel/blob'
import { blobAuth } from '@/lib/blob'

export const dynamic = 'force-dynamic'

/** “Private” Blob omboridagi rasmlarni sayt orqali beradi (ombor public bo‘lsa ishlatilmaydi). */
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathname = path.join('/')
  if (!/^(l|b|r)\/[\w.-]+\.(jpg|png|webp)$/i.test(pathname)) return new Response('not found', { status: 404 })
  try {
    const r = await get(pathname, { access: 'private', ...blobAuth() })
    if (!r || r.statusCode !== 200) return new Response('not found', { status: 404 })
    return new Response(r.stream, {
      headers: { 'content-type': r.blob.contentType || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return new Response('not found', { status: 404 })
  }
}
