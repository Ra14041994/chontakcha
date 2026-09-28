export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  if (process.env.VERCEL) return new Response('not found', { status: 404 })
  const { name } = await params
  if (!/^[a-z0-9]+\.(jpg|png|webp)$/.test(name)) return new Response('not found', { status: 404 })
  try {
    const fs = await import('node:fs/promises')
    const buf = await fs.readFile(`.data/uploads/${name}`)
    const type = name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
    return new Response(new Uint8Array(buf), { headers: { 'content-type': type, 'cache-control': 'public, max-age=31536000, immutable' } })
  } catch {
    return new Response('not found', { status: 404 })
  }
}
