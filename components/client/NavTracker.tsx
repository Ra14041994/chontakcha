'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** Sayt ichida nechta sahifa ko‘rilganini sanaydi — “Orqaga” tugmasi to‘g‘ri ishlashi uchun. */
export function NavTracker() {
  const path = usePathname()
  useEffect(() => {
    const w = window as unknown as { __chNavDepth?: number }
    w.__chNavDepth = (w.__chNavDepth || 0) + 1
  }, [path])
  return null
}
