import { one } from '@/lib/db'
import { VISIBLE } from '@/lib/listings'
import { normText, tokens } from '@/lib/text'

export const dynamic = 'force-dynamic'

/** Yangi e’lon yozilayotganda: yaqin atrofdagi o‘xshash e’lonlar narx oralig‘i. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const title = String(sp.get('t') || '').slice(0, 80)
  const unit = String(sp.get('u') || 'so‘m')
  const cat = String(sp.get('k') || '')
  const exclude = String(sp.get('x') || '')
  const norm = normText(title)
  if (norm.length < 3) return Response.json({ n: 0 })
  let r = await one<{ n: number; min: number; max: number }>(
    `select count(*)::int as n, min(l.price) as min, max(l.price) as max from listings l join businesses b on b.id = l.business_id
     where ${VISIBLE} and l.norm_title = $1 and l.unit = $2 and l.id <> $3`,
    [norm, unit, exclude],
  )
  if (!r || r.n < 1) {
    const toks = tokens(title).filter((t) => t.length >= 3).slice(0, 3)
    if (toks.length && cat) {
      const params: unknown[] = [unit, cat, exclude]
      const conds = toks.map((t) => {
        params.push('%' + t + '%')
        return `l.norm_title like $${params.length}`
      })
      r = await one<{ n: number; min: number; max: number }>(
        `select count(*)::int as n, min(l.price) as min, max(l.price) as max from listings l join businesses b on b.id = l.business_id
         where ${VISIBLE} and l.unit = $1 and l.category = $2 and l.id <> $3 and ${conds.join(' and ')}`,
        params,
      )
    }
  }
  return Response.json({ n: r?.n || 0, min: r?.min || 0, max: r?.max || 0 })
}
