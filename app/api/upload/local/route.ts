import { getUser } from '@/lib/session'
import { newId } from '@/lib/ids'

export const dynamic = 'force-dynamic'

/** Faqat lokal ishlab chiqish: Vercel Blob bo‘lmaganda rasmlar .data/uploads ga yoziladi. */
export async function POST(req: Request) {
  if (process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: 'disabled' }, { status: 404 })
  const u = await getUser()
  if (!u) return Response.json({ error: 'Avval kiring' }, { status: 401 })
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof Blob)) return Response.json({ error: 'Fayl yo‘q' }, { status: 400 })
  if (file.size > 6 * 1024 * 1024) return Response.json({ error: 'Fayl juda katta' }, { status: 400 })
  const type = file.type || 'image/jpeg'
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return Response.json({ error: 'Faqat rasm' }, { status: 400 })
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
  const name = `${newId(14)}.${ext}`
  const fs = await import('node:fs/promises')
  await fs.mkdir('.data/uploads', { recursive: true })
  await fs.writeFile(`.data/uploads/${name}`, Buffer.from(await file.arrayBuffer()))
  return Response.json({ url: `/api/files/${name}` })
}
