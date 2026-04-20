/**
 * app/licences/page.tsx — Page des licences Creative Commons bilingue FR/EN
 */
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { CheckCircle, XCircle, ExternalLink, Info, AlertTriangle, Mail } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'licences' })
  return {
    title: t('seo_title'),
    description: t('seo_desc'),
    alternates: { canonical: 'https://burkina-vista.vercel.app/licences' },
  }
}

export default async function LicencesPage() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'licences' })

  const licences = [
    {
      code: 'CC0', nom: locale === 'fr' ? 'Domaine Public' : 'Public Domain',
      badge: 'badge-green', couleur: 'text-faso-green', bg: 'bg-faso-green/10', border: 'border-faso-green/20', emoji: '🟢',
      description: locale === 'fr'
        ? "Le contributeur renonce à tous ses droits d'auteur. L'image appartient au domaine public. Vous pouvez faire absolument tout ce que vous voulez avec."
        : "The contributor waives all copyright. The image belongs to the public domain. You can do absolutely anything with it.",
      peutFaire: locale === 'fr'
        ? ['Utiliser gratuitement', 'Modifier et adapter', 'Utiliser commercialement', 'Redistribuer', "Pas besoin de citer l'auteur"]
        : ['Use for free', 'Modify and adapt', 'Use commercially', 'Redistribute', 'No need to credit the author'],
      nePeutPasFaire: [] as string[],
      url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    {
      code: 'CC BY', nom: 'Attribution',
      badge: 'badge-gold', couleur: 'text-faso-gold', bg: 'bg-faso-gold/10', border: 'border-faso-gold/20', emoji: '🟡',
      description: locale === 'fr'
        ? "Vous pouvez utiliser, modifier et distribuer l'image — même commercialement — à condition de citer l'auteur original. C'est la licence recommandée sur BurkinaVista."
        : "You can use, modify and distribute the image — even commercially — as long as you credit the original author. This is the recommended license on BurkinaVista.",
      peutFaire: locale === 'fr'
        ? ['Utiliser gratuitement', 'Modifier et adapter', 'Utiliser commercialement', 'Redistribuer']
        : ['Use for free', 'Modify and adapt', 'Use commercially', 'Redistribute'],
      nePeutPasFaire: locale === 'fr'
        ? ["Utiliser sans citer l'auteur"]
        : ['Use without crediting the author'],
      url: 'https://creativecommons.org/licenses/by/4.0/',
    },
    {
      code: 'CC BY-SA', nom: locale === 'fr' ? 'Attribution — Partage dans les mêmes conditions' : 'Attribution — ShareAlike',
      badge: 'badge-gold', couleur: 'text-faso-gold', bg: 'bg-faso-gold/10', border: 'border-faso-gold/20', emoji: '🟡',
      description: locale === 'fr'
        ? "Vous pouvez utiliser et modifier l'image, même commercialement, à condition de citer l'auteur ET de redistribuer vos créations sous la même licence."
        : "You can use and modify the image, even commercially, as long as you credit the author AND redistribute your creations under the same license.",
      peutFaire: locale === 'fr'
        ? ['Utiliser gratuitement', 'Modifier et adapter', 'Utiliser commercialement']
        : ['Use for free', 'Modify and adapt', 'Use commercially'],
      nePeutPasFaire: locale === 'fr'
        ? ["Utiliser sans citer l'auteur", 'Redistribuer sous une licence plus restrictive']
        : ['Use without crediting the author', 'Redistribute under a more restrictive license'],
      url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    {
      code: 'CC BY-NC', nom: locale === 'fr' ? "Attribution — Pas d'utilisation commerciale" : 'Attribution — NonCommercial',
      badge: 'badge-red', couleur: 'text-faso-red', bg: 'bg-faso-red/10', border: 'border-faso-red/20', emoji: '🔴',
      description: locale === 'fr'
        ? "Vous pouvez utiliser et modifier l'image gratuitement à des fins non commerciales, à condition de citer l'auteur. Les usages commerciaux sont interdits."
        : "You can use and modify the image for free for non-commercial purposes, as long as you credit the author. Commercial uses are prohibited.",
      peutFaire: locale === 'fr'
        ? ['Utiliser gratuitement (non commercial)', 'Modifier et adapter', 'Redistribuer (non commercial)']
        : ['Use for free (non-commercial)', 'Modify and adapt', 'Redistribute (non-commercial)'],
      nePeutPasFaire: locale === 'fr'
        ? ['Utiliser à des fins commerciales', "Utiliser sans citer l'auteur"]
        : ['Use for commercial purposes', 'Use without crediting the author'],
      url: 'https://creativecommons.org/licenses/by-nc/4.0/',
    },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 page-enter">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 badge badge-gold mb-6">
            {t('badge')}
          </div>
          <h1 className="font-display text-5xl text-white mb-4 animate-fade-in">
            {t('title')}{' '}
            <span className="text-gradient-gold">{t('title_gradient')}</span>
          </h1>
          <div className="faso-divider w-24 mx-auto mb-6" />
          <p className="text-white/50 max-w-xl mx-auto leading-relaxed">{t('subtitle')}</p>
        </div>

        {/* Intro CC */}
        <div className="card p-6 border border-faso-gold/10 mb-12 flex items-start gap-4 animate-fade-in-up">
          <Info size={20} className="text-faso-gold flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-medium text-white mb-2">
              {locale === 'fr' ? "Qu'est-ce que Creative Commons ?" : 'What is Creative Commons?'}
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              {locale === 'fr'
                ? "Creative Commons (CC) est une organisation à but non lucratif qui propose des licences standardisées permettant aux créateurs de partager leurs œuvres légalement."
                : "Creative Commons (CC) is a non-profit organization that offers standardized licenses allowing creators to legally share their works."}{' '}
              <a href="https://creativecommons.org/licenses/" target="_blank" rel="noopener noreferrer" className="text-faso-gold hover:underline inline-flex items-center gap-1">
                {locale === 'fr' ? 'En savoir plus' : 'Learn more'} <ExternalLink size={12} />
              </a>
            </p>
          </div>
        </div>

        {/* Les 4 licences */}
        <section className="mb-16">
          <h2 className="font-display text-2xl text-white mb-8 text-center">
            {locale === 'fr' ? 'Les licences disponibles sur BurkinaVista' : 'Available licenses on BurkinaVista'}
          </h2>
          <div className="space-y-6">
            {licences.map((lic) => (
              <div key={lic.code} className={`card p-6 border ${lic.border} animate-fade-in-up`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`font-display text-2xl font-bold ${lic.couleur}`}>{lic.code}</span>
                      <span className={`badge ${lic.badge} text-xs`}>{lic.emoji}</span>
                    </div>
                    <p className="text-white/60 text-sm">{lic.nom}</p>
                  </div>
                  <a href={lic.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-1 text-xs text-white/30 hover:text-faso-gold transition-colors">
                    {locale === 'fr' ? 'Texte légal' : 'Legal text'} <ExternalLink size={11} />
                  </a>
                </div>
                <p className="text-white/50 text-sm leading-relaxed mb-5">{lic.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/30 uppercase tracking-wider mb-3">✅ {locale === 'fr' ? 'Autorisé' : 'Allowed'}</p>
                    <ul className="space-y-2">
                      {lic.peutFaire.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                          <CheckCircle size={14} className="text-faso-green flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {lic.nePeutPasFaire.length > 0 && (
                    <div>
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-3">❌ {locale === 'fr' ? 'Interdit' : 'Prohibited'}</p>
                      <ul className="space-y-2">
                        {lic.nePeutPasFaire.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                            <XCircle size={14} className="text-faso-red flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comment citer */}
        <section className="mb-16">
          <h2 className="font-display text-2xl text-white mb-6">
            {locale === 'fr' ? 'Comment citer correctement un auteur' : 'How to properly credit an author'}
          </h2>
          <div className="card p-6 border border-faso-gold/10">
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              {locale === 'fr'
                ? "Lorsque la licence exige une attribution (CC BY, CC BY-SA, CC BY-NC), voici le format recommandé :"
                : "When the license requires attribution (CC BY, CC BY-SA, CC BY-NC), here is the recommended format:"}
            </p>
            <div className="bg-white/5 rounded-xl p-4 font-mono text-sm text-white/70 mb-5">
              {locale === 'fr' ? 'Photo' : 'Photo'}: <span className="text-faso-gold">[{locale === 'fr' ? "Prénom Nom de l'auteur" : "Author's First Last Name"}]</span> /{' '}
              <span className="text-faso-green">BurkinaVista</span> —
              {locale === 'fr' ? ' Licence' : ' License'} <span className="text-faso-red">[CC BY / CC0 / ...]</span>
            </div>
            <p className="text-white/30 text-xs">
              {locale === 'fr' ? 'Exemple' : 'Example'}: Photo: Amadou Konaté / BurkinaVista — {locale === 'fr' ? 'Licence' : 'License'} CC BY 4.0
            </p>
          </div>
        </section>

        {/* Avertissement */}
        <div className="card p-6 border border-yellow-500/20 bg-yellow-500/5 mb-12">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-2">
                {locale === 'fr' ? 'Important à savoir' : 'Important to know'}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                {locale === 'fr'
                  ? "BurkinaVista n'est pas responsable d'une mauvaise utilisation des médias par les utilisateurs. Il vous appartient de vérifier la licence de chaque image avant utilisation."
                  : "BurkinaVista is not responsible for users misusing media. It is your responsibility to verify each image's license before use."}
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <p className="text-white/40 text-sm mb-3">{t('question')}</p>
          <a href="mailto:BurkinaVista@gmail.com" className="inline-flex items-center gap-2 text-faso-gold hover:text-faso-gold/80 transition-colors font-medium mb-4">
            <Mail size={16} />
            {t('email_contact')}
          </a>
          <div className="mt-3">
            <Link href="/contact" className="btn-ghost text-sm py-2 px-5">
              {t('contact_label')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
