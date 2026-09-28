'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CATEGORIES } from '@/lib/categories'
import { filterCount, searchHref, SORT_LABEL, type SearchState } from '@/lib/search'
import { money } from '@/lib/format'
import { Icon } from '../Icon'
import { BackButton } from './BackButton'
import { Drawer } from './Drawer'

export function SearchTop({ s }: { s: SearchState }) {
  const router = useRouter()
  const [q, setQ] = useState(s.q)
  const [open, setOpen] = useState(false)
  const n = filterCount(s)
  return (
    <div className="mtop-row">
      <BackButton fallback="/" />
      <form
        className="msearch grow"
        style={{ marginTop: 0, height: 48, borderRadius: 14 }}
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          router.push(searchHref(s, { q: q.trim(), n: 24 }))
        }}
      >
        <Icon name="search" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nima qidiryapsiz?" aria-label="Qidiruv" enterKeyHint="search" autoComplete="off" />
        {q && (
          <button
            type="button"
            className="clear"
            aria-label="Tozalash"
            onClick={() => {
              setQ('')
              router.push(searchHref(s, { q: '', n: 24 }))
            }}
          >
            <Icon name="x" size={18} />
          </button>
        )}
      </form>
      <button type="button" className="cbtn white" onClick={() => setOpen(true)} aria-label="Filtr">
        <Icon name="sliders" size={22} />
        {n > 0 && <span className="badge-n" style={{ position: 'absolute', top: -5, right: -5, background: 'var(--link)' }}>{n}</span>}
      </button>
      {open && <FilterDrawer s={s} onClose={() => setOpen(false)} />}
    </div>
  )
}

function FilterBody({ st, set }: { st: SearchState; set: (p: Partial<SearchState>) => void }) {
  return (
    <div className="filters">
      <div className="grp">
        <h4>Saralash</h4>
        <div className="chips wrap">
          {(Object.keys(SORT_LABEL) as SearchState['saralash'][]).map((k) => (
            <button key={k} type="button" className={`chip sm${st.saralash === k ? ' on' : ''}`} onClick={() => set({ saralash: k })}>
              {SORT_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
      <div className="grp">
        <h4>Kategoriya</h4>
        <select className="select" value={st.k} onChange={(e) => set({ k: e.target.value })} aria-label="Kategoriya">
          <option value="">Barcha kategoriyalar</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grp">
        <h4>Narx, so‘m</h4>
        <div className="field-row">
          <input className="input" inputMode="numeric" placeholder="Eng kam" value={st.min ? money(st.min) : ''} onChange={(e) => set({ min: Number(e.target.value.replace(/\D/g, '')) || 0 })} aria-label="Eng kam narx" />
          <input className="input" inputMode="numeric" placeholder="Eng ko‘p" value={st.max ? money(st.max) : ''} onChange={(e) => set({ max: Number(e.target.value.replace(/\D/g, '')) || 0 })} aria-label="Eng ko‘p narx" />
        </div>
      </div>
      <div className="grp">
        <h4>Masofa</h4>
        <div className="chips wrap">
          {[1, 3, 5, 10, 0].map((k) => (
            <button key={k} type="button" className={`chip sm${st.km === k ? ' on' : ''}`} onClick={() => set({ km: k })}>
              {k ? `${k} km` : 'Barcha'}
            </button>
          ))}
        </div>
      </div>
      <div className="grp">
        <h4>Reyting</h4>
        <div className="chips wrap">
          {[0, 4, 4.5].map((r) => (
            <button key={r} type="button" className={`chip sm${st.reyting === r ? ' on' : ''}`} onClick={() => set({ reyting: r })}>
              {r ? `★ ${String(r).replace('.', ',')}+` : 'Istalgan'}
            </button>
          ))}
        </div>
      </div>
      <div className="grp">
        {(
          [
            ['ochiq', 'Hozir ochiq', 'Faqat hozir ishlayotgan do‘konlar'],
            ['mavjud', 'Faqat mavjud', 'Tugagan mahsulotlarni yashirish'],
            ['yetkazish', 'Yetkazib berish bor', 'Do‘kon o‘zi olib keladi'],
          ] as const
        ).map(([key, t, sub]) => (
          <label key={key} className="trow" style={{ cursor: 'pointer' }}>
            <span>
              <b style={{ display: 'block' }}>{t}</b>
              <span className="s">{sub}</span>
            </span>
            <span className="switch">
              <input type="checkbox" checked={st[key]} onChange={(e) => set({ [key]: e.target.checked } as Partial<SearchState>)} />
              <span />
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

function FilterDrawer({ s, onClose }: { s: SearchState; onClose: () => void }) {
  const router = useRouter()
  const [st, setSt] = useState<SearchState>(s)
  const set = (p: Partial<SearchState>) => setSt((x) => ({ ...x, ...p }))
  return (
    <Drawer
      title="Filtr"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              onClose()
              router.push(searchHref({ q: s.q, tur: s.tur, view: s.view }))
            }}
          >
            Tozalash
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={() => {
              onClose()
              router.push(searchHref({ ...st, n: 24 }))
            }}
          >
            Natijalarni ko‘rsatish
          </button>
        </>
      }
    >
      <FilterBody st={st} set={set} />
    </Drawer>
  )
}

export function FilterSidebar({ s }: { s: SearchState }) {
  const router = useRouter()
  const [st, setSt] = useState<SearchState>(s)
  const [dirty, setDirty] = useState(false)
  const apply = (next: SearchState) => router.replace(searchHref({ ...next, n: 24 }), { scroll: false })
  const set = (p: Partial<SearchState>) => {
    const next = { ...st, ...p }
    setSt(next)
    if ('min' in p || 'max' in p) setDirty(true)
    else apply(next)
  }
  return (
    <div className="card">
      <div className="card-h">
        <h3>Filtrlar</h3>
        <button type="button" className="linkbtn" onClick={() => router.replace(searchHref({ q: s.q, tur: s.tur }))}>
          Tozalash
        </button>
      </div>
      <FilterBody st={st} set={set} />
      {dirty && (
        <button
          type="button"
          className="btn btn-primary btn-block btn-sm mt8"
          onClick={() => {
            setDirty(false)
            apply(st)
          }}
        >
          Narxni qo‘llash
        </button>
      )}
    </div>
  )
}
