/**
 * app/licences/page.tsx — Page des licences Creative Commons
 * Explication complète des licences utilisées sur BurkinaVista
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, XCircle, ExternalLink, Info, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Licences Creative Commons — BurkinaVista',
  description:
    'Comprendre les licences Creative Commons utilisées sur BurkinaVista. Comment utiliser légalement les photos et vidéos du Burkina Faso.',
}

const licences = [
  {
    code: 'CC0',
    nom: 'Domaine Public',
    badge: 'badge-green',
    couleur: 'text-faso-green',
    bg: 'bg-faso-green/10',
    border: 'border-faso-green/20',
    emoji: '🟢',
    description:
      'Le contributeur renonce à tous ses droits d\'auteur. L\'image appartient au domaine public. Vous pouvez faire absolument tout ce que vous voulez avec.',
    peutFaire: [
      'Utiliser gratuitement',
      'Modifier et adapter',
      'Utiliser commercialement',
      'Redistribuer',
      'Pas besoin de citer l\'auteur',
    ],
    nePeutPasFaire: [],
    url: 'https://creativecommons.org/publicdomain/zero/1.0/deed.fr',
  },
  {
    code: 'CC BY',
    nom: 'Attribution',
    badge: 'badge-gold',
    couleur: 'text-faso-gold',
    bg: 'bg-faso-gold/10',
    border: 'border-faso-gold/20',
    emoji: '🟡',
    description:
      'Vous pouvez utiliser, modifier et distribuer l\'image — même commercialement — à condition de citer l\'auteur original. C\'est la licence recommandée sur BurkinaVista.',
    peutFaire: [
      'Utiliser gratuitement',
      'Modifier et adapter',
      'Utiliser commercialement',
      'Redistribuer',
    ],
    nePeutPasFaire: [
      'Utiliser sans citer l\'auteur',
    ],
    url: 'https://creativecommons.org/licenses/by/4.0/deed.fr',
  },
  {
    code: 'CC BY-SA',
    nom: 'Attribution — Partage dans les mêmes conditions',
    badge: 'badge-gold',
    couleur: 'text-faso-gold',
    bg: 'bg-faso-gold/10',
    border: 'border-faso-gold/20',
    emoji: '🟡',
    description:
      'Vous pouvez utiliser et modifier l\'image, même commercialement, à condition de citer l\'auteur ET de redistribuer vos créations sous la même licence.',
    peutFaire: [
      'Utiliser gratuitement',
      'Modifier et adapter',
      'Utiliser commercialement',
    ],
    nePeutPasFaire: [
      'Utiliser sans citer l\'auteur',
      'Redistribuer sous une licence plus restrictive',
    ],
    url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.fr',
  },
  {
    code: 'CC BY-NC',
    nom: 'Attribution — Pas d\'utilisation commerciale',
    badge: 'badge-red',
    couleur: 'text-faso-red',
    bg: 'bg-faso-red/10',
    border: 'border-faso-red/20',
    emoji: '🔴',
    description:
      'Vous pouvez utiliser et modifier l\'image gratuitement à des fins non commerciales, à condition de citer l\'auteur. Les usages commerciaux sont interdits.',
    peutFaire: [
      'Utiliser gratuitement (non commercial)',
      'Modifier et adapter',
      'Redistribuer (non commercial)',
    ],
    nePeutPasFaire: [
      'Utiliser à des fins commerciales',
      'Utiliser sans citer l\'auteur',
    ],
    url: 'https://creativecommons.org/licenses/by-nc/4.0/deed.fr',
  },
]

const usageCases = [
  {
    titre: 'Article de presse ou blog',
    licences: ['CC0', 'CC BY', 'CC BY-SA', 'CC BY-NC'],
    note: 'Citez toujours l\'auteur et indiquez la source BurkinaVista.',
  },
  {
    titre: 'Publication commerciale (magazine, pub)',
    licences: ['CC0', 'CC BY', 'CC BY-SA'],
    note: 'Les images CC BY-NC sont interdites pour cet usage.',
  },
  {
    titre: 'Présentation scolaire ou universitaire',
    licences: ['CC0', 'CC BY', 'CC BY-SA', 'CC BY-NC'],
    note: 'Tous les types sont autorisés pour l\'éducation.',
  },
  {
    titre: 'Site web ou application',
    licences: ['CC0', 'CC BY', 'CC BY-SA'],
    note: 'Si votre site génère des revenus, évitez les CC BY-NC.',
  },
  {
    titre: 'ONG, association, projet humanitaire',
    licences: ['CC0', 'CC BY', 'CC BY-SA', 'CC BY-NC'],
    note: 'Les activités sans but lucratif sont considérées non commerciales.',
  },
]

export default function LicencesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 badge badge-gold mb-6">
            ⚖️ Licences & Droits d'utilisation
          </div>
          <h1 className="font-display text-5xl text-white mb-4">
            Utiliser nos médias{' '}
            <span className="text-gradient-gold">légalement</span>
          </h1>
          <div className="faso-divider w-24 mx-auto mb-6" />
          <p className="text-white/50 max-w-xl mx-auto leading-relaxed">
            Tous les médias de BurkinaVista sont publiés sous licences Creative Commons.
            Voici tout ce que vous devez savoir pour les utiliser correctement.
          </p>
        </div>

        {/* Intro CC */}
        <div className="card p-6 border border-faso-gold/10 mb-12 flex items-start gap-4">
          <Info size={20} className="text-faso-gold flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-medium text-white mb-2">Qu'est-ce que Creative Commons ?</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Creative Commons (CC) est une organisation à but non lucratif qui propose
              des licences standardisées permettant aux créateurs de partager leurs œuvres
              légalement. Ces licences sont reconnues mondialement et offrent un cadre
              juridique clair pour l'utilisation des contenus.{' '}
              <a
                href="https://creativecommons.org/licenses/?lang=fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-faso-gold hover:underline inline-flex items-center gap-1"
              >
                En savoir plus <ExternalLink size={12} />
              </a>
            </p>
          </div>
        </div>

        {/* Les 4 licences */}
        <section className="mb-16">
          <h2 className="font-display text-2xl text-white mb-8 text-center">
            Les licences disponibles sur BurkinaVista
          </h2>
          <div className="space-y-6">
            {licences.map((lic) => (
              <div key={lic.code} className={`card p-6 border ${lic.border}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`font-display text-2xl font-bold ${lic.couleur}`}>
                        {lic.code}
                      </span>
                      <span className={`badge ${lic.badge} text-xs`}>{lic.emoji}</span>
                    </div>
                    <p className="text-white/60 text-sm">{lic.nom}</p>
                  </div>
                  <a
                    href={lic.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-white/30 hover:text-faso-gold transition-colors"
                  >
                    Texte légal <ExternalLink size={11} />
                  </a>
                </div>

                <p className="text-white/50 text-sm leading-relaxed mb-5">
                  {lic.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ce qu'on peut faire */}
                  <div>
                    <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
                      ✅ Autorisé
                    </p>
                    <ul className="space-y-2">
                      {lic.peutFaire.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                          <CheckCircle size={14} className="text-faso-green flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ce qu'on ne peut pas faire */}
                  {lic.nePeutPasFaire.length > 0 && (
                    <div>
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
                        ❌ Interdit
                      </p>
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
            Comment citer correctement un auteur
          </h2>
          <div className="card p-6 border border-faso-gold/10">
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              Lorsque la licence exige une attribution (CC BY, CC BY-SA, CC BY-NC),
              voici le format recommandé :
            </p>
            <div className="bg-white/5 rounded-xl p-4 font-mono text-sm text-white/70 mb-5">
              Photo : <span className="text-faso-gold">[Prénom Nom de l'auteur]</span> /{' '}
              <span className="text-faso-green">BurkinaVista</span> —
              Licence <span className="text-faso-red">[CC BY / CC0 / ...]</span>
            </div>
            <p className="text-white/30 text-xs">
              Exemple : Photo : Amadou Konaté / BurkinaVista — Licence CC BY 4.0
            </p>
          </div>
        </section>

        {/* Tableau des usages */}
        <section className="mb-16">
          <h2 className="font-display text-2xl text-white mb-6">
            Quelle licence pour quel usage ?
          </h2>
          <div className="space-y-3">
            {usageCases.map(({ titre, licences: lics, note }) => (
              <div key={titre} className="card p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                  <p className="font-medium text-white text-sm flex-shrink-0 md:w-56">{titre}</p>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {(['CC0', 'CC BY', 'CC BY-SA', 'CC BY-NC'] as const).map((code) => (
                      <span
                        key={code}
                        className={`badge text-xs ${
                          lics.includes(code)
                            ? code === 'CC BY-NC'
                              ? 'badge-gold'
                              : 'badge-green'
                            : 'badge-red opacity-40'
                        }`}
                      >
                        {lics.includes(code) ? '✓' : '✗'} {code}
                      </span>
                    ))}
                  </div>
                </div>
                {note && (
                  <p className="text-white/30 text-xs mt-3 flex items-center gap-1.5">
                    <Info size={11} /> {note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Avertissement */}
        <div className="card p-6 border border-yellow-500/20 bg-yellow-500/5 mb-12">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-2">Important à savoir</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                BurkinaVista n'est pas responsable d'une mauvaise utilisation des médias
                par les utilisateurs. Il vous appartient de vérifier la licence de chaque
                image avant utilisation. En cas de doute, contactez directement l'auteur
                via BurkinaVista.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <p className="text-white/40 text-sm mb-4">
            Une question sur les licences ou un problème de droits ?
          </p>
          <Link href="/about" className="btn-ghost text-sm py-2 px-5">
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  )
}