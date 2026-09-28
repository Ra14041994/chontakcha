import { put } from '@vercel/blob'
import { one, q } from '@/lib/db'
import { getUser } from '@/lib/session'
import { newId } from '@/lib/ids'
import { tkDate } from '@/lib/format'
import { blobAuth, blobMode } from '@/lib/blob'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_BYTES = 4 * 1024 * 1024 // brauzer rasmni ~1280px JPEG’ga kichraytiradi (odatda 150–500 KB)
const PER_HOUR = 60

function fail(error: string, status = 400) {
  return Response.json({ error }, { status })
}

/**
 * Rasm yuklash (server orqali). Brauzer rasmni kichraytirib yuboradi, server uni
 * Vercel Blob’ga yozadi (OIDC yoki token). Lokal ishlab chiqishda — .data/uploads.
 */
export async function POST(req: Request) {
  const u = await getUser()
  if (!u) return fail('Rasm yuklash uchun avval kiring', 401)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail('Rasm topilmadi')
  }
  const file = form.get('file')
  const kind = String(form.get('kind') || 'l')
  if (!/^(l|b|r)$/.test(kind)) return fail('Noto‘g‘ri so‘rov')
  if (!(file instanceof File) || !file.size) return fail('Rasm topilmadi')
  if (file.size > MAX_BYTES) return fail('Rasm juda katta (4 MB dan oshmasin)')
  const ext = TYPES[file.type]
  if (!ext) return fail('Faqat JPG, PNG yoki WEBP rasm yuklash mumkin')

  const recent = await one<{ n: number }>(
    `select count(*)::int as n from events where type = 'upload' and user_id = $1 and created_at > now() - interval '1 hour'`,
    [u.id],
  )
  if ((recent?.n ?? 0) >= PER_HOUR) return fail('Juda ko‘p rasm yuklandi. Birozdan keyin urinib ko‘ring.', 429)

  const pathname = `${kind}/${newId(12)}.${ext}`
  const mode = blobMode()
  let url: string

  if (!mode) {
    if (process.env.VERCEL) {
      return fail('Rasm ombori ulanmagan. Administrator: Vercel → Storage → Blob omborini shu loyihaga ulab, Redeploy qilsin.', 503)
    }
    const fs = await import('node:fs/promises')
    const name = pathname.replace('/', '-')
    await fs.mkdir('.data/uploads', { recursive: true })
    await fs.writeFile(`.data/uploads/${name}`, Buffer.from(await file.arrayBuffer()))
    url = `/api/files/${name}`
  } else {
    const opts = { addRandomSuffix: true, contentType: file.type, cacheControlMaxAge: 31536000, ...blobAuth() }
    try {
      url = (await put(pathname, file, { access: 'public', ...opts })).url
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!/private/i.test(msg)) {
        console.error('[upload] blob put failed:', msg)
        return fail(`Rasm saqlanmadi (${msg.replace(/^Vercel Blob:\s*/, '').slice(0, 160)})`, 502)
      }
      // Ombor “private” qilib yaratilgan bo‘lsa — rasm sayt orqali beriladi.
      try {
        const r = await put(pathname, file, { access: 'private', ...opts })
        url = `/api/files/b/${r.pathname}`
      } catch (e2) {
        const m2 = e2 instanceof Error ? e2.message : String(e2)
        console.error('[upload] private put failed:', m2)
        return fail(`Rasm saqlanmadi (${m2.replace(/^Vercel Blob:\s*/, '').slice(0, 160)})`, 502)
      }
    }
  }

  await q(`insert into events (business_id, listing_id, type, user_id, day) values ('', null, 'upload', $1, $2)`, [u.id, tkDate()]).catch(() => {})
  return Response.json({ url })
}
