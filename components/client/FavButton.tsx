'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toggleFavorite } from '@/app/_actions/social'
import { Icon } from '../Icon'
import { toast } from './Toaster'

export function FavButton({ id, on, authed, large, disabledReason }: { id: string; on: boolean; authed: boolean; large?: boolean; disabledReason?: string }) {
  const [fav, setFav] = useState(on)
  const [, start] = useTransition()
  const router = useRouter()
  const path = usePathname()
  return (
    <button
      type="button"
      className={`favbtn${fav ? ' on' : ''}${large ? ' lg' : ''}`}
      aria-label={fav ? 'Saqlanganlardan olib tashlash' : 'Saqlash'}
      aria-pressed={fav}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (disabledReason) return toast(disabledReason)
        if (!authed) {
          router.push('/kirish?next=' + encodeURIComponent(path))
          return
        }
        const next = !fav
        setFav(next)
        start(async () => {
          const r = await toggleFavorite(id, next)
          if (!r.ok) {
            setFav(!next)
            toast(r.error || 'Xatolik yuz berdi')
          } else if (next) toast('Saqlanganlarga qo‘shildi')
        })
      }}
    >
      <Icon name="heart" />
    </button>
  )
}
