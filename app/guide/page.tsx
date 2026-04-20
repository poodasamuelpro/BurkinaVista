/**
 * app/guide/page.tsx — Guide du contributeur bilingue FR/EN
 */
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import {
  Camera, Upload, CheckCircle, XCircle, Lightbulb,
  Image, Video, MapPin, Tag, FileText, Clock, Star,
  AlertTriangle, ArrowRight, Smartphone
} from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'guide' })
  return {
    title: t('seo_title'),
    description: t('seo_desc'),
    alternates: { canonical: 'https://burkina-vista.vercel.app/guide' },
  }
}

export default async function GuidePage() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'guide' })

  const etapes = locale === 'fr' ? [
    { num: '01', titre: 'Préparez votre fichier', icon: Camera, contenu: ['Photos : JPG, PNG ou WebP — minimum 1200px de large recommandé', 'Vidéos : MP4, MOV ou WebM — maximum 100 MB par fichier', 'Vérifiez que la qualité est bonne (image nette, bien éclairée)', 'Vous pouvez soumettre plusieurs fichiers en une seule fois'] },
    { num: '02', titre: 'Rendez-vous sur la page Contribuer', icon: Upload, contenu: ["Pas besoin de créer un compte — le formulaire est accessible à tous", "Glissez-déposez vos fichiers ou cliquez pour les sélectionner", "La prévisualisation s'affiche instantanément"] },
    { num: '03', titre: 'Renseignez vos informations', icon: FileText, contenu: ['Prénom, Nom et Email sont obligatoires pour créditer votre œuvre', "Le téléphone est optionnel", 'Ces infos ne sont jamais affichées publiquement'] },
    { num: '04', titre: 'Décrivez votre média', icon: Tag, contenu: ["Titre : court, descriptif — l'IA peut l'améliorer", 'Description : racontez ce que montre votre photo/vidéo', 'Ville et région : très important pour le référencement géographique', 'Catégorie : choisissez celle qui correspond le mieux'] },
    { num: '05', titre: 'Choisissez votre licence', icon: CheckCircle, contenu: ["CC BY (recommandé) : libre d'utilisation avec citation de votre nom", 'CC0 : totalement libre, sans obligation de citation', "CC BY-NC : libre mais pas d'usage commercial", 'CC BY-SA : libre avec partage dans les mêmes conditions'] },
    { num: '06', titre: 'Soumettez et attendez la validation', icon: Clock, contenu: ['Vous recevez un email de confirmation immédiatement', 'Notre équipe examine votre contribution sous 24 à 48h', 'En cas de refus, vous recevez un email explicatif', "En cas d'approbation, votre média est publié et référencé sur Google"] },
  ] : [
    { num: '01', titre: 'Prepare your file', icon: Camera, contenu: ['Photos: JPG, PNG or WebP — minimum 1200px wide recommended', 'Videos: MP4, MOV or WebM — maximum 100 MB per file', 'Check quality is good (sharp, well-lit image)', 'You can submit multiple files at once'] },
    { num: '02', titre: 'Go to the Contribute page', icon: Upload, contenu: ['No account needed — the form is accessible to all', 'Drag and drop your files or click to select', 'Preview displays instantly'] },
    { num: '03', titre: 'Fill in your information', icon: FileText, contenu: ['First name, Last name and Email are required to credit your work', 'Phone is optional', 'This info is never displayed publicly'] },
    { num: '04', titre: 'Describe your media', icon: Tag, contenu: ['Title: short, descriptive — AI can improve it', 'Description: tell what your photo/video shows', 'City and region: very important for geographic search ranking', 'Category: choose the most appropriate one'] },
    { num: '05', titre: 'Choose your license', icon: CheckCircle, contenu: ['CC BY (recommended): free to use with credit to your name', 'CC0: completely free, no attribution required', 'CC BY-NC: free but no commercial use', 'CC BY-SA: free with same-license sharing'] },
    { num: '06', titre: 'Submit and wait for validation', icon: Clock, contenu: ['You receive a confirmation email immediately', 'Our team reviews your contribution within 24 to 48h', 'If rejected, you receive an explanatory email', 'If approved, your media is published and indexed on Google'] },
  ]

  const contenusAcceptes = locale === 'fr' ? [
    'Paysages, nature et environnement du Burkina Faso',
    'Architecture, bâtiments, monuments et lieux remarquables',
    'Marchés, commerces et scènes de vie quotidienne',
    'Festivals, événements culturels (FESPACO, SIAO, etc.)',
    'Art, artisanat et expressions culturelles burkinabè',
    'Sport et activités physiques',
    'Gastronomie et cuisine traditionnelle',
    'Portraits avec consentement des personnes représentées',
    'Infrastructure, développement et modernité du pays',
    'Faune et flore locales',
  ] : [
    'Landscapes, nature and environment of Burkina Faso',
    'Architecture, buildings, monuments and notable places',
    'Markets, commerce and everyday life scenes',
    'Festivals, cultural events (FESPACO, SIAO, etc.)',
    'Art, crafts and Burkinabè cultural expressions',
    'Sports and physical activities',
    'Gastronomy and traditional cuisine',
    'Portraits with consent of depicted persons',
    'Infrastructure, development and modernity of the country',
    'Local fauna and flora',
  ]

  const contenusRefuses = locale === 'fr' ? [
    "Images dont vous n'êtes pas l'auteur ou pour lesquelles vous n'avez pas les droits",
    'Contenu à caractère sexuel, pornographique ou suggestif',
    'Images portant atteinte à la dignité ou à la vie privée des personnes',
    "Contenu incitant à la haine, à la discrimination ou à la violence",
    'Images montrant des personnes sans leur consentement apparent',
    'Contenu trompeur, modifié numériquement de manière trompeuse',
    'Images trop floues, sous-exposées ou de mauvaise qualité technique',
    'Contenu sans rapport avec le Burkina Faso',
    'Doublons — images déjà soumises sur la plateforme',
  ] : [
    "Images you don't own or don't have rights to",
    'Sexual, pornographic or suggestive content',
    'Images infringing on dignity or privacy of persons',
    'Content inciting hatred, discrimination or violence',
    'Images showing persons without apparent consent',
    'Misleading, digitally manipulated content',
    'Too blurry, underexposed or poor quality images',
    'Content unrelated to Burkina Faso',
    'Duplicates — images already submitted to the platform',
  ]

  const conseils = locale === 'fr' ? [
    { icon: Lightbulb, titre: 'Lumière naturelle', desc: 'Privilégiez la lumière naturelle, surtout en début ou fin de journée.' },
    { icon: Camera, titre: 'Stabilité', desc: 'Tenez votre appareil ou smartphone à deux mains. Pour les vidéos, utilisez un trépied.' },
    { icon: Image, titre: 'Composition', desc: "Appliquez la règle des tiers : placez votre sujet principal sur les lignes ou intersections." },
    { icon: MapPin, titre: 'Contexte', desc: "Montrez l'environnement, pas juste un détail isolé. Le spectateur doit comprendre où il se trouve." },
    { icon: Star, titre: 'Authenticité', desc: 'Capturez des moments naturels et vrais. Les photos posées sont moins impactantes.' },
    { icon: Smartphone, titre: 'Résolution', desc: "Photographiez toujours en haute résolution. Sur smartphone, désactivez la compression." },
  ] : [
    { icon: Lightbulb, titre: 'Natural light', desc: 'Prefer natural light, especially early morning or late afternoon.' },
    { icon: Camera, titre: 'Stability', desc: 'Hold your device with both hands. For videos, use a tripod.' },
    { icon: Image, titre: 'Composition', desc: 'Apply the rule of thirds: place your main subject on the lines or intersections.' },
    { icon: MapPin, titre: 'Context', desc: 'Show the environment, not just an isolated detail. The viewer should understand where they are.' },
    { icon: Star, titre: 'Authenticity', desc: 'Capture natural, real moments. Posed photos are less impactful.' },
    { icon: Smartphone, titre: 'Resolution', desc: 'Always photograph in high resolution. On smartphone, disable compression in camera settings.' },
  ]

  const faq = locale === 'fr' ? [
    { q: 'Puis-je soumettre des photos prises il y a plusieurs années ?', r: "Oui, l'ancienneté des photos n'est pas un critère de refus. Ce qui compte c'est qu'elles soient authentiques, de bonne qualité et représentatives du Burkina Faso." },
    { q: 'Combien de photos puis-je soumettre ?', r: "Il n'y a pas de limite. Vous pouvez soumettre plusieurs photos en une seule session via notre formulaire multi-fichiers." },
    { q: 'Puis-je soumettre des photos de personnes ?', r: "Oui, mais vous devez vous assurer que les personnes représentées ont donné leur consentement à la publication de leur image." },
    { q: 'Ma photo a été refusée. Que faire ?', r: "Vous recevrez un email expliquant la raison du refus. Selon le motif, vous pourrez parfois recorriger et resoumettre." },
    { q: 'Est-ce que je serai payé pour mes contributions ?', r: "Non. BurkinaVista est un projet communautaire sans but lucratif. En échange, votre nom est crédité sur chaque usage de votre photo." },
  ] : [
    { q: 'Can I submit photos taken years ago?', r: "Yes, photo age is not a rejection criterion. What matters is that they are authentic, good quality and representative of Burkina Faso." },
    { q: 'How many photos can I submit?', r: "There is no limit. You can submit multiple photos in one session via our multi-file form." },
    { q: 'Can I submit photos of people?', r: "Yes, but you must ensure that depicted persons have given consent to the publication of their image." },
    { q: 'My photo was rejected. What should I do?', r: "You will receive an email explaining the reason for rejection. Depending on the reason, you may be able to correct and resubmit." },
    { q: 'Will I be paid for my contributions?', r: "No. BurkinaVista is a non-profit community project. In return, your name is credited on every use of your photo." },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 page-enter">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 badge badge-gold mb-6">
            <Camera size={14} />
            {t('badge')}
          </div>
          <h1 className="font-display text-5xl text-white mb-4 animate-fade-in">
            {t('title')}{' '}
            <span className="text-gradient-faso">{t('title_gradient')}</span>
          </h1>
          <div className="faso-divider w-24 mx-auto mb-6" />
          <p className="text-white/50 max-w-xl mx-auto leading-relaxed">{t('subtitle')}</p>
        </div>

        {/* CTA rapide */}
        <div className="card p-6 border border-faso-gold/20 bg-faso-gold/5 mb-16 flex flex-col sm:flex-row items-center gap-4 justify-between animate-fade-in-up">
          <div>
            <p className="font-medium text-white">{t('cta_ready')}</p>
            <p className="text-white/40 text-sm">{t('cta_no_account')}</p>
          </div>
          <Link href="/upload" className="btn-gold flex-shrink-0">
            <Upload size={16} />
            {t('cta_start')}
          </Link>
        </div>

        {/* Étapes */}
        <section className="mb-16">
          <h2 className="font-display text-3xl text-white mb-8 text-center">{t('steps_title')}</h2>
          <div className="space-y-4">
            {etapes.map(({ num, titre, icon: Icon, contenu }, i) => (
              <div key={num} className={`card p-6 flex items-start gap-5 animate-fade-in-up animate-delay-${i * 100}`}>
                <div className="flex-shrink-0">
                  <span className="font-display text-3xl font-bold text-faso-gold/30">{num}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={18} className="text-faso-gold" />
                    <h3 className="font-display text-lg text-white">{titre}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {contenu.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-white/50">
                        <ArrowRight size={13} className="text-faso-gold/50 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contenus acceptés / refusés */}
        <section className="mb-16">
          <h2 className="font-display text-3xl text-white mb-8 text-center">{t('what_to_submit')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 border border-faso-green/20">
              <h3 className="font-medium text-faso-green flex items-center gap-2 mb-4">
                <CheckCircle size={18} />
                {t('accepted_title')}
              </h3>
              <ul className="space-y-2">
                {contenusAcceptes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                    <CheckCircle size={13} className="text-faso-green flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-6 border border-faso-red/20">
              <h3 className="font-medium text-faso-red flex items-center gap-2 mb-4">
                <XCircle size={18} />
                {t('refused_title')}
              </h3>
              <ul className="space-y-2">
                {contenusRefuses.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                    <XCircle size={13} className="text-faso-red flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Conseils qualité */}
        <section className="mb-16">
          <h2 className="font-display text-3xl text-white mb-8 text-center">{t('quality_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conseils.map(({ icon: Icon, titre, desc }) => (
              <div key={titre} className="card p-5 animate-fade-in-up">
                <div className="w-9 h-9 rounded-xl bg-faso-gold/10 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-faso-gold" />
                </div>
                <h3 className="font-medium text-white mb-2 text-sm">{titre}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Avertissement droits */}
        <div className="card p-6 border border-yellow-500/20 bg-yellow-500/5 mb-16">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-2">{t('copyright_warning_title')}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{t('copyright_warning')}</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="font-display text-3xl text-white mb-8 text-center">{t('faq_title')}</h2>
          <div className="space-y-3">
            {faq.map(({ q, r }) => (
              <details key={q} className="card p-6 group cursor-pointer">
                <summary className="font-medium text-white list-none flex items-center justify-between gap-4">
                  {q}
                  <ArrowRight size={16} className="text-white/30 flex-shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="text-white/50 text-sm leading-relaxed mt-4 pt-4 border-t border-white/5">{r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <div className="text-center">
          <div className="card p-10 border border-faso-gold/20 bg-faso-gold/5">
            <Camera size={40} className="text-faso-gold mx-auto mb-4 animate-float" />
            <h2 className="font-display text-3xl text-white mb-4">{t('final_title')}</h2>
            <p className="text-white/50 max-w-md mx-auto mb-8">{t('final_desc')}</p>
            <Link href="/upload" className="btn-gold">
              <Upload size={18} />
              {t('cta_final')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
