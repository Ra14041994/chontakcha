'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { finishIntro } from '@/app/_actions/prefs'
import { AREAS } from '@/lib/geo'
import { Icon } from '../Icon'
import { locateMe } from './AreaPicker'

const TILES: [string, string][] = [
  ['/sample/phone.jpg', '9,39 mln'],
  ['/sample/tomato.jpg', '6 000'],
  ['/sample/sofa.jpg', '2,85 mln'],
  ['/sample/gamepad.jpg', '12 000'],
  ['/sample/washer.jpg', '3,95 mln'],
  ['/sample/tools.jpg', '80 000'],
]

export function Intro({ current, overlay, next = '/' }: { current: string; overlay?: boolean; next?: string }) {
  const [area, setArea] = useState(current)
  const [busy, setBusy] = useState(false)
  const [pending, start] = useTransition()
  const [hidden, setHidden] = useState(false)
  const router = useRouter()
  if (hidden) return null

  const done = () =>
    start(async () => {
      await finishIntro(area)
      if (overlay) setHidden(true)
      else router.push(next)
    })

  const body = (
    <div className="intro">
      <div className="intro-top">
        <div className="mtop-row">
          <span className="logo-tile">
            <img src="/brand/logo_mark.webp" alt="" width={30} height={30} />
          </span>
          <img src="/brand/logo_word_white.webp" alt="Cho‘ntakcha" style={{ height: 22, width: 'auto' }} />
          <span className="grow" />
          <Link href="/kirish" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.4)' }}>
            Kirish
          </Link>
        </div>
        <div className="intro-grid mt16">
          {TILES.map(([src, price]) => (
            <div className="t" key={src}>
              <img src={src} alt="" />
              <span className="tag white">{price}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="intro-body">
        <h1>Yaqin atrofdagi narxlarni bir joyda solishtiring</h1>
        <div className="mt16">
          <div className="feat">
            <Icon name="trend" /> Eng arzon taklifni darhol ko‘rasiz
          </div>
          <div className="feat">
            <Icon name="nav" /> Do‘kongacha masofa va yo‘l
          </div>
          <div className="feat">
            <Icon name="chat" /> Sotuvchi bilan to‘g‘ridan-to‘g‘ri chat
          </div>
        </div>
        <div className="eyebrow mt20">Hududingiz</div>
        <div className="chips wrap mt10">
          {AREAS.map((a) => (
            <button key={a.id} type="button" className={`chip${a.id === area ? ' on' : ''}`} onClick={() => setArea(a.id)}>
              {a.id === area && <Icon name="check" size={16} />} {a.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="linkbtn mt16"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            locateMe((ok, id) => {
              setBusy(false)
              if (ok && id) setArea(id)
            })
          }}
        >
          {busy ? <span className="spinner" /> : <Icon name="locate" />} Joylashuvimni aniqlash
        </button>
        <button type="button" className="btn btn-primary btn-block mt24" onClick={done} disabled={pending}>
          {pending ? <span className="spinner white" /> : null} Boshlash
        </button>
      </div>
    </div>
  )

  if (!overlay) return body
  return <div className="intro-overlay">{body}</div>
}
