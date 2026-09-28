'use client'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon'

export function Drawer({ title, onClose, children, footer }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
  if (typeof document === 'undefined') return null
  return createPortal(
    <>
      <div className="drawer-bg" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true">
        <div className="grip only-m" />
        <div className="dh">
          <h3>{title}</h3>
          <button type="button" className="cbtn white round" style={{ width: 40, height: 40, boxShadow: 'none', background: 'var(--grey)' }} onClick={onClose} aria-label="Yopish">
            <Icon name="x" />
          </button>
        </div>
        <div className="db">{children}</div>
        {footer && <div className="df">{footer}</div>}
      </div>
    </>,
    document.body,
  )
}
