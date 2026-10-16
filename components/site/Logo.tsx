import Image from 'next/image'
import Link from 'next/link'
import mark from '@/public/brand/mark.png'

export function Logo({ compact = false, href = '/' }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2" aria-label="Jobs in Kolar home">
      <Image src={mark} alt="" width={26} height={34} priority className="h-[34px] w-auto" />
      {!compact && (
        <span className="leading-none">
          <span className="block text-[17px] font-bold tracking-tight text-navy-800">
            Jobs in <span className="text-brand-600">Kolar</span>
          </span>
        </span>
      )}
    </Link>
  )
}
