'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showSubtitle?: boolean
  href?: string
  className?: string
}

export function Logo({ size = 'md', showSubtitle = true, href = '/', className = '' }: LogoProps) {
  const imgDimension = size === 'sm' ? 38 : size === 'lg' ? 56 : 46
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'

  const content = (
    <div className={`brand-link ${className}`}>
      <div className="relative flex-shrink-0">
        <img
          src="/images/logo.jpg"
          alt="Jobs in Kolar Logo"
          width={imgDimension}
          height={imgDimension}
          className="brand-logo-img"
          style={{ width: imgDimension, height: imgDimension }}
        />
      </div>
      <div className="brand-text-block">
        <span className={`brand-title ${titleSize}`}>Jobs in Kolar</span>
        {showSubtitle && (
          <span className="brand-subtitle">
            Local Career Hub
          </span>
        )}
      </div>
    </div>
  )

  if (!href) return content
  return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>
}
