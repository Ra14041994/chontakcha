'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toggleFollow } from '@/app/_actions/social'
import { Icon } from '../Icon'
import { toast } from './Toaster'

export function FollowButton({ id, on, authed, variant = 'tile' }: { id: string; on: boolean; authed: boolean; variant?: 'tile' | 'btn' }) {
  const [f, setF] = useState(on)
  const [, start] = useTransition()
  const router = useRouter()
  const path = usePathname()
  const click = () => {
    if (!authed) return router.push('/kirish?next=' + encodeURIComponent(path))
    const next = !f
    setF(next)
    start(async () => {
      const r = await toggleFollow(id, next)
      if (!r.ok) {
        setF(!next)
        toast(r.error || 'Xatolik')
      } else toast(next ? 'Kuzatyapsiz — aksiyalar haqida xabar beramiz' : 'Kuzatish to‘xtatildi')
    })
  }
  if (variant === 'btn')
    return (
      <button type="button" className={`btn ${f ? 'btn-outline' : 'btn-primary'}`} onClick={click}>
        <Icon name={f ? 'check' : 'plus'} /> {f ? 'Kuzatyapsiz' : 'Kuzatish'}
      </button>
    )
  return (
    <button type="button" className={f ? '' : 'on'} onClick={click} aria-pressed={f}>
      <Icon name={f ? 'check' : 'plus'} size={22} />
      {f ? 'Kuzatyapsiz' : 'Kuzatish'}
    </button>
  )
}
