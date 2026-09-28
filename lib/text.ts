const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', қ: 'q',
  л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ў: 'o', ф: 'f', х: 'x', ҳ: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ь: '', ы: 'i', э: 'e', ю: 'yu', я: 'ya',
}

/** Qidiruv va guruhlash uchun normallashtirish: kichik harf, kirill→lotin, tutuq belgilarsiz. */
export function normText(s: string | null | undefined): string {
  let t = String(s || '').toLowerCase()
  t = t.replace(/[а-яёғқўҳ]/g, (ch) => CYR[ch] ?? ch)
  t = t.replace(/[‘’ʻʼ`´'"]/g, '')
  t = t.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
  // 128 gb → 128gb, 7 kg → 7kg
  t = t.replace(/(\d) (gb|tb|mb|kg|gr|g|l|ml|w|kw|mm|sm|cm|m|dona|soat|mah|hz)\b/g, '$1$2')
  return t
}

export function tokens(q: string | null | undefined): string[] {
  return normText(q).split(' ').filter((w) => w.length > 0).slice(0, 8)
}

export function searchBlob(parts: Array<string | null | undefined>): string {
  return ' ' + normText(parts.filter(Boolean).join(' ')) + ' '
}

/** O‘zbekcha yozuvda oddiy tutuqni chiroyli belgiga almashtirish: o'z → o‘z, ma'lumot → ma’lumot. */
export function prettyUz(s: string): string {
  return String(s || '')
    .replace(/([OoGg])['`ʻ‘’]/g, '$1‘')
    .replace(/(\p{L})['`ʼ](\p{L})/gu, '$1’$2')
}
