/**
 * app/contact/page.tsx — Page de contact bilingue BurkinaVista
 * Plainte, recommandation, conseil, litige, signalement
 */
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import ContactClient from './ContactClient'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'contact' })

  return {
    title: t('seo_title'),
    description: t('seo_desc'),
    openGraph: {
      title: t('seo_title'),
      description: t('seo_desc'),
      url: 'https://burkina-vista.vercel.app/contact',
    },
    alternates: {
      canonical: 'https://burkina-vista.vercel.app/contact',
      languages: {
        'fr': 'https://burkina-vista.vercel.app/contact',
        'en': 'https://burkina-vista.vercel.app/contact',
      },
    },
  }
}

export default function ContactPage() {
  return <ContactClient />
}
