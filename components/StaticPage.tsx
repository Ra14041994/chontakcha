import { Shell, TopBack } from './shell'

export function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Shell top={<TopBack fallback="/profil" />} active="profil" sheet="narrow" footer>
      <div className="inner prose">
        <h1 className="mb16">{title}</h1>
        {children}
      </div>
    </Shell>
  )
}
