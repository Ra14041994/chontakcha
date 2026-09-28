import type { Metadata } from 'next'
import { getViewer } from '@/lib/session'
import { Intro } from '@/components/client/Intro'
import { safeNext } from '@/lib/url'

export const metadata: Metadata = { title: 'Xush kelibsiz' }

export default async function IntroPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const v = await getViewer()
  const { next } = await searchParams
  return (
    <div className="intro-page">
      <Intro current={v.areaId} next={safeNext(next)} />
    </div>
  )
}
