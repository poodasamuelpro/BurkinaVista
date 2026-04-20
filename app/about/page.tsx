/**
 * app/about/page.tsx — Page À propos bilingue FR/EN
 */
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Upload, Globe, Shield, Heart, Camera, Users, Star, ArrowRight, Mail } from 'lucide-react'
import FasoLogo from '@/components/ui/FasoLogo'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: t('seo_title'),
    description: t('seo_desc'),
    openGraph: {
      title: t('seo_title'),
      description: t('seo_desc'),
      url: 'https://burkina-vista.vercel.app/about',
    },
    alternates: {
      canonical: 'https://burkina-vista.vercel.app/about',
    },
  }
}

export default async function AboutPage() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'about' })

  const valeurs = [
    {
      icon: Camera,
      titre: locale === 'fr' ? 'Authenticité' : 'Authenticity',
      couleur: 'text-faso-red',
      bg: 'bg-faso-red/10',
      description: locale === 'fr'
        ? "Nous ne publions que des images réelles du Burkina Faso, prises par des personnes qui connaissent et vivent le pays. Pas de clichés misérabilistes, pas d'exotisme de façade — juste la réalité telle qu'elle est."
        : "We only publish real images of Burkina Faso, taken by people who know and live in the country. No misery shots, no surface exoticism — just reality as it is.",
    },
    {
      icon: Globe,
      titre: locale === 'fr' ? 'Accessibilité' : 'Accessibility',
      couleur: 'text-faso-gold',
      bg: 'bg-faso-gold/10',
      description: locale === 'fr'
        ? "Toutes nos photos et vidéos sont libres de droits, sous licences Creative Commons. Journalistes, designers, chercheurs, enseignants — tout le monde peut utiliser ces ressources sans frais."
        : "All our photos and videos are free to use, under Creative Commons licenses. Journalists, designers, researchers, teachers — everyone can use these resources at no cost.",
    },
    {
      icon: Users,
      titre: locale === 'fr' ? 'Communauté' : 'Community',
      couleur: 'text-faso-green',
      bg: 'bg-faso-green/10',
      description: locale === 'fr'
        ? "BurkinaVista est construit par et pour les Burkinabè. Chaque contributeur — photographe amateur ou professionnel — enrichit notre patrimoine visuel collectif."
        : "BurkinaVista is built by and for Burkinabè. Every contributor — amateur or professional photographer — enriches our collective visual heritage.",
    },
    {
      icon: Shield,
      titre: locale === 'fr' ? 'Transparence' : 'Transparency',
      couleur: 'text-blue-400',
      bg: 'bg-blue-400/10',
      description: locale === 'fr'
        ? "Chaque image est vérifiée avant publication. Nous indiquons clairement l'auteur, la licence applicable et les conditions d'utilisation de chaque média."
        : "Each image is verified before publication. We clearly indicate the author, applicable license and conditions of use for each media.",
    },
  ]

  const chiffres = [
    { valeur: '10+', label: locale === 'fr' ? 'Catégories' : 'Categories', icon: Star },
    { valeur: '13', label: locale === 'fr' ? 'Régions couvertes' : 'Regions covered', icon: Globe },
    { valeur: 'CC', label: locale === 'fr' ? 'Licences libres' : 'Free licenses', icon: Shield },
    { valeur: '100%', label: locale === 'fr' ? 'Gratuit' : 'Free', icon: Heart },
  ]

  const steps = locale === 'fr' ? [
    { step: '01', titre: 'Vous prenez une photo ou une vidéo', desc: "N'importe où au Burkina Faso — une rue, un marché, un monument, un festival, un plat, un paysage. Tout ce qui montre la vraie vie du pays." },
    { step: '02', titre: 'Vous la soumettez sur BurkinaVista', desc: "Via notre formulaire simple — pas besoin de créer un compte. Vous renseignez votre nom, email, une description et quelques infos sur le lieu." },
    { step: '03', titre: 'Notre IA optimise le référencement', desc: "Gemini AI analyse votre image et génère automatiquement un titre SEO, une description détaillée et des tags en français et en anglais." },
    { step: '04', titre: 'Notre équipe valide', desc: "Chaque média est vérifié sous 48h par notre équipe de modération." },
    { step: '05', titre: 'Le monde entier peut voir le vrai Burkina', desc: "Une fois publié, votre média est référencé sur Google Images et diffusé à notre communauté." },
  ] : [
    { step: '01', titre: 'You take a photo or video', desc: 'Anywhere in Burkina Faso — a street, a market, a monument, a festival, a dish, a landscape. Anything that shows the real life of the country.' },
    { step: '02', titre: 'You submit it on BurkinaVista', desc: 'Via our simple form — no need to create an account. Enter your name, email, a description and some info about the location.' },
    { step: '03', titre: 'Our AI optimizes the SEO', desc: 'Gemini AI analyzes your image and automatically generates an SEO title, a detailed description and tags in both French and English.' },
    { step: '04', titre: 'Our team validates', desc: 'Each media is reviewed within 48h by our moderation team.' },
    { step: '05', titre: 'The world sees the real Burkina', desc: "Once published, your media is indexed on Google Images and shared with our community. Your name is credited on each use." },
  ]

  const faq = locale === 'fr' ? [
    { question: 'Qui peut contribuer ?', reponse: "Tout le monde peut contribuer — photographes amateurs ou professionnels, burkinabè de la diaspora ou résidents. Pas besoin de créer un compte." },
    { question: 'Comment les photos sont-elles vérifiées ?', reponse: "Chaque média soumis est examiné par notre équipe de modération avant publication." },
    { question: 'Pourquoi utiliser des licences Creative Commons ?', reponse: "Les licences CC permettent un partage légal et clair. Elles protègent les auteurs tout en permettant la diffusion maximale des images." },
    { question: 'BurkinaVista est-il gratuit ?', reponse: "Oui, totalement. La consultation, la recherche et le téléchargement sont gratuits pour tous." },
    { question: 'Comment puis-je signaler un problème ?', reponse: t('faq_contact') },
    { question: "Puis-je utiliser les images à des fins commerciales ?", reponse: "Ça dépend de la licence choisie par le contributeur. La licence est clairement indiquée sur chaque page média." },
  ] : [
    { question: 'Who can contribute?', reponse: 'Anyone can contribute — amateur or professional photographers, Burkinabè from the diaspora or residents. No account creation needed.' },
    { question: 'How are photos verified?', reponse: 'Every submitted media is reviewed by our moderation team before publication.' },
    { question: 'Why use Creative Commons licenses?', reponse: 'CC licenses allow legal and clear sharing. They protect authors while allowing maximum distribution of images.' },
    { question: 'Is BurkinaVista free?', reponse: 'Yes, completely. Browsing, searching and downloading are free for everyone.' },
    { question: 'How can I report an issue?', reponse: t('faq_contact') },
    { question: 'Can I use images for commercial purposes?', reponse: "It depends on the license chosen by the contributor. The license is clearly indicated on each media page." },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 page-enter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-8 animate-fade-in">
            <FasoLogo size={56} showName={false} />
          </div>
          <div className="inline-flex items-center gap-2 badge badge-gold mb-6 animate-fade-in animate-delay-100">
            {t('badge')}
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-6 leading-tight animate-fade-in animate-delay-200">
            {t('title')}{' '}
            <span className="text-gradient-faso">{t('title_gradient')}</span>
          </h1>
          <div className="faso-divider w-32 mx-auto mb-8" />
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed animate-fade-in animate-delay-300">
            {t('intro')}
          </p>
        </div>

        {/* Notre mission */}
        <section className="mb-20">
          <div className="card p-8 md:p-12 border border-faso-gold/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="badge badge-gold mb-4 inline-block">{t('mission_badge')}</span>
                <h2 className="font-display text-3xl text-white mb-5">
                  {t('mission_title')}
                </h2>
                <p className="text-white/60 leading-relaxed mb-5">
                  {t('mission_p1')}
                </p>
                <p className="text-white/60 leading-relaxed mb-6">
                  {t('mission_p2')}{' '}
                  <em className="text-white">{t('mission_p2_em')}</em>{' '}
                  {t('mission_p2_end')}
                </p>
                <Link href="/upload" className="btn-gold inline-flex">
                  <Upload size={16} />
                  {t('cta_contribute')}
                </Link>
              </div>
              <div className="space-y-4">
                {(locale === 'fr' ? [
                  { emoji: '📸', text: 'Des photos authentiques du quotidien burkinabè' },
                  { emoji: '🎬', text: 'Des vidéos qui montrent la vraie vie du pays' },
                  { emoji: '🌍', text: 'Un SEO optimisé pour dominer Google Images' },
                  { emoji: '🆓', text: 'Tout gratuit, tout libre, pour toujours' },
                  { emoji: '🤝', text: 'Construit par la communauté, pour le monde' },
                ] : [
                  { emoji: '📸', text: 'Authentic photos of everyday Burkinabè life' },
                  { emoji: '🎬', text: 'Videos showing the real life of the country' },
                  { emoji: '🌍', text: 'SEO-optimized to dominate Google Images' },
                  { emoji: '🆓', text: 'Everything free, open, forever' },
                  { emoji: '🤝', text: 'Built by the community, for the world' },
                ]).map(({ emoji, text }) => (
                  <div key={text} className="flex items-start gap-3 p-3 rounded-xl bg-white/3">
                    <span className="text-xl flex-shrink-0">{emoji}</span>
                    <p className="text-white/70 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Chiffres */}
        <section className="mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {chiffres.map(({ valeur, label }) => (
              <div key={label} className="card p-6 text-center animate-fade-in-up">
                <p className="font-display text-4xl text-faso-gold font-bold mb-1">{valeur}</p>
                <p className="text-white/40 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Valeurs */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl text-white mb-3">{t('values_title')}</h2>
            <div className="faso-divider w-24 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valeurs.map(({ icon: Icon, titre, couleur, bg, description }) => (
              <div key={titre} className="card p-6 animate-fade-in-up">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon size={22} className={couleur} />
                </div>
                <h3 className="font-display text-xl text-white mb-3">{titre}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl text-white mb-3">{t('how_title')}</h2>
            <div className="faso-divider w-24 mx-auto" />
          </div>
          <div className="space-y-4">
            {steps.map(({ step, titre, desc }, i) => (
              <div key={step} className={`flex items-start gap-6 card p-6 animate-fade-in-up animate-delay-${i * 100}`}>
                <span className="font-display text-3xl font-bold text-faso-gold/30 flex-shrink-0 w-12">
                  {step}
                </span>
                <div>
                  <h3 className="font-display text-lg text-white mb-2">{titre}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl text-white mb-3">{t('faq_title')}</h2>
            <div className="faso-divider w-24 mx-auto" />
          </div>
          <div className="space-y-4">
            {faq.map(({ question, reponse }) => (
              <details key={question} className="card p-6 group cursor-pointer">
                <summary className="font-medium text-white list-none flex items-center justify-between gap-4">
                  {question}
                  <ArrowRight size={16} className="text-white/30 flex-shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="text-white/50 text-sm leading-relaxed mt-4 pt-4 border-t border-white/5">
                  {reponse}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="text-center">
          <div className="card p-10 border border-faso-gold/20 bg-faso-gold/5">
            <h2 className="font-display text-3xl text-white mb-4">
              {t('join_title')}
            </h2>
            <p className="text-white/50 max-w-xl mx-auto mb-8">
              {t('join_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/upload" className="btn-gold">
                <Upload size={18} />
                {t('cta_photo')}
              </Link>
              <Link href="/guide" className="btn-ghost">
                {t('cta_guide')}
              </Link>
            </div>
            {/* Email de contact */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <a
                href="mailto:BurkinaVista@gmail.com"
                className="inline-flex items-center gap-2 text-sm text-faso-gold hover:text-faso-gold/80 transition-colors"
              >
                <Mail size={16} />
                BurkinaVista@gmail.com
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
