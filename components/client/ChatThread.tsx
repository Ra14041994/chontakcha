'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { toast } from './Toaster'

type M = { id: number; from_seller: boolean; body: string; created_at: string; pending?: boolean }

const TZ = 5 * 3600 * 1000
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
function dayKey(iso: string) {
  return new Date(new Date(iso).getTime() + TZ).toISOString().slice(0, 10)
}
function dayLabel(key: string) {
  const today = dayKey(new Date().toISOString())
  const y = dayKey(new Date(Date.now() - 86400000).toISOString())
  if (key === today) return 'Bugun'
  if (key === y) return 'Kecha'
  const [, m, d] = key.split('-').map(Number)
  return `${d}-${MONTHS[m - 1]}`
}
function hm(iso: string) {
  const t = new Date(new Date(iso).getTime() + TZ)
  return `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`
}

const QUICK_BUYER = ['Hali bormi?', 'Oxirgi narxi qancha?', 'Yetkazib berasizmi?', 'Qachongacha ochiqsiz?']
const QUICK_SELLER = ['Ha, bor', 'Bugun kelishingiz mumkin', 'Yetkazib beramiz', 'Afsuski, tugagan']

export function ChatThread({ convId, role, initial }: { convId: string; role: 'buyer' | 'seller'; initial: M[] }) {
  const [msgs, setMsgs] = useState<M[]>(initial)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const lastId = useRef(initial.length ? initial[initial.length - 1].id : 0)
  const mine = (m: M) => (role === 'seller' ? m.from_seller : !m.from_seller)

  const scrollDown = useCallback((smooth = false) => {
    const el = box.current
    if (el && el.scrollHeight > el.clientHeight + 4 && getComputedStyle(el).overflowY === 'auto') {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    }
  }, [])

  useLayoutEffect(() => {
    scrollDown(false)
  }, [scrollDown])

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/chat/${convId}?after=${lastId.current}`, { cache: 'no-store' })
      if (!r.ok) return
      const j = (await r.json()) as { messages: M[] }
      if (j.messages?.length) {
        setMsgs((cur) => {
          const ids = new Set(cur.map((x) => x.id))
          const add = j.messages.filter((x) => !ids.has(x.id)).map((x) => ({ ...x, created_at: new Date(x.created_at).toISOString() }))
          return add.length ? [...cur.filter((x) => !x.pending), ...add, ...cur.filter((x) => x.pending)] : cur
        })
        lastId.current = Math.max(lastId.current, ...j.messages.map((x) => x.id))
        setTimeout(() => scrollDown(true), 30)
      }
    } catch {}
  }, [convId, scrollDown])

  useEffect(() => {
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') poll()
    }, 3000)
    const onVis = () => document.visibilityState === 'visible' && poll()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [poll])

  const send = async (body: string) => {
    const t = body.trim()
    if (!t || sending) return
    setSending(true)
    const tmpId = -Date.now()
    const tmp: M = { id: tmpId, from_seller: role === 'seller', body: t, created_at: new Date().toISOString(), pending: true }
    setMsgs((cur) => [...cur, tmp])
    setText('')
    setTimeout(() => scrollDown(true), 20)
    try {
      const r = await fetch(`/api/chat/${convId}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: t }) })
      const j = (await r.json()) as { message?: M; error?: string }
      if (!r.ok || !j.message) throw new Error(j.error || 'Xatolik')
      const m = { ...j.message, created_at: new Date(j.message.created_at).toISOString() }
      setMsgs((cur) => {
        const rest = cur.filter((x) => x.id !== tmpId && x.id !== m.id)
        return [...rest, m].sort((a, b) => (a.pending ? 1 : 0) - (b.pending ? 1 : 0) || a.id - b.id)
      })
      lastId.current = Math.max(lastId.current, m.id)
    } catch (e) {
      setMsgs((cur) => cur.filter((x) => x.id !== tmpId))
      setText(t)
      toast(e instanceof Error ? e.message : 'Xabar yuborilmadi')
    } finally {
      setSending(false)
    }
  }

  let prevDay = ''
  const quick = role === 'seller' ? QUICK_SELLER : QUICK_BUYER
  return (
    <>
      <div className="msgs" ref={box} style={{ overflowY: undefined }}>
        {!msgs.length && <p className="tc small muted" style={{ padding: '24px 0' }}>Salom yozing — sotuvchi odatda tez javob beradi.</p>}
        {msgs.map((m) => {
          const k = dayKey(m.created_at)
          const sep = k !== prevDay
          prevDay = k
          return (
            <div key={m.id} style={{ display: 'contents' }}>
              {sep && <div className="msg-day">{dayLabel(k)}</div>}
              <div className={`msg ${mine(m) ? 'out' : 'in'}${m.pending ? ' pending' : ''}`}>
                {m.body}
                <div className="t">
                  {hm(m.created_at)}
                  {mine(m) && <Icon name={m.pending ? 'clock' : 'checks'} size={14} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="quick">
        {quick.map((q) => (
          <button key={q} type="button" onClick={() => send(q)} disabled={sending}>
            {q}
          </button>
        ))}
      </div>
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Xabar yozing…"
          rows={1}
          maxLength={2000}
          aria-label="Xabar"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
              e.preventDefault()
              send(text)
            }
          }}
        />
        <button type="submit" className="send" aria-label="Yuborish" disabled={sending || !text.trim()}>
          <Icon name="send" />
        </button>
      </form>
    </>
  )
}
