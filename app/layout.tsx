import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { SITE } from '@/lib/constants'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-jakarta', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'Jobs in Kolar — Local jobs across Kolar district', template: '%s · Jobs in Kolar' },
  description:
    'Find verified jobs in Kolar, Malur, Bangarpet, KGF, Mulbagal and Srinivaspur. Apply in minutes, track every application, and hire local talent.',
  applicationName: 'Jobs in Kolar',
  openGraph: { type: 'website', siteName: 'Jobs in Kolar', locale: 'en_IN', images: ['/images/hero-workforce.jpg'] },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
