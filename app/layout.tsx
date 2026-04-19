import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

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
    default: 'FasoStock — Bibliothèque Visuelle du Burkina Faso',
    template: '%s | FasoStock',
  },
  description:
    'La plus grande bibliothèque libre de photos et vidéos du Burkina Faso. Images authentiques, libres de droits, contribuées par des Burkinabè.',
  keywords: [
    'Burkina Faso',
    'photos Burkina Faso',
    'images Burkina',
    'Ouagadougou',
    'Afrique de l\'ouest',
    'photos libres de droits Afrique',
    'stock photos Burkina Faso',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://fasostock.com',
    siteName: 'FasoStock',
    title: 'FasoStock — Bibliothèque Visuelle du Burkina Faso',
    description: 'Photos et vidéos authentiques du Burkina Faso, libres de droits.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FasoStock',
    description: 'Bibliothèque visuelle libre du Burkina Faso',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://fasostock.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body bg-faso-night text-white antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A2E',
              color: '#fff',
              border: '1px solid rgba(239, 192, 49, 0.3)',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#009A00', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF2B2D', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
