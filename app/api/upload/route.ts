import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const u = await getUser()
  if (!u) return Response.json({ error: 'Avval kiring' }, { status: 401 })
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: 'Rasm ombori ulanmagan (BLOB_READ_WRITE_TOKEN)' }, { status: 500 })
  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return Response.json({ error: 'bad request' }, { status: 400 })
  }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^(l|b|r)\/[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(pathname)) throw new Error('Noto‘g‘ri fayl nomi')
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 6 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ u: u.id }),
        }
      },
    })
    return Response.json(result)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Yuklashda xato' }, { status: 400 })
  }
}
