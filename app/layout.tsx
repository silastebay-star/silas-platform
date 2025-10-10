import type { Metadata, Viewport } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth/auth-context'
import { RealtimeProvider } from '@/components/providers/realtime-provider'
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
          <AuthProvider>
            <RealtimeProvider>
              <div id="root" className="min-h-screen bg-background text-foreground">
                {children}
              </div>
              <Toaster
                position="top-right"
                expand={true}
                richColors
                closeButton
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </RealtimeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
