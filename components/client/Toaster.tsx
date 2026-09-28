'use client'
import { useEffect, useState } from 'react'

export function toast(message: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ch-toast', { detail: message }))
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    const on = (e: Event) => {
      setMsg(String((e as CustomEvent).detail || ''))
      if (t) clearTimeout(t)
      t = setTimeout(() => setMsg(null), 2600)
    }
    window.addEventListener('ch-toast', on)
    return () => {
      window.removeEventListener('ch-toast', on)
      if (t) clearTimeout(t)
    }
  }, [])
  if (!msg) return null
  return (
    <div className="toast" role="status" aria-live="polite">
      {msg}
    </div>
  )
}
