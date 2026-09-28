import Link from 'next/link'
import { Shell, TopBack } from '@/components/shell'
import { Empty } from '@/components/ui'

export default function NotFound() {
  return (
    <Shell top={<TopBack />} sheet="narrow">
      <div className="inner">
        <Empty
          icon="searchx"
          title="Sahifa topilmadi"
          text="E’lon o‘chirilgan yoki havola noto‘g‘ri bo‘lishi mumkin."
          action={
            <Link href="/" className="btn btn-primary">
              Bosh sahifaga
            </Link>
          }
        />
      </div>
    </Shell>
  )
}
