import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
})

export const metadata: Metadata = {
  title: 'SILAS - Stoneclough Initiative for Local & Autonomous Systems',
  description: 'A faith-guided, data-informed community intelligence platform that empowers communities to vote, build, restore, and thrive through transparent collaboration.',
  keywords: ['community', 'mapping', 'local', 'stoneclough', 'collaboration', 'faith'],
  authors: [{ name: 'SILAS Community' }],
  openGraph: {
    title: 'SILAS Community Platform',
    description: 'Interactive community mapping and collaboration platform for Stoneclough',
    type: 'website',
    locale: 'en_GB',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#4C764C',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body className={`${inter.className} antialiased bg-slate-900 text-slate-100`}>
        <div id="root" className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
