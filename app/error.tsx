'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="setup" style={{ textAlign: 'center' }}>
      <h2>Nimadir xato ketdi</h2>
      <p className="muted mt8">Sahifani qayta yuklab ko‘ring. Muammo takrorlansa, birozdan keyin urinib ko‘ring.</p>
      <div className="btns mt20" style={{ justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => reset()}>
          Qayta urinish
        </button>
        <a className="btn btn-outline" href="/">
          Bosh sahifa
        </a>
      </div>
      {error.digest && <p className="tiny muted mt16">Kod: {error.digest}</p>}
    </div>
  )
}
