/**
 * app/guide/page.tsx — Guide du contributeur BurkinaVista
 * Comment contribuer, bonnes pratiques, règles, FAQ contributeur
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Camera, Upload, CheckCircle, XCircle, Lightbulb,
  Image, Video, MapPin, Tag, FileText, Clock, Star,
  AlertTriangle, ArrowRight, Smartphone
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Guide du Contributeur — BurkinaVista',
  description:
    'Tout ce que vous devez savoir pour contribuer des photos et vidéos de qualité sur BurkinaVista. Conseils, règles et bonnes pratiques.',
}

const etapesUpload = [
  {
    num: '01',
    titre: 'Préparez votre fichier',
    icon: Camera,
    contenu: [
      'Photos : JPG, PNG ou WebP — minimum 1200px de large recommandé',
      'Vidéos : MP4, MOV ou WebM — maximum 100 MB par fichier',
      'Vérifiez que la qualité est bonne (image nette, bien éclairée)',
      'Vous pouvez soumettre plusieurs fichiers en une seule fois',
    ],
  },
  {
    num: '02',
    titre: 'Rendez-vous sur la page Contribuer',
    icon: Upload,
    contenu: [
      'Pas besoin de créer un compte — le formulaire est accessible à tous',
      'Glissez-déposez vos fichiers ou cliquez pour les sélectionner',
      'La prévisualisation s\'affiche instantanément',
    ],
  },
  {
    num: '03',
    titre: 'Renseignez vos informations',
    icon: FileText,
    contenu: [
      'Prénom, Nom et Email sont obligatoires pour créditer votre œuvre',
      'Le téléphone est optionnel — utile si nous avons besoin de vous contacter',
      'Ces infos ne sont jamais affichées publiquement (seul votre prénom + nom apparaît)',
    ],
  },
  {
    num: '04',
    titre: 'Décrivez votre média',
    icon: Tag,
    contenu: [
      'Titre : court, descriptif — l\'IA peut l\'améliorer si vous le souhaitez',
      'Description : racontez ce que montre votre photo/vidéo',
      'Ville et région : très important pour le référencement géographique',
      'Catégorie : choisissez celle qui correspond le mieux',
      'Tags : mots-clés additionnels (l\'IA en ajoute automatiquement)',
    ],
  },
  {
    num: '05',
    titre: 'Choisissez votre licence',
    icon: CheckCircle,
    contenu: [
      'CC BY (recommandé) : libre d\'utilisation avec citation de votre nom',
      'CC0 : totalement libre, sans obligation de citation',
      'CC BY-NC : libre mais pas d\'usage commercial',
      'CC BY-SA : libre avec partage dans les mêmes conditions',
    ],
  },
  {
    num: '06',
    titre: 'Soumettez et attendez la validation',
    icon: Clock,
    contenu: [
      'Vous recevez un email de confirmation immédiatement',
      'Notre équipe examine votre contribution sous 24 à 48h',
      'En cas de refus, vous recevez un email explicatif',
      'En cas d\'approbation, votre média est publié et référencé sur Google',
    ],
  },
]

const contenusAcceptes = [
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
]

const contenusRefuses = [
  'Images dont vous n\'êtes pas l\'auteur ou pour lesquelles vous n\'avez pas les droits',
  'Contenu à caractère sexuel, pornographique ou suggestif',
  'Images portant atteinte à la dignité ou à la vie privée des personnes',
  'Contenu incitant à la haine, à la discrimination ou à la violence',
  'Images montrant des personnes sans leur consentement apparent',
  'Contenu trompeur, modifié numériquement de manière trompeuse ou fake',
  'Images trop floues, sous-exposées ou de mauvaise qualité technique',
  'Contenu sans rapport avec le Burkina Faso',
  'Doublons — images déjà soumises sur la plateforme',
  'Captures d\'écran, mèmes ou contenus non photographiques',
]

const conseilsQualite = [
  {
    icon: Lightbulb,
    titre: 'Lumière naturelle',
    desc: 'Privilégiez la lumière naturelle, surtout en début ou fin de journée. Évitez les photos en plein soleil de midi qui créent des ombres dures.',
  },
  {
    icon: Camera,
    titre: 'Stabilité',
    desc: 'Tenez votre appareil ou smartphone à deux mains. Pour les vidéos, utilisez un trépied ou appuyez-vous contre un mur pour éviter les tremblements.',
  },
  {
    icon: Image,
    titre: 'Composition',
    desc: 'Appliquez la règle des tiers : imaginez votre image divisée en 9 cases et placez votre sujet principal sur les lignes ou intersections.',
  },
  {
    icon: MapPin,
    titre: 'Contexte',
    desc: 'Une photo avec du contexte vaut mille mots. Montrez l\'environnement, pas juste un détail isolé. Le spectateur doit comprendre où il se trouve.',
  },
  {
    icon: Star,
    titre: 'Authenticité',
    desc: 'Capturez des moments naturels et vrais. Les photos posées sont moins impactantes que les moments spontanés de la vie quotidienne.',
  },
  {
    icon: Smartphone,
    titre: 'Résolution',
    desc: 'Photographiez toujours en haute résolution. Sur smartphone, désactivez la compression dans les paramètres de l\'appareil photo.',
  },
]

const faqContributeur = [
  {
    q: 'Puis-je soumettre des photos prises il y a plusieurs années ?',
    r: 'Oui, l\'ancienneté des photos n\'est pas un critère de refus. Ce qui compte c\'est qu\'elles soient authentiques, de bonne qualité et représentatives du Burkina Faso. Indiquez simplement l\'année de prise de vue dans la description si vous vous en souvenez.',
  },
  {
    q: 'Combien de photos puis-je soumettre ?',
    r: 'Il n\'y a pas de limite. Vous pouvez soumettre plusieurs photos en une seule session via notre formulaire multi-fichiers. Cependant, privilégiez la qualité à la quantité — une belle photo vaut mieux que dix photos médiocres.',
  },
  {
    q: 'Puis-je soumettre des photos de personnes ?',
    r: 'Oui, mais vous devez vous assurer que les personnes représentées ont donné leur consentement à la publication de leur image. Pour les portraits en situation publique (marché, rue), le consentement implicite est généralement suffisant. Pour les portraits posés, obtenez toujours un accord explicite.',
  },
  {
    q: 'Ma photo a été refusée. Que faire ?',
    r: 'Vous recevrez un email expliquant la raison du refus. Selon le motif, vous pourrez parfois recorriger et resoumettre. Si le refus est lié à un problème technique (mauvaise qualité), essayez de corriger l\'image et de la resoumettre. Si le refus est lié au contenu, il est définitif.',
  },
  {
    q: 'Puis-je modifier ma contribution après publication ?',
    r: 'Une fois publiée, vous ne pouvez pas modifier le fichier media lui-même. En revanche, si vous souhaitez modifier les informations (titre, description, ville), contactez-nous avec votre email de contribution et les modifications souhaitées.',
  },
  {
    q: 'Puis-je retirer ma contribution ?',
    r: 'Oui. Contactez-nous avec l\'URL de votre média et votre email de contribution. Nous supprimerons le contenu dans les 48 heures. Notez que les copies déjà téléchargées par d\'autres utilisateurs restent soumises à la licence CC que vous avez choisie.',
  },
  {
    q: 'Est-ce que je serai payé pour mes contributions ?',
    r: 'Non. BurkinaVista est un projet communautaire sans but lucratif. La contribution est bénévole. En échange, votre nom est crédité sur chaque usage de votre photo, ce qui peut vous aider à vous faire connaître comme photographe.',
  },
]

export default function GuidePage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 badge badge-gold mb-6">
            <Camera size={14} />
            Guide du contributeur
          </div>
          <h1 className="font-display text-5xl text-white mb-4">
            Contribuez au{' '}
            <span className="text-gradient-faso">vrai Burkina</span>
          </h1>
          <div className="faso-divider w-24 mx-auto mb-6" />
          <p className="text-white/50 max-w-xl mx-auto leading-relaxed">
            Tout ce que vous devez savoir pour partager des photos et vidéos
            authentiques du Burkina Faso sur BurkinaVista.
          </p>
        </div>

        {/* CTA rapide */}
        <div className="card p-6 border border-faso-gold/20 bg-faso-gold/5 mb-16 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <p className="font-medium text-white">Prêt à contribuer ?</p>
            <p className="text-white/40 text-sm">Pas besoin de compte — 5 minutes suffisent</p>
          </div>
          <Link href="/upload" className="btn-gold flex-shrink-0">
            <Upload size={16} />
            Commencer maintenant
          </Link>
        </div>

        {/* Étapes */}
        <section className="mb-16">
          <h2 className="font-display text-3xl text-white mb-8 text-center">
            Comment ça marche — étape par étape
          </h2>
          <div className="space-y-4">
            {etapesUpload.map(({ num, titre, icon: Icon, contenu }) => (
              <div key={num} className="card p-6 flex items-start gap-5">
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
          <h2 className="font-display text-3xl text-white mb-8 text-center">
            Quoi soumettre
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 border border-faso-green/20">
              <h3 className="font-medium text-faso-green flex items-center gap-2 mb-4">
                <CheckCircle size={18} />
                Contenus acceptés
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
                Contenus refusés
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
          <h2 className="font-display text-3xl text-white mb-8 text-center">
            Conseils pour de belles photos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conseilsQualite.map(({ icon: Icon, titre, desc }) => (
              <div key={titre} className="card p-5">
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
              <h3 className="font-medium text-white mb-2">Droits d'auteur et consentement</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                En soumettant un média, vous confirmez en être l'auteur original ou détenir
                tous les droits nécessaires. Vous confirmez également avoir obtenu le
                consentement des personnes représentées si nécessaire. Toute violation
                de ces règles peut entraîner des poursuites judiciaires.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="font-display text-3xl text-white mb-8 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-3">
            {faqContributeur.map(({ q, r }) => (
              <details key={q} className="card p-6 group cursor-pointer">
                <summary className="font-medium text-white list-none flex items-center justify-between gap-4">
                  {q}
                  <ArrowRight
                    size={16}
                    className="text-white/30 flex-shrink-0 transition-transform group-open:rotate-90"
                  />
                </summary>
                <p className="text-white/50 text-sm leading-relaxed mt-4 pt-4 border-t border-white/5">
                  {r}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <div className="text-center">
          <div className="card p-10 border border-faso-gold/20 bg-faso-gold/5">
            <Camera size={40} className="text-faso-gold mx-auto mb-4" />
            <h2 className="font-display text-3xl text-white mb-4">
              Vous avez tout ce qu'il faut
            </h2>
            <p className="text-white/50 max-w-md mx-auto mb-8">
              Votre appareil photo, votre regard et votre connaissance du Burkina Faso
              sont les meilleurs outils. Le reste, on s'en occupe.
            </p>
            <Link href="/upload" className="btn-gold">
              <Upload size={18} />
              Contribuer maintenant
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}