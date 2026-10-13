import type { Metadata } from 'next'
import './globals.css'
import { Header, Footer } from '@/components/site'
import { AIChatbot } from '@/components/AIChatbot'
import { ScrollToTop } from '@/components/ScrollToTop'

export const metadata: Metadata = {
  title: {
    default: 'Jobs in Kolar | Verified Local Career Marketplace & Industrial Jobs',
    template: '%s | Jobs in Kolar',
  },
  description:
    'Discover published job opportunities across Kolar district. Filter openings by official taluk, verified locality, role, and category.',
  keywords: [
    'Jobs in Kolar',
    'Narasapura industrial area jobs',
    'Kolar district jobs',
    'Kolar jobs',
    'KGF engineering jobs',
    'Malur jobs',
    'Karnataka local jobs',
    'Jobs near Bengaluru',
  ],
  authors: [{ name: 'Jobs in Kolar Team' }],
  icons: {
    icon: '/images/logo.jpg',
    apple: '/images/logo.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo.jpg" />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
        <ScrollToTop />
        <AIChatbot />
      </body>
    </html>
  )
}
