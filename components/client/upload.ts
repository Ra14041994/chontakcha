'use client'

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
}

/** Rasmni kichraytirish (eng uzun tomoni `max` px) va JPEG ga o‘tkazish. */
export async function compressImage(file: File, max = 1280, quality = 0.82): Promise<Blob> {
  let src: ImageBitmap | HTMLImageElement
  try {
    src = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    src = await loadImage(file)
  }
  const w = 'naturalWidth' in src ? src.naturalWidth : src.width
  const h = 'naturalHeight' in src ? src.naturalHeight : src.height
  if (!w || !h) throw new Error('Rasmni o‘qib bo‘lmadi')
  const scale = Math.min(1, max / Math.max(w, h))
  const cw = Math.max(1, Math.round(w * scale))
  const ch = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas yo‘q')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, cw, ch)
  ctx.drawImage(src as CanvasImageSource, 0, 0, cw, ch)
  if ('close' in src && typeof src.close === 'function') src.close()
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality))
  if (!blob) throw new Error('Rasmni saqlab bo‘lmadi')
  return blob
}

/**
 * Rasmni yuklash: brauzerda kichraytiriladi (JPEG), keyin serverga yuboriladi —
 * server uni Vercel Blob’ga (productionda) yoki lokal papkaga yozadi. URL qaytaradi.
 */
export async function uploadImage(file: File, prefix: 'l' | 'b' | 'r', max = 1280): Promise<string> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif|jpe?g|png|webp)$/i.test(file.name)) throw new Error('Faqat rasm yuklash mumkin')
  if (file.size > 30 * 1024 * 1024) throw new Error('Rasm juda katta (30 MB dan oshmasin)')
  let blob: Blob
  try {
    blob = await compressImage(file, max)
  } catch {
    throw new Error('Bu rasmni o‘qib bo‘lmadi. Boshqa rasm tanlang (JPG yoki PNG).')
  }
  const fd = new FormData()
  fd.append('kind', prefix)
  fd.append('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
  let r: Response
  try {
    r = await fetch('/api/upload', { method: 'POST', body: fd })
  } catch {
    throw new Error('Internet aloqasini tekshirib, qayta urinib ko‘ring')
  }
  const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!r.ok || !j.url) throw new Error(j.error || 'Rasm yuklanmadi, qayta urinib ko‘ring')
  return j.url
}
