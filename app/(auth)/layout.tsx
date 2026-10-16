import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/site/Logo'
import img from '@/public/images/kolar-industry.jpg'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <Logo />
        <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">{children}</main>
        <p className="text-center text-xs text-ink-4">
          By continuing you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy policy</a>.
        </p>
      </div>
      <aside className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <Image src={img} alt="" fill sizes="560px" className="object-cover opacity-35" placeholder="blur" />
        <div className="relative flex h-full flex-col justify-end p-10 text-white">
          <p className="text-2xl leading-snug font-semibold text-white">Kolar&apos;s own job board — every listing checked by a real person.</p>
          <ul className="mt-6 space-y-2.5 text-[15px] text-white/80">
            {['Free for job seekers, always', 'Track applications in real time', 'Hire local talent from six taluks'].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
