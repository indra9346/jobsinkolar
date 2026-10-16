'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/format'

/** Fades and lifts children into view once, when they scroll into the viewport. */
export function Reveal({ children, delay = 0, className, as: Tag = 'div' }: { children: React.ReactNode; delay?: number; className?: string; as?: 'div' | 'section' | 'li' }) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) return setShown(true)
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref as never} className={cn('reveal', shown && 'is-visible', className)} style={{ ['--reveal-delay' as string]: `${delay}ms` }}>
      {children}
    </Tag>
  )
}

/** Counts up from 0 to `value` when first visible. */
export function CountUp({ value, duration = 1100, className }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || value === 0) return setN(value)
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration)
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration])
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {n.toLocaleString('en-IN')}
    </span>
  )
}
