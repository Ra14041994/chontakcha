'use client'
import { useRouter } from 'next/navigation'
import { Icon, type IconName } from '../Icon'

export function BackButton({ fallback = '/', icon = 'back', className = 'cbtn white round', label = 'Orqaga' }: { fallback?: string; icon?: IconName; className?: string; label?: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={() => {
        const depth = (window as unknown as { __chNavDepth?: number }).__chNavDepth || 0
        if (depth > 1) router.back()
        else router.push(fallback)
      }}
    >
      <Icon name={icon} size={22} />
    </button>
  )
}
