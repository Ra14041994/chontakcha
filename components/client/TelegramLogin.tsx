'use client'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { startTelegramLogin } from '@/app/_actions/auth'
import { Icon } from '../Icon'

type Links = { link: string; app: string; at: number }

export function TelegramLogin({ next }: { next: string }) {
  const [links, setLinks] = useState<Links | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [mobile, setMobile] = useState(false)
  const router = useRouter()

  const prepare = useCallback(async () => {
    const r = await startTelegramLogin(next)
    if (!r.ok) {
      setError(r.error)
      return
    }
    setError(null)
    setLinks({ link: r.link, app: r.app, at: Date.now() })
  }, [next])

  useEffect(() => {
    setMobile(/Android|iPhone|iPad|iPod|Telegram/i.test(navigator.userAgent) || matchMedia('(pointer: coarse)').matches)
    prepare()
    const t = setInterval(prepare, 10 * 60 * 1000) // havola 15 daqiqa amal qiladi
    return () => clearInterval(t)
  }, [prepare])

  useEffect(() => {
    if (!waiting) return
    let stopped = false
    const tick = async () => {
      try {
        const r = await fetch('/api/auth/telegram/status', { cache: 'no-store' })
        const j = (await r.json()) as { status: string; next?: string }
        if (stopped) return
        if (j.status === 'ok') {
          stopped = true
          setWaiting(false)
          router.replace(j.next || next)
          router.refresh()
        } else if (j.status === 'expired' || j.status === 'none' || j.status === 'used') {
          setWaiting(false)
          setError('Kutish vaqti tugadi. Qaytadan bosing.')
          prepare()
        }
      } catch {}
    }
    const iv = setInterval(tick, 2000)
    const onVis = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onVis)
    return () => {
      stopped = true
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onVis)
    }
  }, [waiting, next, router, prepare])

  if (!links)
    return (
      <div>
        <button type="button" className="btn tg-btn btn-block" disabled style={{ height: 54 }}>
          {error ? <Icon name="alert" /> : <span className="spinner white" />} Telegram orqali kirish
        </button>
        {error && <p className="err">{error}</p>}
      </div>
    )

  const href = mobile ? links.app : links.link
  return (
    <div>
      {waiting && (
        <div className="flex center gap12 mb16">
          <span className="spinner" />
          <div>
            <b>Telegram’da tasdiqlashni kutyapmiz…</b>
            <div className="small muted">Botda “Start” va “Raqamni yuborish”ni bosing, keyin shu sahifaga qayting.</div>
          </div>
        </div>
      )}
      <a
        href={href}
        target={mobile ? undefined : '_blank'}
        rel="noopener noreferrer"
        className="btn tg-btn btn-block"
        style={{ height: 54 }}
        onClick={() => {
          setError(null)
          setWaiting(true)
        }}
      >
        <Icon name="send" /> {waiting ? 'Telegram’ni qayta ochish' : 'Telegram orqali kirish'}
      </a>
      {waiting && (
        <p className="small muted tc mt10">
          Telegram ochilmadimi?{' '}
          <a href={links.link} target="_blank" rel="noopener noreferrer" className="link">
            t.me orqali ochish
          </a>
        </p>
      )}
      {error && <p className="err">{error}</p>}
    </div>
  )
}
