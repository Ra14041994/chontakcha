'use client'
import { useState } from 'react'
import { trackEvent } from '@/app/_actions/social'
import { phonePretty } from '@/lib/format'
import { Icon } from '../Icon'
import { toast } from './Toaster'

/** Qo‘ng‘iroq / yo‘nalish tugmalari — statistikaga yoziladi. */
export function CallButton({ phone, listingId, businessId, className = 'btn btn-outline btn-icon', withText }: { phone: string; listingId?: string; businessId: string; className?: string; withText?: boolean }) {
  return (
    <a
      href={`tel:${phone}`}
      className={className}
      aria-label="Qo‘ng‘iroq qilish"
      onClick={() => {
        trackEvent('call', listingId || null, businessId).catch(() => {})
      }}
    >
      <Icon name="phone" />
      {withText && 'Qo‘ng‘iroq'}
    </a>
  )
}

export function RevealPhone({ phone, listingId, businessId }: { phone: string; listingId?: string; businessId: string }) {
  const [shown, setShown] = useState(false)
  if (shown)
    return (
      <a href={`tel:${phone}`} className="btn btn-outline" onClick={() => trackEvent('call', listingId || null, businessId).catch(() => {})}>
        <Icon name="phone" /> {phonePretty(phone)}
      </a>
    )
  return (
    <button
      type="button"
      className="btn btn-outline"
      onClick={() => {
        setShown(true)
        trackEvent('call', listingId || null, businessId).catch(() => {})
      }}
    >
      <Icon name="phone" /> Raqamni ko‘rish
    </button>
  )
}

export function RouteButton({ href, listingId, businessId, className = 'btn btn-primary', label = 'Yo‘nalish' }: { href: string; listingId?: string; businessId: string; className?: string; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className} onClick={() => trackEvent('route', listingId || null, businessId).catch(() => {})}>
      <Icon name="nav" /> {label}
    </a>
  )
}

export function DisabledAction({ icon, label, reason, className = 'btn btn-soft' }: { icon: 'chat' | 'cal'; label: string; reason: string; className?: string }) {
  return (
    <button type="button" className={className} style={{ opacity: 0.6 }} onClick={() => toast(reason)}>
      <Icon name={icon} /> {label}
    </button>
  )
}
