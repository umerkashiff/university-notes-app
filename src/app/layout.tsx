import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'CE Notes — Your study companion',
  description: 'A calm, friendly home for your subjects, notes, and learning.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f5f2',
  width: 'device-width',
  initialScale: 1,
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
