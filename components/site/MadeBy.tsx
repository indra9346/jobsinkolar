'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import logo from '@/public/brand/hosting-baba.png'
import { useLang } from '@/lib/i18n'

type Burst = { id: number; x: number; drift: number; size: number; hue: number }

/** "Designed & Developed with ❤ by Hosting Baba" — animated credit badge for the footer. */
export function MadeBy() {
  const { lang } = useLang()
  const [bursts, setBursts] = useState<Burst[]>([])
  const seq = useRef(0)

  const burst = (n = 6) => {
    const add = Array.from({ length: n }, () => ({
      id: ++seq.current,
      x: Math.random() * 24 - 12,
      drift: Math.random() * 40 - 20,
      size: 8 + Math.random() * 8,
      hue: Math.random() > 0.5 ? 350 : 15,
    }))
    setBursts((b) => [...b.slice(-18), ...add])
    setTimeout(() => setBursts((b) => b.filter((x) => !add.some((a) => a.id === x.id))), 1600)
  }

  return (
    <a
      href="https://webhostingbaba.com/"
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => burst()}
      onFocus={() => burst()}
      onClick={() => burst(4)}
      aria-label="Designed and developed by Hosting Baba (opens webhostingbaba.com in a new tab)"
      className="madeby group relative inline-flex rounded-full p-[1.5px]"
    >
      {/* rotating gradient ring */}
      <span className="madeby-ring absolute inset-0 rounded-full" aria-hidden />
      {/* soft outer glow */}
      <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-brand-500/40 via-saffron-400/40 to-brand-500/40 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" aria-hidden />

      <span className="relative flex items-center gap-2.5 overflow-hidden rounded-full bg-[#0d0d12] py-1.5 pr-1.5 pl-4 text-[13px] text-white/80">
        {/* light sweep */}
        <span className="madeby-sweep pointer-events-none absolute inset-y-0 -left-1/2 w-1/2" aria-hidden />

        <span className="whitespace-nowrap">
          {lang === 'kn' ? 'ವಿನ್ಯಾಸ ಮತ್ತು ಅಭಿವೃದ್ಧಿ' : 'Designed & Developed with'}
        </span>

        <span className="relative inline-flex">
          <svg viewBox="0 0 24 24" className="madeby-heart size-4 text-[#ff3b5c] drop-shadow-[0_0_6px_rgba(255,59,92,0.8)]" aria-label="love" role="img">
            <path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4.5 6 4.1c2-.2 3.6.9 4.5 2.3.3.5 1 .5 1.3 0 .9-1.4 2.6-2.5 4.5-2.3 3.7.4 5.6 4.3 4 7.6C19.5 16.4 12 21 12 21z" />
          </svg>
          {bursts.map((b) => (
            <svg
              key={b.id}
              viewBox="0 0 24 24"
              className="madeby-float pointer-events-none absolute top-0 left-1/2"
              style={{ width: b.size, height: b.size, ['--x' as string]: `${b.x}px`, ['--drift' as string]: `${b.drift}px`, color: `hsl(${b.hue} 95% 62%)` }}
              aria-hidden
            >
              <path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4.5 6 4.1c2-.2 3.6.9 4.5 2.3.3.5 1 .5 1.3 0 .9-1.4 2.6-2.5 4.5-2.3 3.7.4 5.6 4.3 4 7.6C19.5 16.4 12 21 12 21z" />
            </svg>
          ))}
        </span>

        <span className="whitespace-nowrap">{lang === 'kn' ? 'ಮಾಡಿದವರು' : 'by'}</span>

        <span className="relative flex items-center rounded-full bg-black px-2.5 py-1 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105">
          <Image src={logo} alt="Hosting Baba" height={22} className="h-[22px] w-auto select-none" />
        </span>
      </span>
    </a>
  )
}
