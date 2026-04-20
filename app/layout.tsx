/**
 * app/layout.tsx — Layout racine de BurkinaVista
 * Bilingue FR/EN + Dark/Light mode + Animations
 */
import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Providers from '@/components/layout/Providers'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'BurkinaVista — Bibliothèque Visuelle du Burkina Faso',
    template: '%s | BurkinaVista',
  },
  description:
    'La plus grande bibliothèque libre de photos et vidéos du Burkina Faso. Images authentiques, libres de droits, contribuées par des Burkinabè. | The largest free library of photos and videos from Burkina Faso.',
  keywords: [
    'Burkina Faso',
    'photos Burkina Faso',
    'images Burkina Faso',
    'Ouagadougou',
    "Afrique de l'ouest",
    'photos libres de droits Afrique',
    'stock photos Burkina Faso',
    'BurkinaVista',
    'bibliothèque visuelle',
    'Burkina Faso photos',
    'free photos Africa',
    'visual library Burkina Faso',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: ['en_US'],
    url: 'https://burkina-vista.vercel.app',
    siteName: 'BurkinaVista',
    title: 'BurkinaVista — Bibliothèque Visuelle du Burkina Faso',
    description: 'Photos et vidéos authentiques du Burkina Faso, libres de droits. | Authentic photos and videos from Burkina Faso, free to use.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BurkinaVista',
    description: 'Bibliothèque visuelle libre du Burkina Faso | Free visual library of Burkina Faso',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'
  ),
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased transition-colors duration-300">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers locale={locale as 'fr' | 'en'}>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: 'toast-custom',
                style: {
                  borderRadius: '12px',
                },
                success: { iconTheme: { primary: '#009A00', secondary: '#fff' } },
                error: { iconTheme: { primary: '#EF2B2D', secondary: '#fff' } },
              }}
            />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
