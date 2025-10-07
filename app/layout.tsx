import type { Metadata, Viewport } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4C764C',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div id="root" className="min-h-screen bg-background text-foreground">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
