import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Semstack — UET Computer Engineering Notes & Portal',
  description: 'Official academic repository, semester notes, and department notices for UET Computer Engineering.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f5f2',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

import { IconProvider } from '@/components/icon-provider'

import { SmoothScrolling } from '@/components/smooth-scrolling'

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${manrope.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <SmoothScrolling>
          <IconProvider>
            {children}
          </IconProvider>
        </SmoothScrolling>
      </body>
    </html>
  )
}
