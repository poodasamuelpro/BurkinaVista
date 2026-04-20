/**
 * app/confidentialite/page.tsx — Politique de Confidentialité bilingue FR/EN
 */
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Shield, Eye, Database, Trash2, Mail, Lock, Globe } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'privacy' })
  return {
    title: t('seo_title'),
    description: t('seo_desc'),
    robots: { index: true, follow: false },
    alternates: {
      canonical: 'https://burkina-vista.vercel.app/confidentialite',
    },
  }
}

export default async function ConfidentialitePage() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'privacy' })

  const dateMAJ = new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const droits = [
    { icon: Eye, titre: locale === 'fr' ? "Droit d'accès" : 'Right of access', desc: locale === 'fr' ? "Vous pouvez demander à consulter toutes les données que nous détenons sur vous." : "You can request to view all data we hold about you." },
    { icon: Database, titre: locale === 'fr' ? 'Droit de rectification' : 'Right of rectification', desc: locale === 'fr' ? "Vous pouvez demander la correction de vos données inexactes ou incomplètes." : "You can request correction of your inaccurate or incomplete data." },
    { icon: Trash2, titre: locale === 'fr' ? "Droit à l'effacement" : 'Right to erasure', desc: locale === 'fr' ? "Vous pouvez demander la suppression de vos données personnelles (droit à l'oubli)." : "You can request deletion of your personal data (right to be forgotten)." },
    { icon: Lock, titre: locale === 'fr' ? "Droit d'opposition" : 'Right to object', desc: locale === 'fr' ? "Vous pouvez vous opposer au traitement de vos données à tout moment." : "You can object to the processing of your data at any time." },
    { icon: Globe, titre: locale === 'fr' ? 'Droit à la portabilité' : 'Right to portability', desc: locale === 'fr' ? "Vous pouvez demander vos données dans un format structuré et lisible par machine." : "You can request your data in a structured, machine-readable format." },
    { icon: Mail, titre: locale === 'fr' ? 'Désabonnement newsletter' : 'Newsletter unsubscribe', desc: locale === 'fr' ? "Chaque email contient un lien de désabonnement. Cliquez-y à tout moment." : "Every email contains an unsubscribe link. Click it at any time." },
  ]

  const données = locale === 'fr' ? [
    { source: "Contribution d'un média", données: ['Prénom', 'Nom', 'Adresse email', 'Numéro de téléphone (optionnel)'], finalité: 'Attribution du crédit, contact en cas de question', durée: '5 ans après la dernière contribution', base: 'Consentement' },
    { source: 'Abonnement newsletter', données: ['Adresse email', 'Prénom (optionnel)'], finalité: 'Envoi de la newsletter hebdomadaire', durée: "Jusqu'au désabonnement", base: 'Consentement' },
    { source: 'Navigation sur le site', données: ['Adresse IP (anonymisée)', 'Pages visitées', 'Navigateur et système'], finalité: "Statistiques d'audience anonymes", durée: '13 mois maximum', base: 'Intérêt légitime' },
  ] : [
    { source: 'Media contribution', données: ['First name', 'Last name', 'Email address', 'Phone number (optional)'], finalité: 'Credit attribution, contact if needed', durée: '5 years after last contribution', base: 'Consent' },
    { source: 'Newsletter subscription', données: ['Email address', 'First name (optional)'], finalité: 'Sending weekly newsletter', durée: 'Until unsubscription', base: 'Consent' },
    { source: 'Website browsing', données: ['IP address (anonymized)', 'Pages visited', 'Browser and system'], finalité: 'Anonymous audience statistics', durée: '13 months maximum', base: 'Legitimate interest' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 page-enter">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 badge badge-gray mb-6">
            <Shield size={14} />
            {t('badge')}
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-4 animate-fade-in">
            {t('title')}
          </h1>
          <div className="faso-divider w-24 mx-auto mb-4" />
          <p className="text-white/30 text-sm">
            {t('updated')} : <span className="text-white/50">{dateMAJ}</span>
          </p>
        </div>

        {/* Intro */}
        <div className="card p-6 border border-faso-green/10 mb-10 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-faso-green flex-shrink-0 mt-0.5" />
            <p className="text-white/60 text-sm leading-relaxed">{t('intro')}</p>
          </div>
        </div>

        {/* Données collectées */}
        <section className="mb-10" id="donnees">
          <h2 className="font-display text-2xl text-white mb-4">
            {locale === 'fr' ? '2. Données collectées et finalités' : '2. Data collected and purposes'}
          </h2>
          <div className="space-y-4">
            {données.map(({ source, données: d, finalité, durée, base }) => (
              <div key={source} className="card p-6">
                <h3 className="font-medium text-faso-gold mb-4">{source}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">
                      {locale === 'fr' ? 'Données collectées' : 'Data collected'}
                    </p>
                    <ul className="space-y-1">
                      {d.map((item) => (
                        <li key={item} className="text-white/60 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-faso-gold flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{locale === 'fr' ? 'Finalité' : 'Purpose'}</p>
                      <p className="text-white/60">{finalité}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{locale === 'fr' ? 'Durée de conservation' : 'Retention period'}</p>
                      <p className="text-white/60">{durée}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{locale === 'fr' ? 'Base légale' : 'Legal basis'}</p>
                      <p className="text-white/60">{base}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vos droits */}
        <section className="mb-10" id="droits">
          <h2 className="font-display text-2xl text-white mb-4">
            {locale === 'fr' ? '6. Vos droits sur vos données' : '6. Your rights over your data'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {droits.map(({ icon: Icon, titre, desc }) => (
              <div key={titre} className="card p-5">
                <Icon size={18} className="text-faso-gold mb-3" />
                <h3 className="font-medium text-white text-sm mb-2">{titre}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="card p-5 border border-faso-gold/10">
            <p className="text-white/50 text-sm leading-relaxed">{t('contact_for_rights')}</p>
          </div>
        </section>

        {/* Contact DPO */}
        <div className="card p-8 border border-faso-green/20 bg-faso-green/5 text-center">
          <Shield size={32} className="text-faso-green mx-auto mb-4" />
          <h3 className="font-display text-xl text-white mb-3">{t('questions_title')}</h3>
          <p className="text-white/50 text-sm mb-4 max-w-md mx-auto">{t('questions_desc')}</p>
          <a
            href="mailto:BurkinaVista@gmail.com"
            className="inline-flex items-center gap-2 text-faso-gold hover:text-faso-gold/80 transition-colors font-medium mb-4"
          >
            <Mail size={16} />
            {t('email_contact')}
          </a>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <Link href="/contact" className="btn-ghost text-sm py-2 px-5">
              {t('cta_contact')}
            </Link>
            <Link href="/cgu" className="btn-ghost text-sm py-2 px-5">
              {t('cta_cgu')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
