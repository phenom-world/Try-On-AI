import './globals.css'

import type { Metadata, Viewport } from 'next'
import { Source_Sans_3 } from 'next/font/google'
import { Toaster } from 'sonner'

import ThemeProvider from '@/components/theme-provider'

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Try-on AI - Virtual Try-On Experience',
  description:
    'Experience virtual try-on powered by AI. Upload your photo and instantly see how different garments look on you. Transform your shopping experience with our advanced AI technology.',
  keywords:
    'Try-on AI, virtual try-on, AI fashion, digital fitting room, virtual mirror, AI clothing, fashion technology, virtual clothing try-on',
  authors: [{ name: 'Wakeel Kehinde', url: '' }],
  creator: 'Wakeel Kehinde',
  publisher: 'Wakeel Kehinde',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tryon-ai.vercel.app',
    title: 'Try-on AI - Virtual Try-On Experience',
    description:
      'Transform your shopping experience with AI-powered virtual try-on technology.',
    siteName: 'Try-on AI',
    images: [
      {
        url: '/og-image.png', // Make sure to add this image to your public folder
        width: 1200,
        height: 630,
        alt: 'Try-on AI Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Try-on AI - Virtual Try-On Experience',
    description:
      'Transform your shopping experience with AI-powered virtual try-on technology.',
    creator: '@tijjken',
    images: ['/og-image.png'],
  },
  metadataBase: new URL('https://tryon-ai.vercel.app'),

  manifest: '/manifest.json',
}
export const viewport: Viewport = {
  themeColor: '#0A0A0B',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#020817" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className={`${sourceSans3.className} antialiased`}>
        <ThemeProvider>
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              classNames: {
                toast:
                  'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                description: 'group-[.toast]:text-muted-foreground',
                actionButton:
                  'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                cancelButton:
                  'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
              },
            }}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
