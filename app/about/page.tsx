/**
 * app/about/page.tsx — Page À propos de BurkinaVista
 * Présentation du projet, mission, valeurs, équipe
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Upload, Globe, Shield, Heart, Camera, Users, Star, ArrowRight } from 'lucide-react'
import FasoLogo from '@/components/ui/FasoLogo'

export const metadata: Metadata = {
  title: 'À propos — BurkinaVista',
  description:
    'Découvrez BurkinaVista, la bibliothèque visuelle libre et authentique du Burkina Faso. Notre mission, nos valeurs et comment nous travaillons.',
  openGraph: {
    title: 'À propos — BurkinaVista',
    description: 'La bibliothèque visuelle libre du Burkina Faso — Notre histoire et notre mission.',
  },
}

const valeurs = [
  {
    icon: Camera,
    titre: 'Authenticité',
    couleur: 'text-faso-red',
    bg: 'bg-faso-red/10',
    description:
      'Nous ne publions que des images réelles du Burkina Faso, prises par des personnes qui connaissent et vivent le pays. Pas de clichés misérabilistes, pas d\'exotisme de façade — juste la réalité telle qu\'elle est.',
  },
  {
    icon: Globe,
    titre: 'Accessibilité',
    couleur: 'text-faso-gold',
    bg: 'bg-faso-gold/10',
    description:
      'Toutes nos photos et vidéos sont libres de droits, sous licences Creative Commons. Journalistes, designers, chercheurs, enseignants — tout le monde peut utiliser ces ressources sans frais.',
  },
  {
    icon: Users,
    titre: 'Communauté',
    couleur: 'text-faso-green',
    bg: 'bg-faso-green/10',
    description:
      'BurkinaVista est construit par et pour les Burkinabè. Chaque contributeur — photographe amateur ou professionnel — enrichit notre patrimoine visuel collectif.',
  },
  {
    icon: Shield,
    titre: 'Transparence',
    couleur: 'text-blue-400',
    bg: 'bg-blue-400/10',
    description:
      'Chaque image est vérifiée avant publication. Nous indiquons clairement l\'auteur, la licence applicable et les conditions d\'utilisation de chaque média.',
  },
]

const chiffres = [
  { valeur: '10+', label: 'Catégories', icon: Star },
  { valeur: '13', label: 'Régions couvertes', icon: Globe },
  { valeur: 'CC', label: 'Licences libres', icon: Shield },
  { valeur: '100%', label: 'Gratuit', icon: Heart },
]

const faq = [
  {
    question: 'Qui peut contribuer ?',
    reponse:
      'Tout le monde peut contribuer — photographes amateurs ou professionnels, burkinabè de la diaspora ou résidents. Pas besoin de créer un compte. Il suffit de remplir le formulaire d\'upload avec vos coordonnées et votre média.',
  },
  {
    question: 'Comment les photos sont-elles vérifiées ?',
    reponse:
      'Chaque média soumis est examiné par notre équipe de modération avant publication. Nous vérifions l\'authenticité, la qualité, le respect des droits d\'auteur et la pertinence par rapport au Burkina Faso.',
  },
  {
    question: 'Pourquoi utiliser des licences Creative Commons ?',
    reponse:
      'Les licences CC permettent un partage légal et clair. Elles protègent les auteurs (en imposant la citation) tout en permettant la diffusion maximale des images. C\'est le standard international pour les bibliothèques d\'images libres.',
  },
  {
    question: 'BurkinaVista est-il gratuit ?',
    reponse:
      'Oui, totalement. La consultation, la recherche et le téléchargement sont gratuits pour tous. La contribution est aussi gratuite et ouverte.',
  },
  {
    question: 'Comment puis-je signaler un problème ?',
    reponse:
      'Pour signaler une image inappropriée, un problème de droit d\'auteur ou tout autre souci, contactez-nous directement via le formulaire de contact ou par email.',
  },
  {
    question: 'Puis-je utiliser les images à des fins commerciales ?',
    reponse:
      'Ça dépend de la licence choisie par le contributeur. Les images sous CC0 et CC BY peuvent être utilisées commercialement. Les images sous CC BY-NC ne le permettent pas. La licence est clairement indiquée sur chaque page média.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-8">
            <FasoLogo size={56} showName={false} />
          </div>
          <div className="inline-flex items-center gap-2 badge badge-gold mb-6">
            🇧🇫 Notre histoire
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-6 leading-tight">
            Raconter le Burkina Faso{' '}
            <span className="text-gradient-faso">tel qu'il est</span>
          </h1>
          <div className="faso-divider w-32 mx-auto mb-8" />
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            BurkinaVista est né d'un constat simple : les médias internationaux utilisent
            des images caduques, déformées et non représentatives du Burkina Faso réel.
            Nous avons décidé de changer ça.
          </p>
        </div>

        {/* Notre mission */}
        <section className="mb-20">
          <div className="card p-8 md:p-12 border border-faso-gold/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="badge badge-gold mb-4 inline-block">Notre mission</span>
                <h2 className="font-display text-3xl text-white mb-5">
                  Occuper l'espace médiatique avec la vérité
                </h2>
                <p className="text-white/60 leading-relaxed mb-5">
                  Trop longtemps, l'image du Burkina Faso à l'international a été définie
                  par d'autres — souvent avec des photos de décharges, de conflits ou de
                  misère qui ne représentent pas la richesse culturelle, architecturale et
                  humaine de notre pays.
                </p>
                <p className="text-white/60 leading-relaxed mb-6">
                  BurkinaVista donne aux Burkinabè les outils pour raconter leur propre
                  histoire. Quand un journaliste, un designer ou un chercheur cherche une
                  image du Burkina Faso sur Google, ce sont <em className="text-white">nos images</em> qui
                  doivent apparaître.
                </p>
                <Link href="/upload" className="btn-gold inline-flex">
                  <Upload size={16} />
                  Contribuer maintenant
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  { emoji: '📸', text: 'Des photos authentiques du quotidien burkinabè' },
                  { emoji: '🎬', text: 'Des vidéos qui montrent la vraie vie du pays' },
                  { emoji: '🌍', text: 'Un SEO optimisé pour dominer Google Images' },
                  { emoji: '🆓', text: 'Tout gratuit, tout libre, pour toujours' },
                  { emoji: '🤝', text: 'Construit par la communauté, pour le monde' },
                ].map(({ emoji, text }) => (
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
            {chiffres.map(({ valeur, label, icon: Icon }) => (
              <div key={label} className="card p-6 text-center">
                <p className="font-display text-4xl text-faso-gold font-bold mb-1">{valeur}</p>
                <p className="text-white/40 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Valeurs */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl text-white mb-3">Nos valeurs</h2>
            <div className="faso-divider w-24 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valeurs.map(({ icon: Icon, titre, couleur, bg, description }) => (
              <div key={titre} className="card p-6">
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
            <h2 className="font-display text-3xl text-white mb-3">Comment ça marche</h2>
            <div className="faso-divider w-24 mx-auto" />
          </div>
          <div className="space-y-4">
            {[
              {
                step: '01',
                titre: 'Vous prenez une photo ou une vidéo',
                desc: 'N\'importe où au Burkina Faso — une rue, un marché, un monument, un festival, un plat, un paysage. Tout ce qui montre la vraie vie du pays.',
              },
              {
                step: '02',
                titre: 'Vous la soumettez sur BurkinaVista',
                desc: 'Via notre formulaire simple — pas besoin de créer un compte. Vous renseignez votre nom, email, une description et quelques infos sur le lieu.',
              },
              {
                step: '03',
                titre: 'Notre IA optimise le référencement',
                desc: 'Gemini AI analyse votre image et génère automatiquement un titre SEO, une description détaillée et des tags en français et en anglais pour que votre image soit trouvée partout.',
              },
              {
                step: '04',
                titre: 'Notre équipe valide',
                desc: 'Chaque média est vérifié sous 48h par notre équipe de modération. Nous nous assurons de la qualité, de l\'authenticité et du respect des conditions d\'utilisation.',
              },
              {
                step: '05',
                titre: 'Le monde entier peut voir le vrai Burkina',
                desc: 'Une fois publié, votre média est référencé sur Google Images, intégré au sitemap et diffusé à notre communauté. Votre nom est crédité sur chaque utilisation.',
              },
            ].map(({ step, titre, desc }, i) => (
              <div key={step} className="flex items-start gap-6 card p-6">
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
            <h2 className="font-display text-3xl text-white mb-3">Questions fréquentes</h2>
            <div className="faso-divider w-24 mx-auto" />
          </div>
          <div className="space-y-4">
            {faq.map(({ question, reponse }) => (
              <details
                key={question}
                className="card p-6 group cursor-pointer"
              >
                <summary className="font-medium text-white list-none flex items-center justify-between gap-4">
                  {question}
                  <ArrowRight
                    size={16}
                    className="text-white/30 flex-shrink-0 transition-transform group-open:rotate-90"
                  />
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
              Rejoignez le mouvement
            </h2>
            <p className="text-white/50 max-w-xl mx-auto mb-8">
              Chaque photo que vous partagez est un acte de souveraineté narrative.
              Ensemble, nous pouvons changer l'image du Burkina Faso dans le monde.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/upload" className="btn-gold">
                <Upload size={18} />
                Contribuer une photo
              </Link>
              <Link href="/guide" className="btn-ghost">
                Lire le guide du contributeur
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}