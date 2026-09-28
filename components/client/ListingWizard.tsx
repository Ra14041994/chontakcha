'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { saveListing } from '@/app/_actions/seller'
import { BUSINESS_TYPES, CATEGORIES, MAX_PHOTOS, SUB_PRICE, UNITS } from '@/lib/categories'
import { AREAS } from '@/lib/geo'
import { addDays, dayLong, money, tkDate } from '@/lib/format'
import { EMPTY_LISTING, type BusinessInput, type ListingInput } from '@/lib/seller-types'
import { Icon } from '../Icon'
import { MapView } from './MapView'
import { toast } from './Toaster'
import { uploadImage } from './upload'
import { BackButton } from './BackButton'

type BizInfo = { name: string; address: string; phone: string | null; delivery: boolean; delivery_fee: number | null; delivery_eta: string | null; delivery_area: string | null } | null

const DRAFT_KEY = 'ch_wizard_v1'
const DAY_NAMES = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

function emptyBiz(area: string, phone: string | null): BusinessInput {
  const a = AREAS.find((x) => x.id === area) || AREAS[0]
  return {
    name: '',
    category: BUSINESS_TYPES[0],
    phone: phone ? phone.replace(/^\+998/, '') : '',
    address: '',
    lat: a.lat,
    lng: a.lng,
    area: a.id,
    open_time: '09:00',
    close_time: '21:00',
    days: '1234567',
    about: '',
    logo_url: null,
    delivery: false,
    delivery_fee: null,
    delivery_eta: '',
    delivery_area: '',
  }
}

function PhotoPicker({ photos, setPhotos }: { photos: string[]; setPhotos: (fn: (p: string[]) => string[]) => void }) {
  const [busy, setBusy] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const cam = useRef<HTMLInputElement>(null)
  const gal = useRef<HTMLInputElement>(null)
  const add = async (files: FileList | null) => {
    if (!files?.length) return
    setErr(null)
    const room = MAX_PHOTOS - photos.length
    const list = Array.from(files).slice(0, Math.max(0, room))
    if (files.length > room) toast(`Ko‘pi bilan ${MAX_PHOTOS} ta rasm`)
    setBusy((n) => n + list.length)
    await Promise.all(
      list.map(async (f) => {
        try {
          const url = await uploadImage(f, 'l')
          setPhotos((p) => (p.length < MAX_PHOTOS ? [...p, url] : p))
        } catch (e) {
          setErr(e instanceof Error ? e.message : 'Rasm yuklanmadi')
        } finally {
          setBusy((n) => n - 1)
        }
      }),
    )
  }
  const move = (i: number, d: number) =>
    setPhotos((p) => {
      const j = i + d
      if (j < 0 || j >= p.length) return p
      const c = [...p]
      ;[c[i], c[j]] = [c[j], c[i]]
      return c
    })
  return (
    <>
      <div className="btns mt16">
        <button type="button" className="btn btn-soft" onClick={() => cam.current?.click()} disabled={photos.length >= MAX_PHOTOS}>
          <Icon name="camera" /> Suratga olish
        </button>
        <button type="button" className="btn btn-soft" onClick={() => gal.current?.click()} disabled={photos.length >= MAX_PHOTOS}>
          <Icon name="image" /> Galereyadan
        </button>
      </div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => (add(e.target.files), (e.target.value = ''))} />
      <input ref={gal} type="file" accept="image/*" multiple hidden onChange={(e) => (add(e.target.files), (e.target.value = ''))} />
      <div className="photos mt16">
        {photos.map((p, i) => (
          <div key={p} className="photo">
            <img src={p} alt="" />
            {i === 0 && (
              <span className="main tag dark" style={{ height: 22, fontSize: 11 }}>
                Asosiy
              </span>
            )}
            <button type="button" className="rm" aria-label="O‘chirish" onClick={() => setPhotos((x) => x.filter((y) => y !== p))}>
              <Icon name="x" size={16} />
            </button>
            {photos.length > 1 && (
              <span className="mv">
                {i > 0 && (
                  <button type="button" aria-label="Chapga" onClick={() => move(i, -1)}>
                    <Icon name="back" size={16} />
                  </button>
                )}
                {i < photos.length - 1 && (
                  <button type="button" aria-label="O‘ngga" onClick={() => move(i, 1)}>
                    <Icon name="chev" size={16} />
                  </button>
                )}
              </span>
            )}
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <div key={'b' + i} className="photo">
            <div className="busy">
              <span className="spinner" />
            </div>
          </div>
        ))}
        {photos.length + busy < MAX_PHOTOS &&
          Array.from({ length: Math.min(2, MAX_PHOTOS - photos.length - busy) }).map((_, i) => (
            <button key={'a' + i} type="button" className="addph" onClick={() => gal.current?.click()}>
              <Icon name="plus" />
              <span>{photos.length + busy + i + 1}-rasm</span>
            </button>
          ))}
      </div>
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}
    </>
  )
}

function Switch({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label className="flex center between gap12" style={{ cursor: 'pointer' }}>
      <span>
        <b style={{ display: 'block', fontSize: 15.5 }}>{label}</b>
        {sub && <span className="small muted">{sub}</span>}
      </span>
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span />
      </span>
    </label>
  )
}

function PreviewCard({ d, biz }: { d: ListingInput; biz: { name: string; address: string } | null }) {
  return (
    <div className="card">
      <div className="gallery" style={{ border: 0 }}>
        {d.photos[0] ? (
          <img src={d.photos[0]} alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 16 }} />
        ) : (
          <div style={{ aspectRatio: '1/1', display: 'grid', placeItems: 'center', background: 'var(--grey)', borderRadius: 16 }}>
            <Icon name="image" size={32} />
          </div>
        )}
        {d.photos.length > 0 && <span className="cnt tag dark">1 / {d.photos.length}</span>}
      </div>
      <div className="bigprice" style={{ fontSize: 26 }}>
        {d.price ? money(d.price) : '—'}
        <small>{d.unit}</small>
      </div>
      <div className="b mt4" style={{ fontSize: 17 }}>
        {d.title || 'Nomi'}
      </div>
      <div className="flex gap6 wrap mt8">
        {d.kind === 'product' && <span className="tag blue">{d.condition === 'used' ? 'Ishlatilgan' : 'Yangi'}</span>}
        <span className={`tag ${d.available ? 'green' : ''}`}>
          <span className={`dot${d.available ? '' : ' grey'}`} /> {d.available ? 'Mavjud' : 'Tugagan'}
        </span>
        {d.delivery && (
          <span className="tag">
            <Icon name="truck" /> Yetkaziladi
          </span>
        )}
        {d.booking && (
          <span className="tag blue">
            <Icon name="cal" /> Band qilish
          </span>
        )}
      </div>
      <div className="small green b mt8 flex center gap4">
        <Icon name="checkc" size={16} /> Narx bugun tasdiqlangan
      </div>
      {biz && (
        <div className="small muted mt8">
          <b style={{ color: 'var(--ink)' }}>{biz.name}</b> · {biz.address}
        </div>
      )}
    </div>
  )
}

export function ListingWizard({
  initial,
  business,
  userPhone,
  areaId,
  editing,
}: {
  initial: ListingInput
  business: BizInfo
  userPhone: string | null
  areaId: string
  editing: boolean
}) {
  const router = useRouter()
  const hasBiz = Boolean(business)
  const total = hasBiz ? 4 : 6
  const [step, setStep] = useState(1)
  const [d, setD] = useState<ListingInput>(initial)
  const [biz, setBiz] = useState<BusinessInput>(() => emptyBiz(areaId, userPhone))
  const [saving, setSaving] = useState<null | 'publish' | 'draft'>(null)
  const [err, setErr] = useState<{ msg: string; field?: string } | null>(null)
  const [restored, setRestored] = useState(false)
  const [similar, setSimilar] = useState<{ n: number; min: number; max: number } | null>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const set = (p: Partial<ListingInput>) => setD((x) => ({ ...x, ...p }))
  const setB = (p: Partial<BusinessInput>) => setBiz((x) => ({ ...x, ...p }))

  // Qoralamani shu qurilmada saqlash (faqat yangi e’lon uchun)
  useEffect(() => {
    if (editing) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const j = JSON.parse(raw) as { d?: ListingInput; biz?: BusinessInput; t?: number }
        if (j.d && Date.now() - (j.t || 0) < 7 * 86400000 && (j.d.title || j.d.photos?.length)) {
          setD({ ...EMPTY_LISTING, ...j.d })
          if (j.biz) setBiz((b) => ({ ...b, ...j.biz }))
          setRestored(true)
        }
      }
    } catch {}
  }, [editing])
  useEffect(() => {
    if (editing) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ d, biz, t: Date.now() }))
      } catch {}
    }, 400)
    return () => clearTimeout(t)
  }, [d, biz, editing])

  useEffect(() => {
    const title = d.title.trim()
    if (title.length < 3) {
      setSimilar(null)
      return
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/similar?t=${encodeURIComponent(title)}&u=${encodeURIComponent(d.unit)}&k=${encodeURIComponent(d.category)}${d.id ? '&x=' + d.id : ''}`)
        const j = (await r.json()) as { n: number; min: number; max: number }
        setSimilar(j.n > 0 ? j : null)
      } catch {}
    }, 500)
    return () => clearTimeout(t)
  }, [d.title, d.unit, d.category, d.id])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const cats = useMemo(() => CATEGORIES.filter((c) => c.kinds.includes(d.kind)), [d.kind])
  const stepOk = (s: number): string | null => {
    if (s === 1 && !d.photos.length) return 'Kamida bitta rasm qo‘shing'
    if (s === 2) {
      if (d.title.trim().length < 3) return 'Nomini yozing'
      if (!d.category) return 'Kategoriyani tanlang'
      if (!d.price) return 'Narxni yozing'
    }
    if (s === 5) {
      if (biz.name.trim().length < 2) return 'Biznes nomini yozing'
      if (biz.address.trim().length < 3) return 'Manzilni yozing'
      if (biz.phone && biz.phone.replace(/\D/g, '').length < 9) return 'Telefon raqami to‘liq emas'
    }
    return null
  }
  const next = () => {
    const e = stepOk(step)
    if (e) {
      setErr({ msg: e })
      toast(e)
      return
    }
    setErr(null)
    setStep((s) => Math.min(total, s + 1))
  }

  const submit = async (publish: boolean) => {
    setErr(null)
    setSaving(publish ? 'publish' : 'draft')
    const bizInput = hasBiz ? null : { ...biz, phone: biz.phone ? '+998' + biz.phone.replace(/\D/g, '').slice(-9) : '' }
    try {
      const r = await saveListing(d, bizInput, publish)
      if (!r.ok) {
        setErr({ msg: r.error, field: r.field })
        toast(r.error)
        if (r.field === 'photos') setStep(1)
        else if (['title', 'category', 'price'].includes(r.field || '')) setStep(2)
        else if (['name', 'address', 'phone', 'biz'].includes(r.field || '')) setStep(5)
        return
      }
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {}
      if (!publish) {
        toast('Qoralama saqlandi')
        router.push('/biznes/elonlar?tab=qoralama')
      } else if (editing) {
        toast('E’lon yangilandi')
        router.push(`/e/${r.id}`)
      } else {
        router.push(`/biznes/tayyor/${r.id}${r.newBusiness ? '?yangi=1' : ''}`)
      }
      router.refresh()
    } catch {
      toast('Tarmoq xatosi. Qayta urinib ko‘ring.')
    } finally {
      setSaving(null)
    }
  }

  const stepTitle = ['', 'Rasmlar', 'Ma’lumot', 'Sotuv shartlari', 'Ko‘rib chiqish', 'Biznes ma’lumotlari', 'Cho‘ntakcha Business'][step]
  const listingSteps = 3
  const progressStep = Math.min(step, listingSteps)
  const today = tkDate()

  const footer = (
    <div className="actionbar" style={{ position: 'sticky', bottom: 0, margin: '24px -16px 0', borderRadius: 0 }}>
      {step > 1 && (
        <button type="button" className="btn btn-outline" onClick={() => setStep((s) => s - 1)} style={{ flex: '0 0 auto', padding: '0 22px' }}>
          Orqaga
        </button>
      )}
      {step < 4 && (
        <button type="button" className="btn btn-primary" onClick={next}>
          {step === 3 ? 'Ko‘rib chiqish' : 'Davom etish'}
        </button>
      )}
      {step === 4 &&
        (hasBiz ? (
          <button type="button" className="btn btn-primary" onClick={() => submit(true)} disabled={Boolean(saving)}>
            {saving === 'publish' ? <span className="spinner white" /> : null} {editing ? 'Saqlash' : 'E’lon qilish'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={next}>
            E’lon qilish
          </button>
        ))}
      {step === 5 && (
        <button type="button" className="btn btn-primary" onClick={next}>
          Davom etish
        </button>
      )}
      {step === 6 && (
        <button type="button" className="btn btn-primary" onClick={() => submit(true)} disabled={Boolean(saving)}>
          {saving === 'publish' ? <span className="spinner white" /> : null} Bepul boshlash
        </button>
      )}
    </div>
  )

  return (
    <div className="wiz">
      <div className="wiz-top">
        <BackButton fallback={hasBiz ? '/biznes/elonlar' : '/'} icon="x" className="cbtn white round only-d" />
        <div className="grow">
          <h1 style={{ fontSize: 24 }}>{editing ? 'E’lonni tahrirlash' : step <= 4 ? 'Yangi e’lon' : stepTitle}</h1>
          <div className="small muted">
            {step <= 3 ? `${step}/3 · ${stepTitle}` : step === 4 ? 'Xaridorlar e’loningizni shunday ko‘radi' : step === 5 ? 'Bir marta kiritiladi' : 'Birinchi oy bepul'}
          </div>
        </div>
        {step === 4 && (
          <button type="button" className="linkbtn" onClick={() => setStep(2)}>
            Tahrirlash
          </button>
        )}
      </div>
      {step <= 3 && (
        <div className="progress" style={{ marginTop: 12 }}>
          {[1, 2, 3].map((i) => (
            <i key={i} className={i <= progressStep ? 'on' : ''} style={{ background: i <= progressStep ? 'var(--g)' : 'var(--line)' }} />
          ))}
        </div>
      )}
      {restored && step === 1 && (
        <div className="note tint mt12">
          <Icon name="history" />
          <div className="grow">
            Qoralama tiklandi.{' '}
            <button
              type="button"
              className="linkbtn"
              onClick={() => {
                setD(initial)
                setRestored(false)
                try {
                  localStorage.removeItem(DRAFT_KEY)
                } catch {}
              }}
            >
              Yangidan boshlash
            </button>
          </div>
        </div>
      )}

      <div className="wiz-desk mt16">
        <div>
          {step === 1 && (
            <div>
              <div className="seg">
                <button type="button" className={d.kind === 'product' ? 'on' : ''} onClick={() => set({ kind: 'product', booking: false, category: CATEGORIES.find((c) => c.id === d.category)?.kinds.includes('product') ? d.category : '' })}>
                  <Icon name="box" size={18} /> Mahsulot
                </button>
                <button type="button" className={d.kind === 'service' ? 'on' : ''} onClick={() => set({ kind: 'service', delivery: false, condition: null, category: CATEGORIES.find((c) => c.id === d.category)?.kinds.includes('service') ? d.category : '' })}>
                  <Icon name="wrench" size={18} /> Xizmat
                </button>
              </div>
              <h2 className="mt20">Rasmlarni qo‘shing</h2>
              <p className="muted mt4">Birinchi rasm — asosiy. {MAX_PHOTOS} tagacha. Rasm avtomatik kichraytiriladi.</p>
              <PhotoPicker photos={d.photos} setPhotos={(fn) => setD((x) => ({ ...x, photos: fn(x.photos) }))} />
              <div className="card mt16">
                <b>Yaxshi rasm uchun</b>
                <div className="checklist mt10">
                  {['Yorug‘ joyda suratga oling', 'Mahsulot to‘liq ko‘rinsin', 'Fon oddiy va toza bo‘lsin'].map((t) => (
                    <div key={t}>
                      <span className="ok">
                        <Icon name="check" />
                      </span>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="label" style={{ marginTop: 0 }}>
                Nomi
              </label>
              <input className="input" value={d.title} onChange={(e) => set({ title: e.target.value })} maxLength={80} placeholder={d.kind === 'product' ? 'Masalan: Kir yuvish mashinasi · 7 kg' : 'Masalan: Santexnik xizmati'} />
              <p className="hint">Xaridor qidiradigan so‘zlar bilan yozing</p>
              <label className="label">Kategoriya</label>
              <select className="select" value={d.category} onChange={(e) => set({ category: e.target.value })}>
                <option value="">Tanlang</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {d.kind === 'product' && (
                <>
                  <label className="label">Holati</label>
                  <div className="chips">
                    <button type="button" className={`chip${d.condition !== 'used' ? ' on' : ''}`} onClick={() => set({ condition: 'new' })}>
                      {d.condition !== 'used' && <Icon name="check" size={16} />} Yangi
                    </button>
                    <button type="button" className={`chip${d.condition === 'used' ? ' on' : ''}`} onClick={() => set({ condition: 'used' })}>
                      {d.condition === 'used' && <Icon name="check" size={16} />} Ishlatilgan
                    </button>
                  </div>
                </>
              )}
              <div className="field-row" style={{ alignItems: 'flex-end' }}>
                <div style={{ flex: 1.4 }}>
                  <label className="label">Narx</label>
                  <input className="input" inputMode="numeric" value={d.price ? money(d.price) : ''} onChange={(e) => set({ price: Number(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" />
                </div>
                <div>
                  <label className="label">Birlik</label>
                  <select className="select" value={d.unit} onChange={(e) => set({ unit: e.target.value })}>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {similar && (
                <div className="note tint mt12">
                  <Icon name="chart" />
                  <div>
                    <b>
                      Yaqin atrofda: {money(similar.min)}
                      {similar.max !== similar.min ? ` – ${money(similar.max)}` : ''} so‘m
                    </b>
                    <div className="small muted">{similar.n} ta do‘konda o‘xshash e’lon bor</div>
                  </div>
                </div>
              )}
              <label className="label">
                Tavsif <span className="opt">· ixtiyoriy</span>
              </label>
              <textarea className="textarea" value={d.description} onChange={(e) => set({ description: e.target.value })} maxLength={1500} placeholder="Holati, kafolat, rangi, o‘lchami…" />
              <label className="label">
                Xususiyatlar <span className="opt">· ixtiyoriy</span>
              </label>
              {d.specs.map((s, i) => (
                <div key={i} className="field-row mb8">
                  <input className="input" value={s.k} placeholder="Masalan: Rangi" maxLength={30} onChange={(e) => set({ specs: d.specs.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)) })} />
                  <input className="input" value={s.v} placeholder="Oq" maxLength={60} onChange={(e) => set({ specs: d.specs.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)) })} />
                  <button type="button" className="btn btn-outline btn-icon" style={{ flex: '0 0 52px' }} aria-label="O‘chirish" onClick={() => set({ specs: d.specs.filter((_, j) => j !== i) })}>
                    <Icon name="trash" />
                  </button>
                </div>
              ))}
              {d.specs.length < 10 && (
                <button type="button" className="btn btn-soft btn-sm" onClick={() => set({ specs: [...d.specs, { k: '', v: '' }] })}>
                  <Icon name="plus" size={18} /> Xususiyat qo‘shish
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="gridauto">
              <div className="card">
                <Switch checked={d.available} onChange={(v) => set({ available: v })} label={d.kind === 'product' ? 'Sotuvda bor' : 'Hozir xizmat ko‘rsatamiz'} sub="O‘chirsangiz, e’lon “Tugagan” bo‘ladi" />
              </div>
              {d.kind === 'product' ? (
                <div className="card">
                  <Switch checked={d.delivery} onChange={(v) => set({ delivery: v, delivery_fee: v ? d.delivery_fee ?? business?.delivery_fee ?? 0 : d.delivery_fee, delivery_eta: d.delivery_eta || business?.delivery_eta || '', delivery_area: d.delivery_area || business?.delivery_area || '' })} label="Yetkazib berish" sub="Do‘koningiz o‘zi olib boradi" />
                  {d.delivery && (
                    <>
                      <div className="field-row mt12">
                        <div>
                          <label className="label" style={{ marginTop: 0 }}>
                            Narxi, so‘m
                          </label>
                          <input className="input" inputMode="numeric" value={d.delivery_fee ? money(d.delivery_fee) : d.delivery_fee === 0 ? '0' : ''} onChange={(e) => set({ delivery_fee: Number(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" />
                        </div>
                        <div>
                          <label className="label" style={{ marginTop: 0 }}>
                            Vaqti
                          </label>
                          <input className="input" value={d.delivery_eta} onChange={(e) => set({ delivery_eta: e.target.value })} placeholder="1 kun ichida" maxLength={40} />
                        </div>
                      </div>
                      <p className="hint">0 — bepul</p>
                      <label className="label">Hudud</label>
                      <input className="input" value={d.delivery_area} onChange={(e) => set({ delivery_area: e.target.value })} placeholder="Chortoq tumani" maxLength={60} />
                    </>
                  )}
                </div>
              ) : (
                <div className="card">
                  <Switch checked={d.booking} onChange={(v) => set({ booking: v })} label="Band qilish" sub="Xaridor sana va vaqtni tanlab so‘rov yuboradi, siz tasdiqlaysiz" />
                  {d.booking && (
                    <>
                      <div className="field-row mt12">
                        <div>
                          <label className="label" style={{ marginTop: 0 }}>
                            Boshlanishi
                          </label>
                          <select className="select" value={d.booking_start} onChange={(e) => set({ booking_start: Number(e.target.value) })}>
                            {Array.from({ length: 24 }, (_, h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label" style={{ marginTop: 0 }}>
                            Tugashi
                          </label>
                          <select className="select" value={d.booking_end} onChange={(e) => set({ booking_end: Number(e.target.value) })}>
                            {Array.from({ length: 24 }, (_, h) => h + 1)
                              .filter((h) => h > d.booking_start)
                              .map((h) => (
                                <option key={h} value={h}>
                                  {String(h % 24).padStart(2, '0')}:00
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                      <label className="label">
                        Joylar <span className="opt">· ixtiyoriy, vergul bilan</span>
                      </label>
                      <input className="input" value={d.rooms} onChange={(e) => set({ rooms: e.target.value })} placeholder="Masalan: Umumiy zal, VIP xona" maxLength={200} />
                      <p className="hint">Har bir joy bir vaqtda bitta band qabul qiladi.</p>
                    </>
                  )}
                </div>
              )}
              {business && (
                <div className="card flex gap12">
                  <span className="itile">
                    <Icon name="store" />
                  </span>
                  <div className="grow">
                    <b>Do‘kondan olib ketish</b>
                    <div className="small muted mt4">{business.address}</div>
                    <div className="tiny muted mt4">Biznes profilidan olinadi</div>
                  </div>
                  <Link href="/biznes/malumot" className="linkbtn">
                    O‘zgartirish
                  </Link>
                </div>
              )}
              <div className="note">
                <Icon name="info" />
                <div>Telefon va ish vaqti biznes profilingizdan olinadi.</div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="only-m">
                <PreviewCard d={d} biz={business ? { name: business.name, address: business.address } : biz.name ? { name: biz.name, address: biz.address } : null} />
              </div>
              <div className="card mt12">
                <b>Hammasi tayyor</b>
                <div className="checklist mt10">
                  <div>
                    <span className={d.photos.length ? 'ok' : 'no'}>
                      <Icon name="check" />
                    </span>
                    {d.photos.length} ta rasm{d.photos.length < MAX_PHOTOS ? ` (yana ${MAX_PHOTOS - d.photos.length} tagacha qo‘shish mumkin)` : ''}
                  </div>
                  <div>
                    <span className="ok">
                      <Icon name="check" />
                    </span>
                    Nomi, kategoriya va narx
                  </div>
                  <div>
                    <span className="ok">
                      <Icon name="check" />
                    </span>
                    {d.kind === 'product' ? (d.delivery ? 'Yetkazib berish shartlari' : 'Do‘kondan olib ketish') : d.booking ? 'Band qilish vaqtlari' : 'Xizmat shartlari'}
                  </div>
                  <div>
                    <span className={hasBiz ? 'ok' : 'no'}>
                      <Icon name="check" />
                    </span>
                    Manzil va telefon {hasBiz ? '' : '— keyingi qadamda'}
                  </div>
                </div>
              </div>
              {!hasBiz && (
                <div className="note mt12">
                  <Icon name="info" />
                  <div>Birinchi e’londa biznes ma’lumotlarini bir marta kiritasiz. Birinchi oy bepul.</div>
                </div>
              )}
              {hasBiz && !editing && (
                <button type="button" className="btn btn-ghost btn-block mt12" onClick={() => submit(false)} disabled={Boolean(saving)}>
                  {saving === 'draft' ? <span className="spinner" /> : null} Qoralama saqlash
                </button>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="flex gap12 center">
                <label className="addph" style={{ width: 84, height: 84, aspectRatio: 'auto', cursor: 'pointer', overflow: 'hidden', padding: 0, position: 'relative' }}>
                  {biz.logo_url ? <img src={biz.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : logoBusy ? <span className="spinner" /> : <><Icon name="camera" /> Logo</>}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      e.target.value = ''
                      if (!f) return
                      setLogoBusy(true)
                      try {
                        setB({ logo_url: await uploadImage(f, 'b', 512) })
                      } catch (x) {
                        toast(x instanceof Error ? x.message : 'Yuklanmadi')
                      } finally {
                        setLogoBusy(false)
                      }
                    }}
                  />
                </label>
                <div>
                  <b>Logo yoki do‘kon rasmi</b>
                  <div className="small muted">Ixtiyoriy. Keyin qo‘shsa ham bo‘ladi.</div>
                </div>
              </div>
              <label className="label">Biznes nomi</label>
              <input className="input" value={biz.name} onChange={(e) => setB({ name: e.target.value })} maxLength={60} placeholder="Masalan: Techno Market" />
              <label className="label">Faoliyat turi</label>
              <select className="select" value={biz.category} onChange={(e) => setB({ category: e.target.value })}>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <label className="label">Telefon</label>
              <div className="prefix-input">
                <span className="pre">+998</span>
                <input className="input" inputMode="tel" value={biz.phone} onChange={(e) => setB({ phone: e.target.value.replace(/[^\d ]/g, '').slice(0, 12) })} placeholder="90 123 45 67" />
              </div>
              <p className="hint">Xaridorlar shu raqamga qo‘ng‘iroq qiladi</p>
              <label className="label">Hudud</label>
              <select
                className="select"
                value={biz.area}
                onChange={(e) => {
                  const a = AREAS.find((x) => x.id === e.target.value) || AREAS[0]
                  setB({ area: a.id, lat: a.lat, lng: a.lng })
                }}
              >
                {AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <label className="label">Manzil</label>
              <input className="input" value={biz.address} onChange={(e) => setB({ address: e.target.value })} maxLength={120} placeholder="Masalan: Chortoq, Navoiy ko‘chasi, 12" />
              <label className="label">Xaritada belgilang</label>
              <div className="mapbox" style={{ height: 240 }}>
                <MapView points={[]} center={[biz.lat, biz.lng]} zoom={15} fit={false} pick={[biz.lat, biz.lng]} onPick={(lat, lng) => setB({ lat, lng })} />
              </div>
              <div className="flex between center mt8">
                <span className="hint" style={{ marginTop: 0 }}>
                  Xaritani bosing yoki belgini suring
                </span>
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() =>
                    navigator.geolocation?.getCurrentPosition(
                      (p) => setB({ lat: p.coords.latitude, lng: p.coords.longitude }),
                      () => toast('Joylashuvga ruxsat berilmadi'),
                      { enableHighAccuracy: true, timeout: 12000 },
                    )
                  }
                >
                  <Icon name="locate" size={18} /> Men shu yerdaman
                </button>
              </div>
              <label className="label">Ish kunlari</label>
              <div className="daypick">
                {DAY_NAMES.map((n, i) => {
                  const k = String(i + 1)
                  return (
                    <label key={k}>
                      <input type="checkbox" checked={biz.days.includes(k)} onChange={(e) => setB({ days: e.target.checked ? biz.days + k : biz.days.replace(k, '') })} />
                      <span>{n}</span>
                    </label>
                  )
                })}
              </div>
              <div className="field-row">
                <div>
                  <label className="label">Ochiladi</label>
                  <input className="input" value={biz.open_time} onChange={(e) => setB({ open_time: e.target.value })} placeholder="09:00" maxLength={5} inputMode="numeric" />
                </div>
                <div>
                  <label className="label">Yopiladi</label>
                  <input className="input" value={biz.close_time} onChange={(e) => setB({ close_time: e.target.value })} placeholder="21:00" maxLength={5} inputMode="numeric" />
                </div>
              </div>
              <p className="hint">24 soatlik formatda: 09:00 va 22:00</p>
            </div>
          )}

          {step === 6 && (
            <div>
              <div className="subcard">
                <div className="eyebrow g">Birinchi oy bepul</div>
                <div className="big">
                  0 so‘m <small>bugun</small>
                </div>
                <p>Keyin {money(SUB_PRICE)} so‘m/oy. Istalgan vaqt to‘xtatish mumkin.</p>
                <img className="mark" src="/brand/logo_mark_white.webp" alt="" />
              </div>
              <div className="card mt12">
                <b>Obunaga nimalar kiradi</b>
                <div className="checklist mt10">
                  {['Cheksiz e’lon joylash', 'Biznes profili va xaritada belgi', 'Chat, baho va izohlar', 'Ko‘rish, qo‘ng‘iroq va yo‘nalish statistikasi', 'Kuzatuvchilarga aksiya yuborish'].map((t) => (
                    <div key={t}>
                      <span className="ok">
                        <Icon name="check" />
                      </span>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card mt12">
                <b>Qanday ishlaydi</b>
                <div className="timeline mt12">
                  <div className="st on">
                    <i />
                    <div>
                      <b>Bugun, {dayLong(today)}</b>
                      <div className="small muted">E’lonlaringiz darhol chiqadi</div>
                    </div>
                  </div>
                  <div className="st">
                    <i />
                    <div>
                      <b>{dayLong(addDays(today, 27))}</b>
                      <div className="small muted">Eslatma: bepul oy tugashiga 3 kun qoldi</div>
                    </div>
                  </div>
                  <div className="st">
                    <i />
                    <div>
                      <b>{dayLong(addDays(today, 30))}</b>
                      <div className="small muted">{money(SUB_PRICE)} so‘m — to‘lov usulini o‘zingiz tanlaysiz</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="list-title">To‘lov usullari</div>
              <div className="chips wrap">
                {['Click', 'Payme', 'Uzum Bank', 'Uzcard / Humo'].map((m) => (
                  <span key={m} className="chip sm" style={{ cursor: 'default' }}>
                    <Icon name={m.includes('card') || m.includes('Humo') ? 'card' : 'wallet'} size={16} /> {m}
                  </span>
                ))}
              </div>
              <p className="hint">Hozir karta so‘ralmaydi.</p>
            </div>
          )}
          {err && <p className="err">{err.msg}</p>}
        </div>
        <aside className="only-d sticky">
          {step <= 4 && <PreviewCard d={d} biz={business ? { name: business.name, address: business.address } : biz.name ? { name: biz.name, address: biz.address } : null} />}
          {step >= 5 && (
            <div className="card">
              <b>Nega Cho‘ntakcha?</b>
              <p className="small muted mt8">Chortoq va Namangan xaridorlari yaqin atrofdagi narxlarni shu yerda solishtiradi. E’loningiz qidiruvda, xaritada va “Eng arzon narxlar” bo‘limida ko‘rinadi.</p>
            </div>
          )}
        </aside>
      </div>
      {footer}
    </div>
  )
}
