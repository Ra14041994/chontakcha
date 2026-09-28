'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { submitReview } from '@/app/_actions/buyer'
import { REVIEW_TAGS } from '@/lib/categories'
import { Icon, Star } from '../Icon'
import { toast } from './Toaster'
import { uploadImage } from './upload'

const WORDS = ['', 'Yomon', 'Qoniqarsiz', 'O‘rtacha', 'Yaxshi', 'A’lo']

export function ReviewForm({ listings, initialListing, bookingId, blobEnabled, userName, initial }: { listings: { id: string; title: string }[]; initialListing: string; bookingId?: string; blobEnabled: boolean; userName: string; initial?: { rating: number; tags: string[]; body: string } | null }) {
  const [lid, setLid] = useState(initialListing)
  const [rating, setRating] = useState(initial?.rating || 0)
  const [tags, setTags] = useState<string[]>(initial?.tags || [])
  const [body, setBody] = useState(initial?.body || '')
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <div>
      {listings.length > 1 && (
        <>
          <label className="label" style={{ marginTop: 0 }}>
            Nima uchun baho?
          </label>
          <select className="select mb16" value={lid} onChange={(e) => setLid(e.target.value)}>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </>
      )}
      <div className="card tc">
        <h3>Tajribangiz qanday bo‘ldi?</h3>
        <div className="flex center gap10 mt12" style={{ justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} yulduz`} style={{ border: 0, background: 'none', padding: 2 }}>
              <Star on={i <= rating} size={40} />
            </button>
          ))}
        </div>
        <div className="link mt8" style={{ minHeight: 22 }}>
          {WORDS[rating]}
        </div>
      </div>
      <h3 className="mt20">Nima yoqdi?</h3>
      <div className="chips wrap mt10">
        {REVIEW_TAGS.map((t) => (
          <button key={t} type="button" className={`chip${tags.includes(t) ? ' on' : ''}`} onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}>
            {tags.includes(t) && <Icon name="check" size={16} />} {t}
          </button>
        ))}
      </div>
      <label className="label">
        Izoh <span className="opt">· ixtiyoriy</span>
      </label>
      <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} placeholder="Nima yoqdi yoki yoqmadi?" />
      <div className="counter">{body.length}/1000</div>
      <h3 className="mt12">Rasm</h3>
      <div className="flex gap10 mt10">
        {photo && (
          <div className="photo" style={{ width: 84 }}>
            <img src={photo} alt="" />
            <button type="button" className="rm" onClick={() => setPhoto(null)} aria-label="O‘chirish">
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
        {!photo && (
          <label className="addph" style={{ width: 84, cursor: 'pointer' }}>
            {busy ? <span className="spinner" /> : <><Icon name="camera" /> Rasm</>}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                setBusy(true)
                try {
                  setPhoto(await uploadImage(f, 'r', blobEnabled, 1024))
                } catch (x) {
                  toast(x instanceof Error ? x.message : 'Yuklanmadi')
                } finally {
                  setBusy(false)
                }
              }}
            />
          </label>
        )}
      </div>
      <p className="small muted mt12">
        Izohingiz “{userName}” nomi bilan chiqadi. Sotuvchi unga javob yozishi mumkin.
      </p>
      <div className="actionbar" style={{ position: 'sticky', bottom: 0, margin: '20px -16px 0' }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!rating || pending}
          onClick={() =>
            start(async () => {
              const r = await submitReview({ listingId: lid, bookingId: bookingId || null, rating, tags, body, photo })
              if (r.ok) {
                toast('Rahmat! Bahoyingiz qabul qilindi')
                router.push(`/e/${lid}#izohlar`)
              } else toast(r.error || 'Xatolik')
            })
          }
        >
          {pending ? <span className="spinner white" /> : null} Yuborish
        </button>
      </div>
    </div>
  )
}
