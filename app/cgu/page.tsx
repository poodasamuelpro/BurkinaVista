/**
 * app/cgu/page.tsx — Conditions Générales d'Utilisation bilingue FR/EN
 */
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { FileText, AlertTriangle, Mail } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'cgu' })
  return {
    title: t('seo_title'),
    description: t('seo_desc'),
    robots: { index: true, follow: false },
    alternates: { canonical: 'https://burkina-vista.vercel.app/cgu' },
  }
}

export default async function CGUPage() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'cgu' })

  const dateMAJ = new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const sections = locale === 'fr' ? [
    { id: 'objet', titre: "1. Objet et champ d'application", contenu: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme BurkinaVista, accessible à l'adresse burkina-vista.vercel.app.\n\nBurkinaVista est une bibliothèque visuelle libre dédiée au Burkina Faso, permettant à toute personne de consulter, télécharger et contribuer des photos et vidéos authentiques du pays, sous licences Creative Commons.\n\nEn accédant à BurkinaVista, vous acceptez sans réserve les présentes CGU.` },
    { id: 'acces', titre: '2. Accès à la plateforme', contenu: "L'accès à BurkinaVista est libre et gratuit pour tout utilisateur disposant d'un accès à Internet. Aucune inscription n'est requise pour consulter et télécharger les médias.\n\nLa contribution de photos ou vidéos est accessible sans création de compte. L'utilisateur fournit son nom, prénom et adresse email lors de la soumission d'un média.\n\nBurkinaVista se réserve le droit de suspendre ou d'interrompre l'accès à tout ou partie de la plateforme pour des raisons de maintenance ou de sécurité." },
    { id: 'contributions', titre: '3. Contributions et droits des auteurs', contenu: "3.1 En soumettant un média, vous déclarez :\n• Être l'auteur original de l'œuvre soumise\n• Que l'œuvre ne porte pas atteinte aux droits de tiers\n• Que les personnes représentées ont donné leur consentement\n\n3.2 Vous accordez à BurkinaVista une licence mondiale, non exclusive, gratuite et perpétuelle pour héberger et distribuer votre œuvre.\n\n3.3 Toute contribution est soumise à modération avant publication." },
    { id: 'utilisation', titre: '4. Utilisation des médias', contenu: "Les médias disponibles sur BurkinaVista sont soumis aux licences Creative Commons choisies par leurs auteurs. En téléchargeant un média, vous vous engagez à respecter les conditions de la licence applicable.\n\nTout usage commercial d'un média soumis sous licence CC BY-NC est strictement interdit." },
    { id: 'interdits', titre: '5. Contenus et comportements interdits', contenu: "Il est strictement interdit sur BurkinaVista de :\n• Soumettre des contenus à caractère pornographique ou sexuellement explicite\n• Publier des contenus incitant à la haine ou à la violence\n• Soumettre des images portant atteinte à la dignité des personnes\n• Publier des contenus dont vous n'êtes pas l'auteur sans autorisation\n• Tenter de contourner les mesures de sécurité de la plateforme\n• Utiliser des robots ou systèmes automatisés pour extraire massivement les données" },
    { id: 'donnees', titre: '6. Données personnelles', contenu: "BurkinaVista collecte et traite les données personnelles que vous fournissez lors de la contribution d'un média ou de l'abonnement à la newsletter.\n\nVos données ne sont jamais vendues ni cédées à des tiers à des fins commerciales.\n\nPour plus d'informations, consultez notre Politique de Confidentialité ou écrivez-nous à BurkinaVista@gmail.com." },
    { id: 'responsabilite', titre: '7. Limitation de responsabilité', contenu: `BurkinaVista est fourni "en l'état", sans garantie d'aucune sorte. Nous ne garantissons pas la disponibilité permanente de la plateforme.\n\nBurkinaVista ne saurait être tenu responsable des contenus publiés par les contributeurs ou de la violation des licences CC par les utilisateurs.` },
    { id: 'modification', titre: '8. Modification des CGU', contenu: "BurkinaVista se réserve le droit de modifier les présentes CGU à tout moment. Votre utilisation continue de BurkinaVista après la modification vaut acceptation des nouvelles conditions." },
    { id: 'droit', titre: '9. Droit applicable et juridiction', contenu: "Les présentes CGU sont régies par le droit burkinabè. En cas de litige, nous privilégions une résolution amiable. Contactez-nous à BurkinaVista@gmail.com avant toute action en justice." },
  ] : [
    { id: 'objet', titre: '1. Purpose and scope', contenu: "These Terms of Use govern access to and use of the BurkinaVista platform, accessible at burkina-vista.vercel.app.\n\nBurkinaVista is a free visual library dedicated to Burkina Faso, allowing anyone to browse, download and contribute authentic photos and videos under Creative Commons licenses.\n\nBy accessing BurkinaVista, you unconditionally accept these Terms." },
    { id: 'acces', titre: '2. Platform access', contenu: "Access to BurkinaVista is free for any user with internet access. No registration is required to browse and download media.\n\nContributing photos or videos does not require account creation. Users provide their name and email when submitting media.\n\nBurkinaVista reserves the right to suspend or interrupt access to the platform for maintenance or security reasons." },
    { id: 'contributions', titre: '3. Contributions and author rights', contenu: "3.1 By submitting media, you declare:\n• Being the original author of the submitted work\n• That the work does not infringe on third-party rights\n• That depicted persons have given their consent\n\n3.2 You grant BurkinaVista a worldwide, non-exclusive, free and perpetual license to host and distribute your work.\n\n3.3 All contributions are subject to moderation before publication." },
    { id: 'utilisation', titre: '4. Use of media', contenu: "Media on BurkinaVista is subject to the Creative Commons licenses chosen by their authors. By downloading media, you commit to respecting the applicable license.\n\nAny commercial use of media submitted under CC BY-NC license is strictly prohibited." },
    { id: 'interdits', titre: '5. Prohibited content and behavior', contenu: "It is strictly forbidden on BurkinaVista to:\n• Submit pornographic or sexually explicit content\n• Publish content inciting hatred or violence\n• Submit images that infringe on people's dignity\n• Publish content you don't have rights to\n• Attempt to bypass the platform's security measures\n• Use automated systems to mass-extract data" },
    { id: 'donnees', titre: '6. Personal data', contenu: "BurkinaVista collects personal data provided during media contributions or newsletter subscriptions.\n\nYour data is never sold or shared with third parties for commercial purposes.\n\nFor more information, see our Privacy Policy or email us at BurkinaVista@gmail.com." },
    { id: 'responsabilite', titre: '7. Limitation of liability', contenu: `BurkinaVista is provided "as is" without any warranty. We do not guarantee uninterrupted availability.\n\nBurkinaVista cannot be held liable for content published by contributors or license violations by users.` },
    { id: 'modification', titre: '8. Modification of Terms', contenu: "BurkinaVista reserves the right to modify these Terms at any time. Your continued use of BurkinaVista after modification constitutes acceptance of the new terms." },
    { id: 'droit', titre: '9. Applicable law and jurisdiction', contenu: "These Terms are governed by Burkinabè law. In case of dispute, we favor amicable resolution. Contact us at BurkinaVista@gmail.com before any legal action." },
  ]

  const summaryItems = locale === 'fr' ? [
    { emoji: '✅', text: "L'accès et le téléchargement sont gratuits et sans inscription" },
    { emoji: '✅', text: 'Vous pouvez contribuer sans créer de compte' },
    { emoji: '✅', text: 'Chaque image peut être utilisée selon sa licence CC' },
    { emoji: '❌', text: "Ne soumettez pas d'images dont vous n'êtes pas l'auteur" },
    { emoji: '❌', text: 'Pas de contenu illicite, offensant ou portant atteinte à la dignité' },
    { emoji: '❌', text: 'Respectez la licence de chaque image lors de son utilisation' },
  ] : [
    { emoji: '✅', text: 'Access and downloads are free without registration' },
    { emoji: '✅', text: 'You can contribute without creating an account' },
    { emoji: '✅', text: 'Each image can be used according to its CC license' },
    { emoji: '❌', text: "Don't submit images you don't have rights to" },
    { emoji: '❌', text: 'No illegal, offensive or dignity-infringing content' },
    { emoji: '❌', text: 'Respect each image\'s license when using it' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 page-enter">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 badge badge-gray mb-6">
            <FileText size={14} />
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

        {/* Résumé rapide */}
        <div className="card p-6 border border-faso-gold/10 mb-10 animate-fade-in-up">
          <h2 className="font-medium text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-faso-gold" />
            {t('summary_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summaryItems.map(({ emoji, text }) => (
              <div key={text} className="flex items-start gap-2 text-sm text-white/50">
                <span className="flex-shrink-0">{emoji}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Table des matières */}
        <nav className="card p-5 mb-10">
          <p className="text-xs text-white/30 uppercase tracking-wider mb-3">{t('toc')}</p>
          <ul className="space-y-1">
            {sections.map(({ id, titre }) => (
              <li key={id}>
                <a href={`#${id}`} className="text-sm text-white/50 hover:text-faso-gold transition-colors">
                  {titre}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map(({ id, titre, contenu }) => (
            <section key={id} id={id} className="scroll-mt-24">
              <h2 className="font-display text-xl text-white mb-4">{titre}</h2>
              <div className="card p-6">
                <div className="text-white/50 text-sm leading-relaxed whitespace-pre-line">
                  {contenu}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 card p-6 border border-white/10 text-center">
          <Mail size={24} className="text-faso-gold mx-auto mb-3" />
          <h3 className="font-medium text-white mb-2">{t('question_title')}</h3>
          <p className="text-white/40 text-sm mb-3">{t('question_desc')}</p>
          <a
            href="mailto:BurkinaVista@gmail.com"
            className="inline-flex items-center gap-2 text-faso-gold hover:text-faso-gold/80 transition-colors font-medium mb-4"
          >
            <Mail size={14} />
            {t('email_contact')}
          </a>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-3">
            <Link href="/contact" className="btn-ghost text-sm py-2 px-5">
              {t('cta_contact')}
            </Link>
            <Link href="/confidentialite" className="btn-ghost text-sm py-2 px-5">
              {t('cta_privacy')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
