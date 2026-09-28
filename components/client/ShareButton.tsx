'use client'
import { trackEvent } from '@/app/_actions/social'
import { Icon } from '../Icon'
import { toast } from './Toaster'

export function ShareButton({ title, text, listingId, businessId, className = 'cbtn white round', label, path }: { title: string; text?: string; listingId?: string; businessId?: string; className?: string; label?: string; path?: string }) {
  return (
    <button
      type="button"
      className={className}
      aria-label="Ulashish"
      onClick={async () => {
        const url = path ? window.location.origin + path : window.location.href.split('#')[0]
        trackEvent('share', listingId || null, businessId || null).catch(() => {})
        try {
          if (navigator.share) {
            await navigator.share({ title, text, url })
            return
          }
        } catch {
          return
        }
        try {
          await navigator.clipboard.writeText(url)
          toast('Havola nusxalandi')
        } catch {
          window.prompt('Havolani nusxalang:', url)
        }
      }}
    >
      <Icon name="share" size={label ? 18 : 22} />
      {label}
    </button>
  )
}
